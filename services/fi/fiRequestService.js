const httpClient = require('../httpClient');
const { ConsentRequest } = require('../../models');
const { validateDate } = require('../../utils/validators');

/**
 * FI Request Service
 * Handles financial information data requests to FIPs via Account Aggregator
 */
class FIRequestService {
  constructor() {
    this.baseURL = process.env.SAAFE_API_BASE_URL || 'https://uat.tsp.api.saafe.tech';
    this.txnCallbackUrl = process.env.TXN_CALLBACK_URL || `${process.env.BASE_URL || 'http://localhost:3000'}/webhooks/aa/txn`;
  }

  /**
   * Categorize error messages into error categories
   */
  categorizeError(errorMessage) {
    if (!errorMessage) return 'UNKNOWN';

    const message = errorMessage.toLowerCase();

    // INPUT_VALIDATION errors
    if (
      message.includes('date range cannot be in the future') ||
      message.includes('ver: field required') ||
      message.includes('timestamp: required') ||
      message.includes('field required')
    ) {
      return 'INPUT_VALIDATION';
    }

    // CONSENT_ISSUES errors
    if (
      message.includes('consent details not found') ||
      message.includes('invalid consent id') ||
      message.includes('consentid mismatch') ||
      message.includes('consent details not found')
    ) {
      return 'CONSENT_ISSUES';
    }

    // AA_RESPONSE_VALIDATION errors
    if (
      message.includes('invalid response from aa') ||
      message.includes('x-jws-signature mismatch') ||
      message.includes('missing required headers') ||
      message.includes('invalid response format') ||
      message.includes('invalid certificate') ||
      message.includes('txnid or sessionid mismatch') ||
      message.includes('invalid timestamp') ||
      message.includes('missing timestamp')
    ) {
      return 'AA_RESPONSE_VALIDATION';
    }

    // INFRA_NETWORK errors
    if (
      message.includes('connection timeout') ||
      message.includes('key generation failed') ||
      message.includes('access token generation failed')
    ) {
      return 'INFRA_NETWORK';
    }

    return 'UNKNOWN';
  }

  /**
   * Validate date range according to business rules
   */
  validateDateRange(fromDate, toDate, consentStart, consentExpiry) {
    const errors = [];

    // Validate date format
    const fromValidation = validateDate(fromDate, 'From date');
    if (!fromValidation.valid) {
      errors.push(fromValidation.error);
    }

    const toValidation = validateDate(toDate, 'To date');
    if (!toValidation.valid) {
      errors.push(toValidation.error);
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const consentStartDate = new Date(consentStart);
    const consentExpiryDate = new Date(consentExpiry);

    // Rule 1: from_date must be before to_date
    if (from >= to) {
      errors.push('From date must be before to date');
    }

    // Rule 2: No future dates
    if (from > today || to > today) {
      errors.push('Date range cannot be in the future');
    }

    // Rule 3: Maximum range is 2 years
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const rangeInDays = Math.abs((to - from) / (1000 * 60 * 60 * 24));
    const maxDays = 2 * 365; // 2 years

    if (rangeInDays > maxDays) {
      errors.push(`Date range cannot exceed 2 years (${Math.ceil(rangeInDays)} days requested)`);
    }

    // Rule 4: Date range must fall within consent period
    if (from < consentStartDate) {
      errors.push(`From date (${fromDate}) is before consent start date (${consentStart})`);
    }

    if (to > consentExpiryDate) {
      errors.push(`To date (${toDate}) is after consent expiry date (${consentExpiry})`);
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * Calculate default date range from consent details
   */
  calculateDefaultDateRange(consentDetails) {
    // consent_details is an array with one object
    const consentDetail = Array.isArray(consentDetails) ? consentDetails[0] : consentDetails;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use consent's data range if available
    if (consentDetail.fi_datarange_from && consentDetail.fi_datarange_to) {
      return {
        from: consentDetail.fi_datarange_from,
        to: consentDetail.fi_datarange_to
      };
    }

    // Default: last 2 years or consent period, whichever is smaller
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const consentStart = new Date(consentDetail.consent_start);
    const consentExpiry = new Date(consentDetail.consent_expiry);
    
    // Use the later of: consent_start or 2 years ago
    const from = consentStart > twoYearsAgo ? consentDetail.consent_start : twoYearsAgo.toISOString().split('T')[0];
    
    // Use the earlier of: consent_expiry or today
    const to = consentExpiry < today ? consentDetail.consent_expiry : today.toISOString().split('T')[0];

    return { from, to };
  }

  /**
   * Trigger FI data request for an active consent
   */
  async triggerFIRequest(consentId, options = {}) {
    try {
      console.log(`🚀 Initiating FI request for consent_id: ${consentId}`);

      // Find consent by consent_id
      const consent = await ConsentRequest.findOne({ consent_id: consentId });

      if (!consent) {
        throw new Error(`Consent with consent_id ${consentId} not found`);
      }

      // Validate consent is ACTIVE
      if (consent.status !== 'ACTIVE') {
        throw new Error(`Consent is not ACTIVE. Current status: ${consent.status}. FI requests can only be made for ACTIVE consents.`);
      }

      if (!consent.consent_id) {
        throw new Error('Consent ID is missing. Consent must be ACTIVE with a valid consent_id.');
      }

      console.log(`✅ Consent found and validated - Status: ${consent.status}`);

      // Get date range from options or calculate from consent
      const consentDetails = consent.consent_details;
      const defaultRange = this.calculateDefaultDateRange(consentDetails);
      
      const fromDate = options.from || defaultRange.from;
      const toDate = options.to || defaultRange.to;

      console.log(`📅 Date range: ${fromDate} to ${toDate}`);

      // Validate date range
      const consentDetail = Array.isArray(consentDetails) ? consentDetails[0] : consentDetails;
      const validation = this.validateDateRange(
        fromDate,
        toDate,
        consentDetail.consent_start,
        consentDetail.consent_expiry
      );

      if (!validation.valid) {
        throw new Error(`Date range validation failed: ${validation.errors.join(', ')}`);
      }

      console.log('✅ Date range validated successfully');

      // Build FI request payload
      const payload = {
        consent_id: consent.consent_id
      };

      // Add optional fields only if provided
      if (fromDate) {
        payload.from = fromDate;
      }

      if (toDate) {
        payload.to = toDate;
      }

      if (options.txn_callback_url) {
        payload.txn_callback_url = options.txn_callback_url;
      } else {
        payload.txn_callback_url = this.txnCallbackUrl;
      }

      console.log('📤 Calling Saafe API: POST /api/data/request');
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));

      // Call Saafe FI request API
      const response = await httpClient.post('/api/data/request', payload);

      console.log('📥 Raw response received:', JSON.stringify(response.data, null, 2));

      // Check if response indicates an error
      if (response.data.status === 'error' || !response.data.success) {
        const errorMsg = response.data.message || response.data.errorMsg || 'Unknown error from Saafe API';
        const errorCategory = this.categorizeError(errorMsg);
        
        console.error(`❌ Saafe API returned error [${errorCategory}]:`, errorMsg);

        // Don't update consent if validation error (can retry with correct data)
        if (errorCategory !== 'INPUT_VALIDATION') {
          // Mark FI request as failed (optional - could track separately)
          await ConsentRequest.findByIdAndUpdate(consent._id, {
            $set: {
              fi_request_initiated: false
            }
          });
        }

        return {
          success: false,
          error: errorMsg,
          error_category: errorCategory,
          details: response.data,
          retry_recommended: errorCategory === 'INFRA_NETWORK' || errorCategory === 'AA_RESPONSE_VALIDATION'
        };
      }

      // Check if response is successful
      if (response.data.status === 'success' && response.data.data) {
        const data = response.data.data;
        
        const sessionId = data.sessionId;
        const txnid = data.txnid;
        const consentIdResponse = data.consentId;

        console.log('✅ FI request initiated successfully!');
        console.log(`   Session ID: ${sessionId}`);
        console.log(`   Transaction ID: ${txnid}`);
        console.log(`   Consent ID: ${consentIdResponse}`);

        // Update consent request to mark FI request as initiated
        await ConsentRequest.findByIdAndUpdate(consent._id, {
          $set: {
            fi_request_initiated: true,
            fi_request_initiated_at: new Date()
          }
        });

        console.log('💾 Consent request updated - FI request initiated');

        return {
          success: true,
          session_id: sessionId,
          txn_id: txnid,
          consent_id: consentIdResponse,
          ver: data.ver,
          timestamp: data.timestamp,
          response: data.response,
          raw_response: response.data
        };
      } else {
        // Unexpected response format
        console.error('❌ Unexpected response format:', JSON.stringify(response.data, null, 2));
        const errorMsg = response.data?.message || response.data?.errorMsg || 'Invalid response format from Saafe API';
        return {
          success: false,
          error: errorMsg,
          error_category: 'UNKNOWN',
          details: response.data
        };
      }
    } catch (error) {
      console.error('❌ FI request failed:', error.message);
      console.error('❌ Error stack:', error.stack);

      let errorMessage = error.message;
      let errorDetails = null;
      let errorCategory = 'UNKNOWN';

      if (error.response) {
        // HTTP error response from Saafe
        errorDetails = error.response.data || null;
        errorMessage = error.response.data?.message 
          || error.response.data?.errorMsg 
          || error.response.data?.error 
          || `HTTP ${error.response.status}: ${error.message}`;
        
        errorCategory = this.categorizeError(errorMessage);
        
        console.error('📥 Error response from Saafe:', JSON.stringify(errorDetails, null, 2));
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response received from Saafe API. Please check your network connection.';
        errorCategory = 'INFRA_NETWORK';
        console.error('❌ No response received from Saafe API');
      }

      // Error logging
      console.error('Error details:', {
        context: 'FI_REQUEST',
        error_category: errorCategory,
        error_message: errorMessage,
        http_status_code: error.response?.status || null,
        raw_response: errorDetails
      });

      return {
        success: false,
        error: errorMessage,
        error_category: errorCategory,
        details: errorDetails,
        retry_recommended: errorCategory === 'INFRA_NETWORK'
      };
    }
  }

  /**
   * Trigger FI request by txn_id (alternative method)
   */
  async triggerFIRequestByTxnId(txnId, options = {}) {
    try {
      // Find consent by txn_id
      const consent = await ConsentRequest.findOne({ txn_id: txnId });

      if (!consent) {
        throw new Error(`Consent with txn_id ${txnId} not found`);
      }

      if (!consent.consent_id) {
        throw new Error('Consent ID is missing. Cannot trigger FI request without consent_id.');
      }

      // Use consent_id to trigger FI request
      return await this.triggerFIRequest(consent.consent_id, options);
    } catch (error) {
      console.error('❌ FI request by txn_id failed:', error.message);
      return {
        success: false,
        error: error.message,
        error_category: 'CONSENT_ISSUES'
      };
    }
  }
}

// Export singleton instance
module.exports = new FIRequestService();

