const httpClient = require('../httpClient');
const { ConsentRequest, TxnStatusHistory } = require('../../models');
const {
  validateMobileNumber,
  validateEmail,
  validateDate,
  validatePAN,
  validateFITypes,
  validateDeliveryMode,
  validateFIPIds
} = require('../../utils/validators');

/**
 * Consent Service
 * Handles consent generation according to Saafe TSP API documentation
 * Strictly follows API specifications to avoid Fair Use Policy errors
 */
class ConsentService {
  constructor() {
    this.baseURL = process.env.SAAFE_API_BASE_URL || 'https://uat.tsp.api.saafe.tech';
    this.txnCallbackUrl = process.env.TXN_CALLBACK_URL || `${process.env.BASE_URL || 'http://localhost:3001'}/webhooks/aa/txn`;
    // Frontend success page URL - Saafe will redirect here after consent approval
    // Use port 3004 if that's where your frontend is running
    this.consentCallbackUrl = process.env.CONSENT_CALLBACK_URL || `${process.env.FRONTEND_URL || 'http://localhost:3004'}/success`;
  }

  /**
   * Calculate consent start date (default: today)
   */
  calculateConsentStart() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Calculate consent expiry date (default: 1 year from start)
   */
  calculateConsentExpiry(consentStart) {
    const startDate = new Date(consentStart);
    startDate.setFullYear(startDate.getFullYear() + 1);
    return startDate.toISOString().split('T')[0];
  }

  /**
   * Calculate data range from date (today minus N months)
   */
  calculateDataRangeFrom(unit, value) {
    const today = new Date();
    if (unit === 'MONTH') {
      today.setMonth(today.getMonth() - value);
    } else if (unit === 'YEAR') {
      today.setFullYear(today.getFullYear() - value);
    }
    return today.toISOString().split('T')[0];
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Build customer_details object
   * Only includes: mobile_number (mandatory), email, date_of_birth, pan_number (all optional)
   */
  buildCustomerDetails(input) {
    const customerDetails = {};

    // Mobile number is mandatory
    if (!input.mobile) {
      throw new Error('mobile_number is required in customer_details');
    }

    const mobileValidation = validateMobileNumber(input.mobile);
    if (!mobileValidation.valid) {
      throw new Error(mobileValidation.error);
    }
    customerDetails.mobile_number = input.mobile;

    // Email (optional)
    if (input.email) {
      const emailValidation = validateEmail(input.email);
      if (!emailValidation.valid) {
        throw new Error(emailValidation.error);
      }
      customerDetails.email = input.email;
    }

    // Date of birth (optional)
    if (input.dob || input.date_of_birth) {
      const dob = input.dob || input.date_of_birth;
      const dobValidation = validateDate(dob, 'Date of birth');
      if (!dobValidation.valid) {
        throw new Error(dobValidation.error);
      }
      customerDetails.date_of_birth = dob;
    }

    // PAN number (optional)
    if (input.pan || input.pan_number) {
      const pan = input.pan || input.pan_number;
      const panValidation = validatePAN(pan);
      if (!panValidation.valid) {
        throw new Error(panValidation.error);
      }
      customerDetails.pan_number = pan.toUpperCase();
    }

    return customerDetails;
  }

  /**
   * Build consent_details array (single object)
   * Strictly follows Saafe API documentation structure
   */
  buildConsentDetails(input) {
    const {
      consent_start_date,
      consent_expiry_date,
      fi_datarange_unit = 'MONTH',
      fi_datarange_value = 6,
      fi_datarange_from,
      fi_datarange_to,
      purpose_code = '102',
      consent_mode = 'STORE',
      consent_types = ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
      fetch_type = 'PERIODIC', // Always PERIODIC per requirements
    } = input;

    // HARDCODED WORKING PARAMETERS (verified in Postman)
    const fi_types = ["DEPOSIT"]; // Do not allow other types
    const frequency_unit = "MONTH"; // CRITICAL: "DAY" causes errors
    const frequency_value = 4; // CRITICAL: 100 causes errors
    const data_life_unit = "DAY";
    const data_life_value = 1;

    // Calculate dates
    const consentStart = consent_start_date || this.calculateConsentStart();
    const consentExpiry = consent_expiry_date || this.calculateConsentExpiry(consentStart);
    const dataRangeFrom = fi_datarange_from || this.calculateDataRangeFrom(fi_datarange_unit, fi_datarange_value);
    const dataRangeTo = fi_datarange_to || this.getTodayDate();

    // Note: data_life fields are optional per documentation
    // Only include them if explicitly provided to avoid fair use policy errors

    // Validate dates
    const startValidation = validateDate(consentStart, 'Consent start date');
    if (!startValidation.valid) {
      throw new Error(startValidation.error);
    }

    const expiryValidation = validateDate(consentExpiry, 'Consent expiry date');
    if (!expiryValidation.valid) {
      throw new Error(expiryValidation.error);
    }

    const fromValidation = validateDate(dataRangeFrom, 'Data range from date');
    if (!fromValidation.valid) {
      throw new Error(fromValidation.error);
    }

    const toValidation = validateDate(dataRangeTo, 'Data range to date');
    if (!toValidation.valid) {
      throw new Error(toValidation.error);
    }

    // Build consent detail object (strict structure)
    // Include data_life fields with DAY/1 to avoid Fair Use Policy errors
    const consentDetail = {
      consent_start: consentStart,
      consent_expiry: consentExpiry,
      consent_mode: consent_mode || "STORE",
      consent_types: consent_types || ["PROFILE", "SUMMARY", "TRANSACTIONS"],
      fetch_type: fetch_type || "PERIODIC",
      fi_types: fi_types,
      purpose_code: purpose_code || "102",
      fi_datarange_unit: fi_datarange_unit || "MONTH",
      fi_datarange_value: fi_datarange_value || 3,
      fi_datarange_from: dataRangeFrom,
      fi_datarange_to: dataRangeTo,
      data_life_unit: data_life_unit, // Hardcoded above
      data_life_value: data_life_value, // Hardcoded above
      frequency_unit: frequency_unit, // Hardcoded above
      frequency_value: frequency_value // Hardcoded above
    };

    // Only add fair_use_id if provided
    if (input.fair_use_id) {
      consentDetail.fair_use_id = input.fair_use_id;
    }

    // DO NOT include filter_type, filter_value, filter_operator unless explicitly provided
    // (These are not in the standard structure per requirements)

    return [consentDetail]; // Return as array with single object
  }

  /**
   * Clean payload - remove undefined, null, or empty fields recursively
   */
  cleanPayload(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanPayload(item)).filter(item => item !== undefined && item !== null);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const cleaned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value !== undefined && value !== null && value !== '') {
            const cleanedValue = this.cleanPayload(value);
            if (cleanedValue !== undefined && cleanedValue !== null) {
              if (Array.isArray(cleanedValue) && cleanedValue.length === 0) {
                continue; // Skip empty arrays
              }
              if (typeof cleanedValue === 'object' && Object.keys(cleanedValue).length === 0) {
                continue; // Skip empty objects
              }
              cleaned[key] = cleanedValue;
            }
          }
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }
    
    return obj;
  }

  /**
   * Build complete Saafe payload according to exact API specification
   */
  buildSaafePayload(input) {
    // Build customer_details (mandatory)
    const customerDetails = this.buildCustomerDetails(input);

    // Build consent_details (mandatory - array of one object)
    const consentDetails = this.buildConsentDetails(input);

    // Build top-level payload
    // Note: aa_id is optional per API v1.1.0 - only include if explicitly provided
    const payload = {
      customer_details: customerDetails,
      consent_details: consentDetails
    };

    // Add aa_id - default to dashboard-aa-preprod if not provided
    if (input.aa_id && Array.isArray(input.aa_id) && input.aa_id.length > 0) {
      payload.aa_id = input.aa_id;
    } else {
      // Default AA ID as per requirements
      payload.aa_id = ["dashboard-aa-preprod"];
    }

    // Optional top-level fields (only add if provided)
    if (input.customer_id) {
      payload.customer_id = input.customer_id;
    }

    if (input.delivery_mode && Array.isArray(input.delivery_mode) && input.delivery_mode.length > 0) {
      const deliveryModeValidation = validateDeliveryMode(input.delivery_mode);
      if (!deliveryModeValidation.valid) {
        throw new Error(deliveryModeValidation.error);
      }
      payload.delivery_mode = input.delivery_mode;
    }

    // CRITICAL: Do NOT send fip_id - it causes errors
    // User must select "Ignosis" manually in the Saafe UI
    // fip_id is intentionally removed/undefined to let user select manually

    // Optional callback URLs (use defaults if not provided)
    if (input.txn_callback_url) {
      payload.txn_callback_url = input.txn_callback_url;
    } else {
      payload.txn_callback_url = this.txnCallbackUrl;
    }

    if (input.consent_callback_url) {
      payload.consent_callback_url = input.consent_callback_url;
    } else {
      payload.consent_callback_url = this.consentCallbackUrl;
    }

    // Clean payload to remove any undefined/null/empty fields
    const cleanedPayload = this.cleanPayload(payload);

    // Ensure data_life fields are present (they should be from buildConsentDetails)
    // This is a safety check to ensure they're included
    if (cleanedPayload && cleanedPayload.consent_details && Array.isArray(cleanedPayload.consent_details)) {
      cleanedPayload.consent_details = cleanedPayload.consent_details.map(consentDetail => {
        // Ensure data_life fields are present
        if (!consentDetail.data_life_unit || consentDetail.data_life_value === undefined) {
          consentDetail.data_life_unit = "DAY";
          consentDetail.data_life_value = 1;
        }
        return consentDetail;
      });
    }

    return cleanedPayload;
  }

  /**
   * Generate consent by calling Saafe API
   */
  async generateConsent(input) {
    try {
      console.log('🚀 Starting consent generation...');

      // Build payload
      const saafePayload = this.buildSaafePayload(input);

      console.log('📤 Calling Saafe API: POST /api/generate/consent');
      console.log('📋 Payload being sent:', JSON.stringify(saafePayload, null, 2));

      // Call Saafe API
      const response = await httpClient.post('/api/generate/consent', saafePayload);

      console.log('📥 Raw response received:', JSON.stringify(response.data, null, 2));

      // Check if response indicates an error
      if (response.data.status === 'error' || !response.data.success) {
        const errorMsg = response.data.message || response.data.errorMsg || 'Unknown error from Saafe API';
        console.error('❌ Saafe API returned error:', errorMsg);
        
        return {
          success: false,
          error: errorMsg,
          details: response.data
        };
      }

      // Check if response is successful
      if (response.data.status === 'success' && response.data.data) {
        const data = response.data.data;
        
        // Extract response fields
        let requestId = Array.isArray(data.request_id) ? data.request_id[0] : data.request_id;
        const txnId = Array.isArray(data.txn_id) ? data.txn_id[0] : data.txn_id;
        const consentHandle = data.consent_handle;
        const vua = data.vua;
        const redirectUrl = data.url;

        // CRITICAL: Convert request_id to Number (required by schema)
        requestId = typeof requestId === 'string' ? parseInt(requestId, 10) : Number(requestId);
        
        if (isNaN(requestId)) {
          throw new Error(`Invalid request_id received from Saafe API: ${data.request_id}`);
        }

        console.log('✅ Consent generated successfully!');
        console.log(`   Request ID: ${requestId} (Type: ${typeof requestId})`);
        console.log(`   Transaction ID: ${txnId}`);
        console.log(`   Consent Handle: ${consentHandle}`);

        // CRITICAL: Log before saving to DB
        console.log(`💾 Saving Request ${requestId} to DB...`);
        
        // CRITICAL: Store in database - MUST await and handle errors
        let consentRequest;
        try {
          consentRequest = await ConsentRequest.create({
            internal_user_id: input.internal_user_id,
            request_id: requestId, // Now guaranteed to be Number
            txn_id: txnId,
            consent_handle: consentHandle,
            vua: vua,
            status: 'PENDING',
            redirect_url: redirectUrl,
            customer_details: saafePayload.customer_details,
            consent_details: saafePayload.consent_details,
            raw_request: saafePayload,
            raw_response: response.data
          });
          
          console.log(`✅ Consent request saved to DB successfully!`);
          console.log(`   MongoDB _id: ${consentRequest._id}`);
          console.log(`   request_id: ${consentRequest.request_id} (Type: ${typeof consentRequest.request_id})`);
        } catch (dbError) {
          console.error('❌ CRITICAL: Failed to save consent request to database!');
          console.error('❌ DB Error:', dbError.message);
          console.error('❌ DB Error Stack:', dbError.stack);
          
          // CRITICAL: Throw error so API fails - don't return success if DB save failed
          throw new Error(`Database save failed: ${dbError.message}. Consent was generated but not saved.`);
        }

        return {
          success: true,
          consent_id: consentRequest._id,
          request_id: requestId,
          txn_id: txnId,
          consent_handle: consentHandle,
          vua: vua,
          redirect_url: redirectUrl,
          consent_request: consentRequest
        };
      } else {
        // Unexpected response format
        console.error('❌ Unexpected response format:', JSON.stringify(response.data, null, 2));
        const errorMsg = response.data?.message || response.data?.errorMsg || 'Invalid response format from Saafe API';
        return {
          success: false,
          error: errorMsg,
          details: response.data
        };
      }
    } catch (error) {
      console.error('❌ Consent generation failed:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Extract error details from Saafe response
      let errorMessage = error.message;
      let errorDetails = null;

      if (error.response) {
        // HTTP error response from Saafe
        errorDetails = error.response.data || null;
        errorMessage = error.response.data?.message 
          || error.response.data?.errorMsg 
          || error.response.data?.error 
          || `HTTP ${error.response.status}: ${error.message}`;
        
        console.error('📥 Error response from Saafe:', JSON.stringify(errorDetails, null, 2));
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response received from Saafe API. Please check your network connection.';
        console.error('❌ No response received from Saafe API');
      }

      // Error logging
      console.error('Error details:', {
        context: 'CONSENT',
        error_category: error.response?.status === 400 
          ? 'INPUT_VALIDATION'
          : error.response?.status === 403
          ? 'AUTHENTICATION'
          : error.response?.status === 500
          ? 'SERVER_ERROR'
          : 'INFRA_NETWORK',
        error_message: errorMessage,
        http_status_code: error.response?.status || null,
        raw_response: errorDetails
      });

      return {
        success: false,
        error: errorMessage,
        details: errorDetails
      };
    }
  }

  /**
   * Get consent request by ID
   */
  async getConsentById(consentId) {
    try {
      const consent = await ConsentRequest.findById(consentId);
      return consent;
    } catch (error) {
      console.error('Error fetching consent:', error.message);
      throw error;
    }
  }

  /**
   * Get consent request by transaction ID
   */
  async getConsentByTxnId(txnId) {
    try {
      const consent = await ConsentRequest.findOne({ txn_id: txnId });
      return consent;
    } catch (error) {
      console.error('Error fetching consent by txn_id:', error.message);
      throw error;
    }
  }

  /**
   * Get most recent consent request (for success page fallback)
   */
  async getMostRecentConsent(internalUserId = null) {
    try {
      console.log(`🔍 Finding most recent consent${internalUserId ? ` for user: ${internalUserId}` : ''}`);
      
      const query = internalUserId ? { internal_user_id: internalUserId } : {};
      const consent = await ConsentRequest.findOne(query)
        .sort({ createdAt: -1 })
        .limit(1);
      
      if (consent) {
        console.log(`   ✅ Found consent: request_id=${consent.request_id}, status=${consent.status}`);
      } else {
        console.log(`   ❌ No consent found`);
      }
      
      return consent;
    } catch (error) {
      console.error('Error fetching most recent consent:', error.message);
      throw error;
    }
  }

  /**
   * Get consent request by request ID
   * CRITICAL: request_id is now always Number in schema, so we query as Number
   */
  async getConsentByRequestId(requestId) {
    console.log(`🔍 Checking DB for request_id: ${requestId} (Type: ${typeof requestId})`);
    try {
      // CRITICAL: Convert to Number (schema expects Number)
      const numRequestId = typeof requestId === 'string' ? parseInt(requestId, 10) : Number(requestId);
      
      if (isNaN(numRequestId)) {
        console.error(`❌ Invalid request_id: ${requestId} (cannot convert to number)`);
        return null;
      }
      
      console.log(`🔍 Querying DB with Number: ${numRequestId} (Type: ${typeof numRequestId})`);
      
      // Query as Number (schema definition)
      const consent = await ConsentRequest.findOne({ request_id: numRequestId });

      if (consent) {
        console.log(`✅ Found consent request: _id=${consent._id}, request_id=${consent.request_id} (Type: ${typeof consent.request_id}), status=${consent.status}`);
      } else {
        console.log(`❌ Consent request not found in DB for request_id: ${numRequestId}`);
        // Debug: Check if there are any consents in DB
        const count = await ConsentRequest.countDocuments();
        console.log(`   Total consent requests in DB: ${count}`);
      }
      
      return consent;
    } catch (error) {
      console.error('❌ Error fetching consent by request_id:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Map Saafe status codes to consent_status
   */
  mapStatusCodeToConsentStatus(statusCode) {
    const statusMap = {
      'TxnProcessing': 'IN_PROGRESS',
      'ReportGenerated': 'READY',
      'ConsentRejected': 'REJECTED',
      'ConsentPaused': 'PAUSED',
      'ConsentRevoked': 'REVOKED',
      'ConsentApproved': 'ACTIVE'
    };
    return statusMap[statusCode] || null;
  }

  /**
   * Check consent status by calling Saafe status-check API
   * POST /api/status-check
   */
  async checkStatus(requestId) {
    try {
      console.log(`🔍 Checking status for request_id: ${requestId}`);

      // Validate request_id
      if (!requestId) {
        throw new Error('request_id is required');
      }

      // Call Saafe status-check API
      const payload = { request_id: requestId };
      
      console.log('📤 Calling Saafe API: POST /api/status-check');
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));

      const response = await httpClient.post('/api/status-check', payload);

      console.log('📥 Raw response received:', JSON.stringify(response.data, null, 2));

      // Check if response indicates an error
      if (response.data.status === 'error' || response.data.code === 'TxnNotFound') {
        const errorMsg = response.data.msg || response.data.message || 'Transaction not found';
        console.error('❌ Saafe API returned error:', errorMsg);
        
        return {
          success: false,
          error: errorMsg,
          details: response.data
        };
      }

      // Check if response is successful
      if (response.data.status === 'success' || response.data.consent_handle) {
        const data = response.data;
        
        // Extract fields from response
        const responseRequestId = data.request_id;
        const consentId = data.consent_id;
        const consentHandle = data.consent_handle;
        const txnStatusArray = data.txn_status || [];

        console.log('✅ Status check successful!');
        console.log(`   Request ID: ${responseRequestId}`);
        console.log(`   Consent ID: ${consentId || 'Not available yet'}`);
        console.log(`   Consent Handle: ${consentHandle}`);
        console.log(`   Status codes found: ${txnStatusArray.length}`);

        // Find the consent request in database
        // Convert requestId to number if it's a string (for consistent querying)
        let searchRequestId = requestId;
        if (typeof requestId === 'string' && !isNaN(requestId) && requestId.trim() !== '') {
          searchRequestId = Number(requestId);
        }
        
        // Try number first, then string as fallback
        let consentRequest = await ConsentRequest.findOne({ request_id: searchRequestId });
        if (!consentRequest && typeof requestId === 'string') {
          consentRequest = await ConsentRequest.findOne({ request_id: requestId });
        }
        
        if (!consentRequest) {
          console.warn(`⚠️ Consent request not found in database for request_id: ${requestId}`);
        }

        // Process each status in txn_status array
        const statusHistory = [];
        let latestConsentStatus = null;
        let reportGenerated = false;

        for (const statusItem of txnStatusArray) {
          const statusCode = statusItem.code;
          const statusMessage = statusItem.msg || statusItem.message || '';
          const statusValue = statusItem.status || '';
          
          // Map status code to consent_status
          const mappedStatus = this.mapStatusCodeToConsentStatus(statusCode);
          
          if (mappedStatus) {
            latestConsentStatus = mappedStatus;
          }

          // Check if report is generated
          if (statusCode === 'ReportGenerated') {
            reportGenerated = true;
            latestConsentStatus = 'READY';
          }

          // Store status history (only if consent request exists)
          if (consentRequest) {
            try {
              const statusHistoryEntry = await TxnStatusHistory.create({
                txn_id: consentRequest.txn_id,
                request_id: requestId,
                consent_id: consentId || null,
                status_code: statusCode,
                status_message: statusMessage,
                consent_status: mappedStatus,
                source: 'POLL',
                raw_payload: {
                  ...data,
                  status_item: statusItem
                },
                metadata: {
                  status_value: statusValue,
                  timestamp: new Date().toISOString()
                }
              });

              statusHistory.push(statusHistoryEntry);
              console.log(`   📝 Stored status history: ${statusCode} → ${mappedStatus || 'N/A'}`);
            } catch (historyError) {
              console.error(`   ⚠️ Failed to store status history for ${statusCode}:`, historyError.message);
            }
          }
        }

        // Update consent request if found and status changed
        if (consentRequest && latestConsentStatus) {
          const updateData = {};
          
          if (consentId && !consentRequest.consent_id) {
            updateData.consent_id = consentId;
          }

          if (latestConsentStatus && consentRequest.status !== latestConsentStatus) {
            updateData.status = latestConsentStatus;
            console.log(`   🔄 Updating consent status: ${consentRequest.status} → ${latestConsentStatus}`);
          }

          if (reportGenerated && !consentRequest.report_generated) {
            updateData.report_generated = true;
            console.log(`   📊 Report generated: true`);
          }

          if (Object.keys(updateData).length > 0) {
            await ConsentRequest.findByIdAndUpdate(consentRequest._id, updateData);
            console.log('   💾 Consent request updated in database');
          }
        }

        return {
          success: true,
          request_id: responseRequestId,
          consent_id: consentId,
          consent_handle: consentHandle,
          txn_status: txnStatusArray,
          consent_status: latestConsentStatus,
          report_generated: reportGenerated,
          status_history: statusHistory,
          raw_response: data
        };
      } else {
        // Unexpected response format
        console.error('❌ Unexpected response format:', JSON.stringify(response.data, null, 2));
        const errorMsg = response.data?.msg || response.data?.message || 'Invalid response format from Saafe API';
        return {
          success: false,
          error: errorMsg,
          details: response.data
        };
      }
    } catch (error) {
      console.error('❌ Status check failed:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Extract error details from Saafe response
      let errorMessage = error.message;
      let errorDetails = null;

      if (error.response) {
        // HTTP error response from Saafe
        errorDetails = error.response.data || null;
        errorMessage = error.response.data?.msg
          || error.response.data?.message 
          || error.response.data?.errorMsg 
          || error.response.data?.error 
          || `HTTP ${error.response.status}: ${error.message}`;
        
        console.error('📥 Error response from Saafe:', JSON.stringify(errorDetails, null, 2));
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response received from Saafe API. Please check your network connection.';
        console.error('❌ No response received from Saafe API');
      }

      return {
        success: false,
        error: errorMessage,
        details: errorDetails
      };
    }
  }
}

// Export singleton instance
module.exports = new ConsentService();

