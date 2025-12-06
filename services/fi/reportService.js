const httpClient = require('../httpClient');
const { Report, ConsentRequest } = require('../../models');

/**
 * Report Service
 * Handles retrieval and storage of financial reports from Saafe TSP
 */
class ReportService {
  constructor() {
    this.baseURL = process.env.SAAFE_API_BASE_URL || 'https://uat.tsp.api.saafe.tech';
  }

  /**
   * Retrieve report from Saafe API
   * POST /api/retrievereport
   */
  async retrieveReport(txn_id, options = {}) {
    try {
      console.log(`📥 Retrieving report for txn_id: ${txn_id}`);

      const {
        report_type = 'json',
        report_category = 'bank',
        internal_user_id = null
      } = options;

      // Validate txn_id
      if (!txn_id) {
        throw new Error('txn_id is required');
      }

      // Build payload
      const payload = {
        txn_id: txn_id,
        report_type: report_type,
        report_category: report_category
      };

      console.log('📤 Calling Saafe API: POST /api/retrievereport');
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));

      // Call Saafe API
      const response = await httpClient.post('/api/retrievereport', payload);

      console.log('📥 Raw response received:', JSON.stringify(response.data, null, 2));

      // Check if response indicates an error
      if (response.data.status === 'error' || !response.data.success) {
        const errorMsg = response.data.message || response.data.errorMsg || 'Unknown error from Saafe API';
        console.error('❌ Saafe API returned error:', errorMsg);
        
        // Update report status to FAILED
        await this.updateReportStatus(txn_id, 'FAILED', errorMsg, internal_user_id);
        
        return {
          success: false,
          error: errorMsg,
          details: response.data
        };
      }

      // Check if response is successful
      if (response.data.status === 'success' && response.data.data) {
        const reportData = response.data.data;
        
        // Find consent request to get additional info
        let consentRequest = null;
        if (internal_user_id) {
          consentRequest = await ConsentRequest.findOne({ 
            internal_user_id,
            txn_id: txn_id 
          });
        } else {
          consentRequest = await ConsentRequest.findOne({ txn_id: txn_id });
        }

        // Store report in database
        const report = await Report.findOneAndUpdate(
          { txn_id: txn_id },
          {
            txn_id: txn_id,
            internal_user_id: internal_user_id || consentRequest?.internal_user_id || null,
            request_id: consentRequest?.request_id || null,
            consent_id: consentRequest?.consent_id || null,
            report_type: report_type.toUpperCase(),
            json_data: reportData,
            report_data: reportData, // Alias for compatibility
            status: 'COMPLETED',
            retrieved_at: new Date(),
            source_report_url: reportData.source_report || reportData.report_url || null,
            metadata: {
              report_fetch_time: new Date().toISOString(),
              report_fetch_type: report_type,
              source_of_data: reportData.source_of_data || 'AA',
              fi_details: reportData.fi_details || [],
              ...reportData.metadata
            }
          },
          {
            upsert: true,
            new: true
          }
        );

        // Update consent request if found
        if (consentRequest) {
          await ConsentRequest.findByIdAndUpdate(
            consentRequest._id,
            {
              report_status: 'COMPLETED',
              report_generated: true,
              report_type: report_type.toUpperCase()
            }
          );
        }

        console.log('✅ Report retrieved and stored successfully!');
        console.log(`   Report ID: ${report._id}`);
        console.log(`   Status: ${report.status}`);

        return {
          success: true,
          report_id: report._id,
          txn_id: txn_id,
          report_type: report.report_type,
          status: report.status,
          report_data: reportData,
          report: report
        };
      } else {
        // Unexpected response format
        console.error('❌ Unexpected response format:', JSON.stringify(response.data, null, 2));
        const errorMsg = response.data?.message || response.data?.errorMsg || 'Invalid response format from Saafe API';
        
        await this.updateReportStatus(txn_id, 'FAILED', errorMsg, internal_user_id);
        
        return {
          success: false,
          error: errorMsg,
          details: response.data
        };
      }
    } catch (error) {
      console.error('❌ Report retrieval failed:', error.message);
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

      // Update report status to FAILED
      await this.updateReportStatus(txn_id, 'FAILED', errorMessage, options.internal_user_id);

      return {
        success: false,
        error: errorMessage,
        details: errorDetails
      };
    }
  }

  /**
   * Update report status
   */
  async updateReportStatus(txn_id, status, error_message = null, internal_user_id = null) {
    try {
      await Report.findOneAndUpdate(
        { txn_id: txn_id },
        {
          status: status,
          error_message: error_message,
          internal_user_id: internal_user_id,
          ...(status === 'COMPLETED' && { retrieved_at: new Date() })
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error updating report status:', error.message);
    }
  }

  /**
   * Get report by txn_id
   */
  async getReportByTxnId(txn_id) {
    try {
      const report = await Report.findOne({ txn_id: txn_id });
      return report;
    } catch (error) {
      console.error('Error fetching report:', error.message);
      throw error;
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId) {
    try {
      const report = await Report.findById(reportId);
      return report;
    } catch (error) {
      console.error('Error fetching report by ID:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ReportService();

