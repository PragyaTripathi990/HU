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

      console.log('📥 Raw response received from Saafe API');
      console.log('   Status:', response.data.status);
      console.log('   Success:', response.data.success);
      console.log('   Has data:', !!response.data.data);
      
      // Log response structure for debugging (truncated for large responses)
      const responseStr = JSON.stringify(response.data, null, 2);
      if (responseStr.length > 2000) {
        console.log('   Response preview:', responseStr.substring(0, 2000) + '... (truncated)');
      } else {
        console.log('   Full response:', responseStr);
      }

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
      // Handle both 'success' status and 'success: true' format
      const isSuccess = (response.data.status === 'success' || response.data.success === true) && response.data.data;
      
      if (isSuccess) {
        const reportData = response.data.data;
        
        // Validate that reportData exists and has required fields
        if (!reportData || typeof reportData !== 'object') {
          throw new Error('Invalid report data structure received from Saafe API');
        }
        
        // Extract fi_details and transactions from Saafe nested JSON structure
        // Specific structure: data.fi_details["IGNOSIS_FIP_UAT"][0].decrypted_data.Account...
        let extractedFiDetails = [];
        let extractedTransactions = [];
        
        if (reportData.fi_details && typeof reportData.fi_details === 'object') {
          // Handle nested structure: fi_details["IGNOSIS_FIP_UAT"][0].decrypted_data.Account...
          Object.keys(reportData.fi_details).forEach(fipId => {
            const fipData = reportData.fi_details[fipId];
            if (Array.isArray(fipData) && fipData.length > 0) {
              fipData.forEach(accountData => {
                // Saafe structure: decrypted_data.Account
                const decryptedData = accountData.decrypted_data || accountData;
                const account = decryptedData.Account || decryptedData.account || decryptedData;
                
                if (account) {
                  // Extract account number - handle both top-level and nested structures
                  const accountNumber = accountData.masked_account ||  // Top-level masked_account
                                      account.accountNumber || 
                                      account.AccountNumber || 
                                      account.account_number || 
                                      account.maskedAccNumber ||
                                      account.masked_account ||
                                      null;
                  
                  // Extract link reference number
                  const linkRefNumber = accountData.link_ref_number || 
                                       account.link_ref_number ||
                                       account.linkRefNumber ||
                                       account.linkedAccRef ||
                                       null;
                  
                  // Extract current balance from Summary
                  const summary = account.Summary || account.summary || {};
                  const currentBalance = summary.currentBalance || 
                                       summary.CurrentBalance || 
                                       account.balance || 
                                       account.Balance || 
                                       0;
                  
                  // Extract account holder name from Profile
                  const profile = account.Profile || account.profile || {};
                  const holders = profile.Holders || profile.holders || {};
                  const holder = (holders.Holder && Array.isArray(holders.Holder) ? holders.Holder[0] : holders.Holder) || 
                                (holders.holder && Array.isArray(holders.holder) ? holders.holder[0] : holders.holder) ||
                                {};
                  const holderName = holder.name || holder.Name || null;
                  
                  // Store extracted account details
                  extractedFiDetails.push({
                    fip_id: fipId,
                    account_number: accountNumber,
                    link_ref_number: linkRefNumber,
                    account_type: account.accountType || account.AccountType || account.account_type || account.accountSubType || null,
                    ifsc: account.ifsc || account.IFSC || account.ifscCode || null,
                    balance: parseFloat(currentBalance),
                    currency: account.currency || account.Currency || 'INR',
                    holder_name: holderName,
                    source_url: accountData.source || null, // Source URL from top-level
                    // Store full account object for reference
                    full_account_data: account,
                    full_account_data_raw: accountData // Store raw accountData including top-level fields
                  });
                  
                  // Extract transactions from Account.Transactions.Transaction array
                  const transactionsData = account.Transactions || account.transactions || {};
                  const transactionArray = transactionsData.Transaction || 
                                          transactionsData.transaction || 
                                          (Array.isArray(transactionsData) ? transactionsData : []) ||
                                          [];
                  
                  if (Array.isArray(transactionArray) && transactionArray.length > 0) {
                    transactionArray.forEach(txn => {
                      // Handle both standard and Saafe-specific field names
                      const txnAmount = parseFloat(txn.amount || txn.Amount || 0);
                      const txnType = txn.type || 
                                    txn.Type || 
                                    (txnAmount >= 0 ? 'CREDIT' : 'DEBIT');
                      
                      extractedTransactions.push({
                        fip_id: fipId,
                        account_number: accountNumber,
                        // Date fields - Saafe uses transactionTimestamp and valueDate
                        date: txn.transactionTimestamp || 
                             txn.valueDate || 
                             txn.date || 
                             txn.Date || 
                             txn.transactionDate || 
                             txn.transaction_date || 
                             null,
                        transaction_timestamp: txn.transactionTimestamp || null,
                        value_date: txn.valueDate || null,
                        // Transaction ID
                        txn_id: txn.txnId || txn.txn_id || txn.id || null,
                        // Narration/Description
                        narration: txn.narration || 
                                 txn.Narration || 
                                 txn.description || 
                                 txn.Description || 
                                 txn.remarks || 
                                 txn.remark ||
                                 null,
                        // Amount and type
                        amount: txnAmount,
                        type: txnType,
                        // Balance
                        balance: parseFloat(txn.transactionalBalance || 
                                          txn.balance || 
                                          txn.Balance || 
                                          currentBalance || 
                                          0),
                        // Additional fields from Saafe response
                        mode: txn.mode || txn.Mode || null,
                        reference: txn.reference || txn.Reference || txn.ref || null,
                        // Store full transaction object for reference
                        full_transaction_data: txn
                      });
                    });
                  }
                }
              });
            }
          });
        }
        
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

        // Store report in database with extracted data
        // Use request_id from reportData if available, otherwise from consentRequest
        const reportRequestId = reportData.request_id || consentRequest?.request_id || null;
        
        const report = await Report.findOneAndUpdate(
          { txn_id: txn_id },
          {
            txn_id: txn_id,
            internal_user_id: internal_user_id || consentRequest?.internal_user_id || null,
            request_id: reportRequestId, // Use request_id from report response if available
            consent_id: consentRequest?.consent_id || null,
            report_type: report_type.toUpperCase(),
            json_data: reportData, // Store full response
            report_data: {
              ...reportData,
              // Add extracted data for easier access
              extracted_fi_details: extractedFiDetails,
              extracted_transactions: extractedTransactions
            },
            status: 'COMPLETED',
            retrieved_at: new Date(),
            source_report_url: reportData.source_report || reportData.report_url || reportData.source_report_url || null,
            metadata: {
              // Store all metadata fields from Saafe response
              request_id: reportData.request_id || null,
              start_date: reportData.start_date || null,
              end_date: reportData.end_date || null,
              duration_in_month: reportData.duration_in_month || null,
              report_fetch_time: reportData.report_fetch_time || new Date().toISOString(),
              report_fetch_type: reportData.report_fetch_type || report_type,
              source_of_data: reportData.source_of_data || 'accountaggregator',
              statement_start_date: reportData.statement_start_date || null,
              statement_end_date: reportData.statement_end_date || null,
              multiple_accounts_found: reportData.multiple_accounts_found || null,
              // Extracted data
              fi_details: extractedFiDetails,
              transactions: extractedTransactions,
              transaction_count: extractedTransactions.length,
              account_count: extractedFiDetails.length,
              // Preserve any additional metadata from response
              ...(reportData.metadata || {})
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
        console.log(`   Request ID: ${reportRequestId}`);
        console.log(`   Accounts found: ${extractedFiDetails.length}`);
        console.log(`   Transactions found: ${extractedTransactions.length}`);
        console.log(`   Report type: ${report.report_type}`);
        console.log(`   Source report URL: ${report.source_report_url ? 'Yes' : 'No'}`);

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

