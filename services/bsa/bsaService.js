const httpClient = require('../httpClient');
const { Report, BSARun } = require('../../models');
const crypto = require('crypto');

/**
 * BSA (Bank Statement Analysis) Service
 * Handles analysis of financial reports using Saafe's BSA engine
 */
class BSAService {
  constructor() {
    this.baseURL = process.env.SAAFE_API_BASE_URL || 'https://uat.tsp.api.saafe.tech';
    this.webhookUrl = process.env.BSA_WEBHOOK_URL || `${process.env.BASE_URL || 'http://localhost:3000'}/webhooks/aa/bsa`;
  }

  /**
   * Initiate BSA analysis for a stored report
   * @param {string} reportId - MongoDB _id of the report or txn_id
   * @returns {Promise<Object>} BSA run object
   */
  async initiateAnalysis(reportId) {
    try {
      console.log(`📊 Initiating BSA analysis for report ID: ${reportId}`);

      // Find the report in database - try by _id first, then by txn_id
      let report = null;
      if (reportId.match(/^[0-9a-fA-F]{24}$/)) {
        // Looks like MongoDB ObjectId
        report = await Report.findById(reportId);
      }
      
      if (!report) {
        // Try finding by txn_id
        report = await Report.findOne({ txn_id: reportId });
      }
      
      if (!report) {
        throw new Error(`Report not found with ID or txn_id: ${reportId}`);
      }

      // Check if report has data
      if (!report.json_data && !report.report_data) {
        throw new Error('Report has no data to analyze');
      }

      // Generate unique tracking ID
      const trackingId = crypto.randomUUID();
      console.log(`🆔 Generated tracking_id: ${trackingId}`);

      // Prepare payload
      const reportData = report.json_data || report.report_data;
      const payload = {
        tracking_id: trackingId,
        consent_flag: true,
        accounts: [reportData], // Wrap the report object in an array
        webhook_url: this.webhookUrl
      };

      console.log('📤 Calling Saafe API: POST /api/bsa/initiate');
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));

      // Call Saafe BSA API
      const response = await httpClient.post('/api/bsa/initiate', payload);

      console.log('📥 BSA API Response:', JSON.stringify(response.data, null, 2));

      // Check if response indicates success
      if (response.data.status === 'error' || (!response.data.success && response.data.status !== 'success')) {
        const errorMsg = response.data.message || response.data.errorMsg || 'Unknown error from Saafe BSA API';
        console.error('❌ Saafe BSA API returned error:', errorMsg);

        // Save failed BSA run
        const bsaRun = await BSARun.create({
          tracking_id: trackingId,
          report_id: reportId,
          status: 'INITIATION_FAILED',
          webhook_url: this.webhookUrl,
          error_message: errorMsg,
          request_metadata: {
            consent_flag: true,
            file_count: 1
          },
          raw_last_response: response.data
        });

        return {
          success: false,
          error: errorMsg,
          tracking_id: trackingId,
          bsa_run: bsaRun
        };
      }

      // Create BSA run record
      const bsaRun = await BSARun.create({
        tracking_id: trackingId,
        report_id: report._id, // Store MongoDB ObjectId
        status: 'INITIATED',
        webhook_url: this.webhookUrl,
        request_metadata: {
          consent_flag: true,
          file_count: 1
        },
        raw_last_response: response.data
      });

      console.log('✅ BSA analysis initiated successfully!');
      console.log(`   Tracking ID: ${trackingId}`);
      console.log(`   BSA Run ID: ${bsaRun._id}`);

      return {
        success: true,
        tracking_id: trackingId,
        bsa_run: bsaRun,
        message: 'BSA analysis initiated successfully'
      };
    } catch (error) {
      console.error('❌ BSA initiation failed:', error.message);
      console.error('❌ Error stack:', error.stack);

      // Extract error details from Saafe response
      let errorMessage = error.message;
      let errorDetails = null;

      if (error.response) {
        errorDetails = error.response.data || null;
        errorMessage = error.response.data?.message 
          || error.response.data?.errorMsg 
          || error.response.data?.error 
          || `HTTP ${error.response.status}: ${error.message}`;
        
        console.error('📥 Error response from Saafe:', JSON.stringify(errorDetails, null, 2));
      }

      return {
        success: false,
        error: errorMessage,
        details: errorDetails
      };
    }
  }

  /**
   * Check BSA analysis status
   * @param {string} trackingId - Tracking ID from initiateAnalysis
   * @returns {Promise<Object>} Status and result URLs
   */
  async checkStatus(trackingId) {
    try {
      console.log(`🔍 Checking BSA status for tracking_id: ${trackingId}`);

      // Find BSA run in database
      const bsaRun = await BSARun.findOne({ tracking_id: trackingId });
      if (!bsaRun) {
        throw new Error(`BSA run not found with tracking_id: ${trackingId}`);
      }

      // Call Saafe BSA status API
      const response = await httpClient.get('/api/bsa/status', {
        params: {
          tracking_id: trackingId
        }
      });

      console.log('📥 BSA Status Response:', JSON.stringify(response.data, null, 2));

      // Update BSA run with latest status
      const updateData = {
        raw_last_response: response.data
      };

      // Extract status from response
      if (response.data.status) {
        const status = response.data.status.toUpperCase();
        
        // Map Saafe status to our enum
        const validStatuses = ['INITIATED', 'COMPLETED', 'FAILED', 'ERRORED', 'FETCH_ERRORED', 'PURGED', 'INITIATION_FAILED', 'IN_PROGRESS'];
        if (validStatuses.includes(status)) {
          updateData.status = status;
        } else {
          updateData.status = 'IN_PROGRESS';
        }

        // If completed, extract URLs
        if (status === 'COMPLETED') {
          updateData.json_docs_url = response.data.json_docs_url || response.data.json_url || null;
          updateData.xlsx_docs_url = response.data.xlsx_docs_url || response.data.xlsx_url || null;
          updateData.completed_at = new Date();
        }
      }

      // Update BSA run
      const updatedBsaRun = await BSARun.findByIdAndUpdate(
        bsaRun._id,
        updateData,
        { new: true }
      );

      console.log(`✅ BSA status updated: ${updatedBsaRun.status}`);

      return {
        success: true,
        tracking_id: trackingId,
        status: updatedBsaRun.status,
        json_docs_url: updatedBsaRun.json_docs_url,
        xlsx_docs_url: updatedBsaRun.xlsx_docs_url,
        bsa_run: updatedBsaRun,
        raw_response: response.data
      };
    } catch (error) {
      console.error('❌ BSA status check failed:', error.message);
      console.error('❌ Error stack:', error.stack);

      // Extract error details from Saafe response
      let errorMessage = error.message;
      let errorDetails = null;

      if (error.response) {
        errorDetails = error.response.data || null;
        errorMessage = error.response.data?.message 
          || error.response.data?.errorMsg 
          || error.response.data?.error 
          || `HTTP ${error.response.status}: ${error.message}`;
        
        console.error('📥 Error response from Saafe:', JSON.stringify(errorDetails, null, 2));
      }

      return {
        success: false,
        error: errorMessage,
        details: errorDetails
      };
    }
  }

  /**
   * Get BSA run by tracking ID
   * @param {string} trackingId - Tracking ID
   * @returns {Promise<Object>} BSA run object
   */
  async getBSARunByTrackingId(trackingId) {
    try {
      const bsaRun = await BSARun.findOne({ tracking_id: trackingId });
      return bsaRun;
    } catch (error) {
      console.error('Error fetching BSA run:', error.message);
      throw error;
    }
  }

  /**
   * Get BSA run by report ID
   * @param {string} reportId - Report MongoDB _id
   * @returns {Promise<Object>} BSA run object
   */
  async getBSARunByReportId(reportId) {
    try {
      const bsaRun = await BSARun.findOne({ report_id: reportId }).sort({ createdAt: -1 });
      return bsaRun;
    } catch (error) {
      console.error('Error fetching BSA run by report ID:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new BSAService();

