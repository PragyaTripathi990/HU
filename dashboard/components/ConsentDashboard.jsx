'use client';

import React, { useState, useEffect, useCallback } from 'react';
import LogTerminal from './LogTerminal';

const ConsentDashboard = () => {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState('');
  const [mobile, setMobile] = useState('9898989898');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Consent data
  const [consentData, setConsentData] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [status, setStatus] = useState('PENDING');
  const [consentId, setConsentId] = useState(null);
  
  // FI Request data
  const [fiTxnId, setFiTxnId] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);
  
  // Report data
  const [reportData, setReportData] = useState(null);
  const [retrievingReport, setRetrievingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [autoRetrieveTriggered, setAutoRetrieveTriggered] = useState(false);
  
  // BSA Analysis data
  const [bsaTrackingId, setBsaTrackingId] = useState(null);
  const [bsaStatus, setBsaStatus] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Logs
  const [logs, setLogs] = useState([]);

  // Backend API URL - hardcoded to port 3001
  const API_BASE_URL = 'http://localhost:3001';

  // Add log function (defined first so it can be used in other callbacks)
  const addLog = useCallback((type, message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
    setLogs(prev => [...prev, { type, message, timestamp }]);
  }, []);

  // Helper function to parse JSON response (handles non-JSON responses)
  const parseJsonResponse = async (response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`);
    }
  };

  // Save state to localStorage
  const saveState = useCallback(() => {
    const state = {
      step,
      userId,
      mobile,
      requestId,
      consentId,
      status,
      redirectUrl,
      fiTxnId,
      reportId,
      bsaTrackingId,
      bsaStatus,
      consentData: consentData ? JSON.stringify(consentData) : null,
      reportData: reportData ? JSON.stringify(reportData) : null,
      showReport,
      timestamp: Date.now()
    };
    localStorage.setItem('dashboard_state', JSON.stringify(state));
    console.log('💾 State saved to localStorage');
  }, [step, userId, mobile, requestId, consentId, status, redirectUrl, fiTxnId, reportId, bsaTrackingId, bsaStatus, consentData, reportData, showReport]);

  // Restore state from localStorage
  const restoreState = useCallback(() => {
    try {
      const savedState = localStorage.getItem('dashboard_state');
      if (!savedState) {
        console.log('📭 No saved state found');
        return false;
      }

      const state = JSON.parse(savedState);
      const age = Date.now() - (state.timestamp || 0);
      
      // Only restore if state is less than 24 hours old
      if (age > 24 * 60 * 60 * 1000) {
        console.log('⏰ Saved state is too old, clearing...');
        localStorage.removeItem('dashboard_state');
        return false;
      }

      console.log('📂 Restoring state from localStorage:', {
        step: state.step,
        requestId: state.requestId,
        status: state.status
      });

      setStep(state.step || 1);
      setUserId(state.userId || '');
      setMobile(state.mobile || '9898989898');
      setRequestId(state.requestId || null);
      setStatus(state.status || 'PENDING');
      setRedirectUrl(state.redirectUrl || null);
      // Ensure fiTxnId is a string
      const savedTxnId = state.fiTxnId;
      setFiTxnId(savedTxnId && typeof savedTxnId === 'string' ? savedTxnId : (savedTxnId ? String(savedTxnId) : null));
      setReportId(state.reportId || null);
      setBsaTrackingId(state.bsaTrackingId || null);
      setBsaStatus(state.bsaStatus || null);
      setShowReport(state.showReport || false);
      
      // Restore consentData first to extract consent_id
      if (state.consentData) {
        try {
          const parsedConsent = JSON.parse(state.consentData);
          setConsentData(parsedConsent);
          // Extract consent_id from restored consent data
          if (parsedConsent.consent_id) {
            setConsentId(parsedConsent.consent_id);
          }
        } catch (e) {
          console.error('Error parsing consentData:', e);
        }
      }
      
      // Also check localStorage for consent_id (from success page)
      if (!state.consentId) {
        const lastConsentId = localStorage.getItem('last_consent_id');
        if (lastConsentId) {
          setConsentId(lastConsentId);
        } else {
          // Try to get from last_consent_data
          const lastConsentData = localStorage.getItem('last_consent_data');
          if (lastConsentData) {
            try {
              const consent = JSON.parse(lastConsentData);
              if (consent.consent_id) {
                setConsentId(consent.consent_id);
              }
            } catch (e) {
              console.error('Error parsing last_consent_data:', e);
            }
          }
        }
      } else {
        setConsentId(state.consentId);
      }
      
      if (state.reportData) {
        try {
          setReportData(JSON.parse(state.reportData));
        } catch (e) {
          console.error('Error parsing reportData:', e);
        }
      }

      addLog('success', `🔄 Restored previous session - Step ${state.step}, Status: ${state.status}`);
      return true;
    } catch (err) {
      console.error('Error restoring state:', err);
      localStorage.removeItem('dashboard_state');
      return false;
    }
  }, [addLog]);

  // Clear state and localStorage
  const clearState = useCallback(() => {
    localStorage.removeItem('dashboard_state');
    localStorage.removeItem('last_request_id');
    localStorage.removeItem('last_user_id');
    localStorage.removeItem('last_consent_data');
    setStep(1);
    setUserId('');
    setMobile('9898989898');
    setRequestId(null);
    setConsentId(null);
    setStatus('PENDING');
    setRedirectUrl(null);
    setFiTxnId(null);
    setReportId(null);
    setBsaTrackingId(null);
    setBsaStatus(null);
    setConsentData(null);
    setReportData(null);
    setShowReport(false);
    setError(null);
    setLogs([]);
    addLog('success', '🔄 Demo reset - All state cleared');
    console.log('🗑️ State cleared');
  }, [addLog]);

  // Restore state on mount
  useEffect(() => {
    const restored = restoreState();
    if (restored) {
      // addLog will be called inside restoreState
      console.log('✅ Session restored from localStorage');
    }
  }, [restoreState]); // Only run on mount

  // Save state whenever key values change
  useEffect(() => {
    if (step > 1) { // Only save if we've progressed past step 1
      saveState();
    }
  }, [step, userId, mobile, requestId, consentId, status, redirectUrl, fiTxnId, reportId, bsaTrackingId, bsaStatus, showReport, saveState]);

  // Step 1: Initiate Consent
  const handleInitiateConsent = async () => {
    if (!userId || !mobile) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    addLog('api', `POST /internal/aa/consents/initiate - Initiating consent for user: ${userId}`);

    try {
      const payload = {
        internal_user_id: userId,
        mobile: mobile,
        email: 'user@example.com',
        date_of_birth: '1990-01-01',
        pan_number: 'ABCDE1234F',
        aa_id: ['dashboard-aa-preprod'],
        fi_types: ['DEPOSIT'],
        consent_start_date: new Date().toISOString().split('T')[0],
        consent_expiry_date: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fi_datarange_from: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fi_datarange_to: new Date().toISOString().split('T')[0],
        purpose_code: '102',
        consent_mode: 'STORE',
        consent_types: ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
        fetch_type: 'PERIODIC',
        frequency_unit: 'MONTH',
        frequency_value: 1
      };

      addLog('api', `Request payload: ${JSON.stringify(payload, null, 2)}`);

      const response = await fetch(`${API_BASE_URL}/internal/aa/consents/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate consent');
      }

      addLog('success', `✅ Consent initiated successfully - Request ID: ${data.data.request_id}`);
      addLog('success', `Redirect URL: ${data.data.redirect_url}`);

      // Store request_id, user_id and consent data in localStorage for success page
      if (data.data.request_id) {
        localStorage.setItem('last_request_id', data.data.request_id.toString());
        localStorage.setItem('last_user_id', userId);
        localStorage.setItem('last_consent_data', JSON.stringify(data.data));
      }

      setConsentData(data.data);
      setRedirectUrl(data.data.redirect_url);
      setRequestId(data.data.request_id);
      setStep(2);
      
      // State will be auto-saved by useEffect
    } catch (err) {
      console.error('Error initiating consent:', err);
      addLog('error', `❌ Error: ${err.message}`);
      setError(err.message || 'Failed to initiate consent');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract transactions from Saafe nested JSON structure
  // Specific structure: data.fi_details["IGNOSIS_FIP_UAT"][0].decrypted_data.Account...
  const extractTransactionsFromNestedJSON = (reportData) => {
    const transactions = [];
    const accounts = [];

    try {
      // Try to get extracted data from backend (already parsed)
      if (reportData.extracted_transactions && Array.isArray(reportData.extracted_transactions)) {
        return {
          transactions: reportData.extracted_transactions,
          accounts: reportData.extracted_fi_details || []
        };
      }

      // Parse Saafe specific structure: fi_details["IGNOSIS_FIP_UAT"][0].decrypted_data.Account...
      if (reportData.fi_details && typeof reportData.fi_details === 'object') {
        Object.keys(reportData.fi_details).forEach(fipId => {
          const fipData = reportData.fi_details[fipId];
          if (Array.isArray(fipData) && fipData.length > 0) {
            fipData.forEach((accountData, accountIndex) => {
              // Saafe structure: decrypted_data.Account
              const decryptedData = accountData.decrypted_data || accountData;
              const account = decryptedData.Account || decryptedData.account || decryptedData;
              
              if (account) {
                // Extract account number (mask it)
                const accountNumber = accountData.masked_account || 
                                    account.accountNumber || 
                                    account.AccountNumber || 
                                    account.account_number || 
                                    account.maskedAccNumber ||
                                    'N/A';
                
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
                const holderName = holder.name || holder.Name || 'N/A';
                
                // Extract account type and IFSC
                const accountType = account.accountType || account.AccountType || account.account_type || account.accountSubType || 'N/A';
                const ifsc = account.ifsc || account.IFSC || account.ifscCode || 'N/A';
                
                accounts.push({
                  fip_id: fipId,
                  account_number: accountNumber,
                  link_ref_number: linkRefNumber,
                  masked_account_number: accountNumber ? 
                    `${accountNumber.toString().slice(0, 4)}XXXX${accountNumber.toString().slice(-4)}` : 
                    accountNumber,
                  account_type: accountType,
                  ifsc: ifsc,
                  balance: parseFloat(currentBalance),
                  currency: account.currency || account.Currency || 'INR',
                  holder_name: holderName,
                  source_url: accountData.source || null
                });

                // Extract transactions from Account.Transactions.Transaction array
                const transactionsData = account.Transactions || account.transactions || {};
                const transactionArray = transactionsData.Transaction || 
                                      transactionsData.transaction || 
                                      (Array.isArray(transactionsData) ? transactionsData : []) ||
                                      [];
                
                if (Array.isArray(transactionArray) && transactionArray.length > 0) {
                  transactionArray.forEach(txn => {
                    const isCredit = txn.type === 'CREDIT' || (txn.amount && parseFloat(txn.amount || txn.Amount || 0) >= 0);
                    const txnAmount = parseFloat(txn.amount || txn.Amount || 0);
                    const txnType = txn.type || 
                                 txn.Type || 
                                 (isCredit ? 'CREDIT' : 'DEBIT');
                    
                    transactions.push({
                      fip_id: fipId,
                      account_number: accountNumber,
                      date: txn.transactionTimestamp || 
                           txn.valueDate || 
                           txn.date || 
                           txn.Date || 
                           txn.transactionDate || 
                           txn.transaction_date || 
                           'N/A',
                      transaction_timestamp: txn.transactionTimestamp || null,
                      value_date: txn.valueDate || null,
                      txn_id: txn.txnId || txn.txn_id || txn.id || null,
                      narration: txn.narration || 
                               txn.Narration || 
                               txn.description || 
                               txn.Description || 
                               txn.remarks || 
                               txn.remark ||
                               'N/A',
                      amount: txnAmount,
                      type: txnType,
                      balance: parseFloat(txn.transactionalBalance || 
                                        txn.balance || 
                                        txn.Balance || 
                                        currentBalance || 
                                        0),
                      mode: txn.mode || txn.Mode || null,
                      reference: txn.reference || txn.Reference || txn.ref || null
                    });
                  });
                }
              }
            });
          }
        });
      }

      // Fallback: Check if transactions are at root level
      if (reportData.transactions && Array.isArray(reportData.transactions)) {
        reportData.transactions.forEach(txn => {
          transactions.push({
            date: txn.date || txn.Date || 'N/A',
            narration: txn.narration || txn.Narration || txn.description || txn.Description || 'N/A',
            amount: parseFloat(txn.amount || txn.Amount || 0),
            type: txn.type || txn.Type || (parseFloat(txn.amount || txn.Amount || 0) >= 0 ? 'CREDIT' : 'DEBIT'),
            balance: parseFloat(txn.balance || txn.Balance || 0)
          });
        });
      }
    } catch (error) {
      console.error('Error extracting transactions:', error);
    }

    return { transactions, accounts };
  };

  // Step 4: Retrieve Report (moved before checkStatus to fix dependency order)
  const handleRetrieveReport = useCallback(async (txnIdOverride = null) => {
    // Ensure txnId is a string, not an object
    let txnId = txnIdOverride || fiTxnId;
    
    // Convert to string if it's not already
    if (txnId) {
      if (typeof txnId === 'object' && txnId !== null) {
        // If it's an object, try to extract the actual ID
        // Handle React event objects or DOM elements
        if (txnId.target && txnId.target.value) {
          txnId = txnId.target.value;
        } else if (txnId.currentTarget) {
          // React synthetic event
          txnId = null; // Don't use event object
        } else {
          txnId = txnId.txn_id || txnId.id || (txnId.toString && txnId.toString() !== '[object Object]' ? txnId.toString() : null);
        }
      } else if (typeof txnId !== 'string') {
        txnId = String(txnId);
      }
    }
    
    // If txnId is still an object or invalid, try to get from fiTxnId state
    if (!txnId || txnId === 'null' || txnId === 'undefined' || (typeof txnId === 'object' && txnId !== null)) {
      // Fallback to fiTxnId state if override was invalid
      if (!txnIdOverride && fiTxnId) {
        txnId = typeof fiTxnId === 'string' ? fiTxnId : String(fiTxnId);
      } else {
        setError('Transaction ID is required to retrieve report');
        return;
      }
    }

    setRetrievingReport(true);
    setError(null);
    
    // Log the txnId safely (ensure it's a string)
    const txnIdForLog = typeof txnId === 'string' ? txnId : (txnId ? String(txnId) : 'N/A');
    addLog('api', `POST /internal/aa/reports/retrieve - Retrieving report for txn_id: ${txnIdForLog}`);

    try {
      // Final safety check: Ensure txnId is a string for JSON.stringify
      // This prevents "Converting circular structure to JSON" errors
      let txnIdString = txnId;
      if (typeof txnIdString !== 'string') {
        if (txnIdString && typeof txnIdString === 'object') {
          // If it's still an object, try to extract string value
          txnIdString = txnIdString.txn_id || txnIdString.id || txnIdString.value || null;
          if (!txnIdString || typeof txnIdString !== 'string') {
            throw new Error('Invalid transaction ID: expected string but got object');
          }
        } else {
          txnIdString = String(txnIdString);
        }
      }
      
      // Validate it's not empty or invalid
      if (!txnIdString || txnIdString === 'null' || txnIdString === 'undefined' || txnIdString === '[object Object]') {
        throw new Error('Invalid transaction ID provided');
      }
      
      const response = await fetch(`${API_BASE_URL}/internal/aa/reports/retrieve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txn_id: txnIdString,
          internal_user_id: userId,
          report_type: 'json',
          report_category: 'bank'
        }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to retrieve report');
      }

      // Extract real data from response
      const reportData = data.data?.report_data || data.data;
      const { transactions, accounts } = extractTransactionsFromNestedJSON(reportData);
      
      // Store report data with extracted transactions
      setReportData({
        ...reportData,
        extracted_transactions: transactions,
        extracted_accounts: accounts
      });
      setReportId(data.data?.report_id || null);
      setShowReport(true);
      addLog('success', `✅ Report retrieved successfully! Found ${transactions.length} transactions`);
    } catch (err) {
      console.error('Error retrieving report:', err);
      addLog('error', `❌ Report retrieval failed: ${err.message}`);
      setError(err.message || 'Failed to retrieve report');
    } finally {
      setRetrievingReport(false);
    }
  }, [fiTxnId, userId, API_BASE_URL, addLog]);

  // Step 2: Check Status (Polling)
  const checkStatus = useCallback(async () => {
    if (!requestId) return;

    try {
      // First, call Saafe API to check status (this updates the database)
      addLog('api', `POST /internal/aa/consents/status-check - Checking status with Saafe API...`);
      
      const statusCheckResponse = await fetch(`${API_BASE_URL}/internal/aa/consents/status-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: requestId }),
      });

      const statusCheckData = await statusCheckResponse.json();
      
      if (statusCheckData.success && statusCheckData.data) {
        const consentStatus = statusCheckData.data.consent_status;
        const consentIdFromCheck = statusCheckData.data.consent_id;
        
        if (consentStatus && consentStatus !== status) {
          addLog('success', `✅ Status updated via Saafe API: ${status} → ${consentStatus}`);
          setStatus(consentStatus);
        }
        
        if (consentIdFromCheck && !consentId) {
          setConsentId(consentIdFromCheck);
          addLog('success', `🎉 Consent ID received: ${consentIdFromCheck}`);
        }
      }

      // Then, get the updated consent from database
      addLog('api', `GET /internal/aa/consents/request/${requestId} - Fetching updated consent...`);

      const response = await fetch(`${API_BASE_URL}/internal/aa/consents/request/${requestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to check status');
      }

      const consent = data.data;
      const currentStatus = consent.status || 'PENDING';
      
      // Debug: Log the consent.txn_id to see its type
      if (consent.txn_id) {
        console.log('🔍 consent.txn_id type:', typeof consent.txn_id, 'value:', consent.txn_id);
      }
      
      if (currentStatus !== status) {
        addLog('success', `✅ Status updated: ${status} → ${currentStatus}`);
        setStatus(currentStatus);
      }

      if (currentStatus === 'ACTIVE') {
        setConsentId(consent.consent_id || 'N/A');
        addLog('success', `🎉 Consent ACTIVE! Consent ID: ${consent.consent_id || 'N/A'}`);
        addLog('webhook', `🔔 Status changed to ACTIVE`);
        setStep(3);
        // Update consentData with latest status
        if (consentData) {
          setConsentData({ ...consentData, status: 'ACTIVE', consent_id: consent.consent_id });
        }
      } else if (currentStatus === 'REJECTED' || currentStatus === 'REVOKED') {
        addLog('error', `❌ Consent ${currentStatus}`);
        setError(`Consent was ${currentStatus}`);
      } else if (currentStatus === 'READY') {
        addLog('success', `✅ Report is ready! Status: ${currentStatus}`);
        if (consent.report_generated) {
          addLog('info', `📊 Report has been generated`);
          
          // Automatically retrieve and display the report
          const txnId = consent.txn_id;
          // Ensure txnId is a string - handle all possible formats
          let txnIdString = null;
          if (txnId) {
            if (typeof txnId === 'string') {
              txnIdString = txnId;
            } else if (typeof txnId === 'number') {
              txnIdString = String(txnId);
            } else if (Array.isArray(txnId) && txnId.length > 0) {
              // Handle case where txn_id might be an array
              txnIdString = String(txnId[0]);
            } else if (typeof txnId === 'object' && txnId !== null) {
              // Try to extract string value from object
              txnIdString = txnId.txn_id || txnId.id || txnId.value || null;
              if (txnIdString) {
                txnIdString = String(txnIdString);
              }
            } else {
              txnIdString = String(txnId);
            }
          }
          
          if (txnIdString && !showReport && !retrievingReport && !autoRetrieveTriggered) {
            addLog('api', `🔄 Automatically retrieving report for txn_id: ${txnIdString}...`);
            setFiTxnId(txnIdString); // Set txn_id for report retrieval
            setAutoRetrieveTriggered(true); // Prevent multiple triggers
            setStep(4); // Move to report viewer step
            // Trigger report retrieval automatically
            setTimeout(() => {
              handleRetrieveReport(txnIdString);
            }, 1000); // Small delay to ensure state is updated
          }
        }
      }
    } catch (err) {
      console.error('Error checking status:', err);
      addLog('error', `❌ Status check failed: ${err.message}`);
    }
  }, [requestId, status, consentId, addLog, API_BASE_URL, consentData, showReport, retrievingReport, handleRetrieveReport, autoRetrieveTriggered]);

  // Auto-poll when on step 2 (resume polling if restored from localStorage)
  useEffect(() => {
    if (step === 2 && requestId && status !== 'ACTIVE' && status !== 'REJECTED' && status !== 'REVOKED') {
      addLog('api', `🔄 Starting status polling for request_id: ${requestId}`);
      const interval = setInterval(() => {
        checkStatus();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [step, requestId, status, checkStatus, addLog]);

  // Step 3: Fetch Data
  const handleFetchData = async () => {
    if (!consentId || consentId === 'N/A') {
      setError('Consent ID is required to fetch data');
      return;
    }

    setFetchingData(true);
    setError(null);
    addLog('api', `POST /internal/aa/fi/fetch - Fetching data for consent: ${consentId}`);

    try {
      const response = await fetch(`${API_BASE_URL}/internal/aa/fi/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consent_id: consentId,
          request_id: requestId
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      const txnId = data.data?.txn_id || data.data?.transaction_id;
      // Ensure txnId is a string
      const txnIdString = txnId ? String(txnId) : null;
      setFiTxnId(txnIdString);
      addLog('success', `✅ Data fetch initiated! Transaction ID: ${txnIdString}`);
      addLog('webhook', `🔔 FI Request webhook will be received for txn_id: ${txnId}`);
      
      // Wait 5 seconds before retrieving report (give time for report to be generated)
      addLog('api', `⏳ Waiting 5 seconds for report to be generated...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Automatically retrieve report after waiting
      addLog('api', `🔄 Retrieving report for txn_id: ${txnId}`);
      
      // Call retrieve report with retry logic
      setRetrievingReport(true);
      let retryCount = 0;
      const maxRetries = 5;
      
      const attemptReportRetrieval = async () => {
        try {
          const reportResponse = await fetch(`${API_BASE_URL}/internal/aa/reports/retrieve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              txn_id: txnId,
              internal_user_id: userId,
              report_type: 'json',
              report_category: 'bank'
            }),
          });

          const reportData = await parseJsonResponse(reportResponse);

          if (reportResponse.ok && reportData.success) {
            const report = reportData.data?.report_data || reportData.data?.json_data || reportData.data;
            const { transactions, accounts } = extractTransactionsFromNestedJSON(report);
            
            setReportData({
              ...report,
              extracted_transactions: transactions,
              extracted_accounts: accounts
            });
            setReportId(reportData.data?.report_id || reportData.data?._id || null);
            setShowReport(true);
            addLog('success', `✅ Report retrieved successfully! Found ${transactions.length} transactions from ${accounts.length} account(s)`);
            setRetrievingReport(false);
          } else {
            // Report might not be ready yet, retry
            if (retryCount < maxRetries) {
              retryCount++;
              addLog('api', `⚠️ Report not ready yet (attempt ${retryCount}/${maxRetries}), retrying in 3 seconds...`);
              setTimeout(attemptReportRetrieval, 3000);
            } else {
              addLog('error', `⚠️ Report retrieval failed after ${maxRetries} attempts: ${reportData.error || 'Unknown error'}`);
              setError(reportData.error || 'Failed to retrieve report. Please try again later.');
              setRetrievingReport(false);
            }
          }
        } catch (reportErr) {
          if (retryCount < maxRetries) {
            retryCount++;
            addLog('api', `⚠️ Error retrieving report (attempt ${retryCount}/${maxRetries}), retrying in 3 seconds...`);
            setTimeout(attemptReportRetrieval, 3000);
          } else {
            console.error('Error retrieving report:', reportErr);
            addLog('error', `❌ Report retrieval error after ${maxRetries} attempts: ${reportErr.message}`);
            setError(reportErr.message || 'Failed to retrieve report');
            setRetrievingReport(false);
          }
        }
      };
      
      // Start first attempt
      attemptReportRetrieval();
      
      setStep(4); // Move to Step 4: Report Viewer
    } catch (err) {
      console.error('Error fetching data:', err);
      addLog('error', `❌ Fetch data failed: ${err.message}`);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setFetchingData(false);
    }
  };

  const handleAuthorize = () => {
    if (redirectUrl) {
      addLog('api', `🌐 Opening authorization URL in new tab...`);
      window.open(redirectUrl, '_blank');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addLog('success', `📋 Copied to clipboard: ${text.substring(0, 50)}...`);
  };

  // BSA Analysis handler
  const handleBSAAnalysis = async () => {
    if (!reportId) {
      setError('Report ID is required for BSA analysis');
      return;
    }

    setAnalyzing(true);
    setError(null);
    addLog('api', `POST /internal/aa/bsa/analyze - Initiating BSA analysis for report: ${reportId}`);

    try {
      const response = await fetch(`${API_BASE_URL}/internal/aa/bsa/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: reportId
        }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate BSA analysis');
      }

      const trackingId = data.data?.tracking_id;
      setBsaTrackingId(trackingId);
      setBsaStatus('INITIATED');
      addLog('success', `✅ BSA analysis initiated! Tracking ID: ${trackingId}`);
      addLog('webhook', `🔔 BSA webhook will be received for tracking_id: ${trackingId}`);
      
      // Auto-check status after 5 seconds
      setTimeout(() => {
        checkBSAStatus(trackingId);
      }, 5000);
    } catch (err) {
      console.error('Error initiating BSA analysis:', err);
      addLog('error', `❌ BSA analysis failed: ${err.message}`);
      setError(err.message || 'Failed to initiate BSA analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  // Check BSA Status
  const checkBSAStatus = async (trackingId) => {
    if (!trackingId) {
      trackingId = bsaTrackingId;
    }
    if (!trackingId) return;

    try {
      addLog('api', `GET /internal/aa/bsa/status/${trackingId} - Checking BSA status...`);

      const response = await fetch(`${API_BASE_URL}/internal/aa/bsa/status/${trackingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to check BSA status');
      }

      const currentStatus = data.data?.status || 'INITIATED';
      setBsaStatus(currentStatus);
      
      if (currentStatus !== bsaStatus) {
        addLog('success', `✅ BSA Status updated: ${bsaStatus || 'INITIATED'} → ${currentStatus}`);
      }

      if (currentStatus === 'COMPLETED') {
        addLog('success', `🎉 BSA Analysis Complete!`);
        if (data.data?.json_docs_url) {
          addLog('success', `📄 Results available at: ${data.data.json_docs_url}`);
        }
      } else if (currentStatus === 'IN_PROGRESS' || currentStatus === 'INITIATED') {
        // Poll again after 5 seconds
        setTimeout(() => {
          checkBSAStatus(trackingId);
        }, 5000);
      }
    } catch (err) {
      console.error('Error checking BSA status:', err);
      addLog('error', `❌ BSA status check failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                ACCOUNT AGGREGATOR DASHBOARD
              </h1>
              <p className="text-slate-400 text-sm">Live Demo - Consent → Webhook → Data Fetch</p>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={clearState}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-semibold py-2 px-4 rounded text-sm transition-colors"
                title="Reset Demo - Clear all state and start fresh"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Column: User Interactions */}
          <div className="flex flex-col space-y-6">
            {/* Stepper */}
            <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className={`flex items-center gap-3 ${step >= 1 ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                    step >= 1 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'
                  }`}>
                    {step > 1 ? '✓' : '1'}
                  </div>
                  <span className="font-semibold">Initiate</span>
                </div>
                <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                <div className={`flex items-center gap-3 ${step >= 2 ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                    step >= 2 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'
                  }`}>
                    {step > 2 ? '✓' : '2'}
                  </div>
                  <span className="font-semibold">Approve</span>
                </div>
                <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                <div className={`flex items-center gap-3 ${step >= 3 ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                    step >= 3 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'
                  }`}>
                    {step > 3 ? '✓' : '3'}
                  </div>
                  <span className="font-semibold">Fetch</span>
                </div>
                <div className={`flex-1 h-0.5 mx-4 ${step >= 4 ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                <div className={`flex items-center gap-3 ${step >= 4 ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                    step >= 4 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'
                  }`}>
                    4
                  </div>
                  <span className="font-semibold">Report</span>
                </div>
              </div>
            </div>

            {/* Step 1: Initiate */}
            {step === 1 && (
              <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-bold text-emerald-400 mb-4">Step 1: Initiate Consent</h2>
                
                {error && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-400 mb-2">User ID</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Mobile Number</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9898989898"
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={handleInitiateConsent}
                  disabled={loading || !userId || !mobile}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-bold py-3 px-6 rounded transition-all duration-200 shadow-lg shadow-emerald-500/20"
                >
                  {loading ? 'Initiating...' : 'Initiate Consent'}
                </button>
              </div>
            )}

            {/* Step 2: Approve */}
            {step === 2 && (
              <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-bold text-emerald-400 mb-4">Step 2: Authorize on Saafe</h2>
                
                <div className="bg-slate-950 border border-emerald-500/30 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Status:</span>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${
                      status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                      status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                  {status === 'PENDING' && (
                    <div className="text-xs text-slate-500 mt-2">Polling every 3 seconds...</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Authorization URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={redirectUrl || ''}
                      readOnly
                      className="flex-1 bg-slate-950 border border-emerald-500/30 rounded px-4 py-2 text-slate-300 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(redirectUrl)}
                      className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 px-4 py-2 rounded text-emerald-400 text-sm font-semibold transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAuthorize}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-6 rounded transition-all duration-200 shadow-lg shadow-emerald-500/20"
                >
                  Authorize on Saafe
                </button>
              </div>
            )}

            {/* Step 3: Success & Fetch */}
            {step === 3 && (
              <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-bold text-emerald-400 mb-4">Step 3: Success & Fetch Data</h2>
                
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-4">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">✅</div>
                    <div className="text-emerald-400 font-bold">Consent Active!</div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Consent ID:</span>
                      <span className="text-emerald-400 font-mono font-bold">{consentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Request ID:</span>
                      <span className="text-slate-300 font-mono">{requestId}</span>
                    </div>
                    {fiTxnId && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">FI Transaction ID:</span>
                        <span className="text-emerald-400 font-mono font-bold">{fiTxnId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleFetchData}
                  disabled={fetchingData || !consentId || consentId === 'N/A'}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-bold py-3 px-6 rounded transition-all duration-200 shadow-lg shadow-emerald-500/20"
                >
                  {fetchingData ? 'Fetching Data...' : 'Fetch Data'}
                </button>

                <button
                  onClick={() => {
                    setStep(1);
                    setStatus('PENDING');
                    setConsentData(null);
                    setRedirectUrl(null);
                    setRequestId(null);
                    setConsentId(null);
                    setFiTxnId(null);
                    setError(null);
                    setLogs([]);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-semibold py-2 px-6 rounded transition-colors"
                >
                  Start New Flow
                </button>
              </div>
            )}

            {/* Step 4: Report Viewer */}
            {step === 4 && (
              <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                <h2 className="text-xl font-bold text-emerald-400 mb-4">Step 4: Report Viewer</h2>
                
                {!showReport ? (
                  <>
                    <div className="bg-slate-950 border border-emerald-500/30 rounded p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Transaction ID:</span>
                          <span className="text-emerald-400 font-mono font-bold">
                            {fiTxnId && typeof fiTxnId === 'string' ? fiTxnId : (fiTxnId ? String(fiTxnId) : 'N/A')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Consent ID:</span>
                          <span className="text-slate-300 font-mono">{consentId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            status === 'READY' ? 'bg-emerald-500/20 text-emerald-400' :
                            status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {retrievingReport && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-4">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                          <div>
                            <div className="text-emerald-400 font-semibold">Retrieving Report...</div>
                            <div className="text-slate-400 text-xs">Fetching financial data from Saafe API</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    {!retrievingReport && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRetrieveReport();
                        }}
                        disabled={!fiTxnId}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-bold py-3 px-6 rounded transition-all duration-200 shadow-lg shadow-emerald-500/20"
                      >
                        Retrieve Report
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {/* Success Banner */}
                    <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">✅</div>
                        <div>
                          <div className="text-emerald-400 font-bold">Report Retrieved Successfully!</div>
                          <div className="text-slate-300 text-sm">
                            {reportData?.extracted_transactions?.length || 0} transactions found across {' '}
                            {reportData?.extracted_accounts?.length || 0} account(s)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Report Summary */}
                    {(() => {
                      // Calculate summary from transactions if not provided
                      const transactions = reportData?.extracted_transactions || [];
                      const credits = transactions.filter(t => t.type === 'CREDIT' || (t.amount && t.amount >= 0));
                      const debits = transactions.filter(t => t.type === 'DEBIT' || (t.amount && t.amount < 0));
                      const totalCredits = credits.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
                      const totalDebits = debits.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
                      const netAmount = totalCredits - totalDebits;
                      
                      const summary = reportData?.summary || {
                        total_credits: totalCredits,
                        total_debits: totalDebits,
                        net_amount: netAmount
                      };
                      
                      return (
                        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-lg p-5 shadow-lg">
                          <h3 className="text-emerald-400 font-bold mb-4 text-lg">Financial Summary</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-emerald-500/20">
                              <div className="text-slate-400 text-xs mb-1">Total Credits</div>
                              <div className="text-emerald-400 font-bold text-lg">
                                ₹{summary.total_credits?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                              </div>
                              <div className="text-emerald-500/60 text-xs mt-1">{credits.length} transactions</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-red-500/20">
                              <div className="text-slate-400 text-xs mb-1">Total Debits</div>
                              <div className="text-red-400 font-bold text-lg">
                                ₹{summary.total_debits?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                              </div>
                              <div className="text-red-500/60 text-xs mt-1">{debits.length} transactions</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-emerald-500/30">
                              <div className="text-slate-400 text-xs mb-1">Net Amount</div>
                              <div className={`font-bold text-xl ${
                                netAmount >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {netAmount >= 0 ? '+' : ''}₹{Math.abs(netAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-slate-500 text-xs mt-1">{transactions.length} total</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Account Details Summary Card */}
                    {(reportData?.extracted_accounts && reportData.extracted_accounts.length > 0) || 
                     (reportData?.fi_details && (Array.isArray(reportData.fi_details) ? reportData.fi_details.length > 0 : Object.keys(reportData.fi_details).length > 0)) ? (
                      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-emerald-500/30 rounded-lg p-5">
                        <h3 className="text-emerald-400 font-bold mb-4 text-lg">Account Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(reportData.extracted_accounts || []).map((account, idx) => (
                            <div key={idx} className="bg-slate-950/50 border border-emerald-500/20 rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                                <span className="text-slate-400 text-xs">Account #{idx + 1}</span>
                                <span className="text-emerald-400 font-bold text-lg">
                                  ₹{account.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                </span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Holder:</span>
                                  <span className="text-slate-300 font-semibold">{account.holder_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Account:</span>
                                  <span className="text-slate-300 font-mono text-xs">
                                    {account.masked_account_number || 
                                     account.account_number || 
                                     account.masked_account ||
                                     'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Type:</span>
                                  <span className="text-slate-300 capitalize">{account.account_type || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">IFSC:</span>
                                  <span className="text-slate-300 font-mono text-xs">{account.ifsc || 'N/A'}</span>
                                </div>
                                {account.link_ref_number && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Link Ref:</span>
                                    <span className="text-slate-300 font-mono text-xs truncate max-w-[150px]" title={account.link_ref_number}>
                                      {account.link_ref_number}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Transactions Table */}
                    {reportData?.extracted_transactions && reportData.extracted_transactions.length > 0 ? (
                      <div className="bg-slate-950 border border-emerald-500/30 rounded p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-emerald-400 font-bold">
                            Transactions ({reportData.extracted_transactions.length})
                          </h3>
                          <div className="text-xs text-slate-400">
                            {reportData.extracted_transactions.filter(t => t.type === 'CREDIT' || (t.amount && t.amount >= 0)).length} Credits • {' '}
                            {reportData.extracted_transactions.filter(t => t.type === 'DEBIT' || (t.amount && t.amount < 0)).length} Debits
                          </div>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-emerald-500/20 rounded">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-slate-900 z-10">
                              <tr className="border-b border-emerald-500/30">
                                <th className="text-left py-3 px-3 text-slate-300 font-semibold">Date</th>
                                <th className="text-left py-3 px-3 text-slate-300 font-semibold">Narration</th>
                                <th className="text-left py-3 px-3 text-slate-300 font-semibold">Reference</th>
                                <th className="text-right py-3 px-3 text-slate-300 font-semibold">Amount</th>
                                <th className="text-right py-3 px-3 text-slate-300 font-semibold">Balance</th>
                                <th className="text-center py-3 px-3 text-slate-300 font-semibold">Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.extracted_transactions.map((txn, idx) => {
                                const isCredit = txn.type === 'CREDIT' || (txn.amount && txn.amount >= 0);
                                const dateStr = txn.date || txn.transaction_timestamp || txn.value_date || 'N/A';
                                const formattedDate = dateStr !== 'N/A' && dateStr.includes('T') 
                                  ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : dateStr;
                                
                                return (
                                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-900/70 transition-colors">
                                    <td className="py-2.5 px-3 text-slate-300 font-mono text-xs whitespace-nowrap">
                                      {formattedDate}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-300 max-w-md">
                                      <div className="truncate" title={txn.narration || txn.description || 'N/A'}>
                                        {txn.narration || txn.description || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-400 font-mono text-xs">
                                      {txn.reference || txn.txn_id || '-'}
                                    </td>
                                    <td className={`py-2.5 px-3 text-right font-mono font-semibold whitespace-nowrap ${
                                      isCredit ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                      {isCredit ? '+' : '-'}₹{Math.abs(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-slate-300 font-mono whitespace-nowrap">
                                      ₹{(txn.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        isCredit 
                                          ? 'bg-emerald-500/20 text-emerald-400' 
                                          : 'bg-red-500/20 text-red-400'
                                      }`}>
                                        {isCredit ? 'CREDIT' : 'DEBIT'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : reportData?.transactions && reportData.transactions.length > 0 ? (
                      <div className="bg-slate-950 border border-emerald-500/30 rounded p-4">
                        <h3 className="text-emerald-400 font-bold mb-3">Transactions ({reportData.transactions.length})</h3>
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-slate-950">
                              <tr className="border-b border-emerald-500/30">
                                <th className="text-left py-2 px-2 text-slate-400">Date</th>
                                <th className="text-left py-2 px-2 text-slate-400">Narration</th>
                                <th className="text-right py-2 px-2 text-slate-400">Amount</th>
                                <th className="text-right py-2 px-2 text-slate-400">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.transactions.map((txn, idx) => (
                                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-900/50">
                                  <td className="py-2 px-2 text-slate-300">{txn.date || 'N/A'}</td>
                                  <td className="py-2 px-2 text-slate-300 max-w-xs truncate" title={txn.narration || txn.description || 'N/A'}>
                                    {txn.narration || txn.description || 'N/A'}
                                  </td>
                                  <td className={`py-2 px-2 text-right font-mono font-semibold ${
                                    txn.type === 'CREDIT' || (txn.amount && txn.amount >= 0) ? 'text-emerald-400' : 'text-red-400'
                                  }`}>
                                    {txn.type === 'CREDIT' || (txn.amount && txn.amount >= 0) ? '+' : '-'}₹{Math.abs(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2 px-2 text-right text-slate-300 font-mono">₹{(txn.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950 border border-yellow-500/30 rounded p-4">
                        <p className="text-yellow-400 text-sm">No transactions found in the report.</p>
                      </div>
                    )}

                    {/* BSA Analysis Section */}
                    <div className="bg-slate-950 border border-emerald-500/30 rounded p-4">
                      <h3 className="text-emerald-400 font-bold mb-3">Bank Statement Analysis (BSA)</h3>
                      
                      {!bsaTrackingId ? (
                        <>
                          <p className="text-slate-400 text-sm mb-4">
                            Analyze spending patterns, detect salary credits, and calculate risk scores.
                          </p>
                          <button
                            onClick={handleBSAAnalysis}
                            disabled={analyzing || !reportId}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-bold py-3 px-6 rounded transition-all duration-200 shadow-lg shadow-emerald-500/20"
                          >
                            {analyzing ? 'Analyzing...' : 'Analyze Spending'}
                          </button>
                          {!reportId && (
                            <p className="text-yellow-400 text-xs mt-2">⚠️ Report ID not available. Please retrieve the report first.</p>
                          )}
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Tracking ID:</span>
                            <span className="text-emerald-400 font-mono text-sm">{bsaTrackingId}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Status:</span>
                            <span className={`px-3 py-1 rounded text-sm font-bold ${
                              bsaStatus === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                              bsaStatus === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {bsaStatus || 'INITIATED'}
                            </span>
                          </div>
                          {bsaStatus === 'INITIATED' || bsaStatus === 'IN_PROGRESS' ? (
                            <button
                              onClick={() => checkBSAStatus(bsaTrackingId)}
                              className="w-full bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-400 font-semibold py-2 px-6 rounded transition-colors"
                            >
                              Check Status
                            </button>
                          ) : bsaStatus === 'COMPLETED' ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3">
                              <p className="text-emerald-400 text-sm font-semibold mb-2">✅ Analysis Complete!</p>
                              <p className="text-slate-300 text-xs">Analysis results are available. Check the backend for detailed insights.</p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Spending Analysis Placeholder */}
                    <div className="bg-slate-950 border border-emerald-500/30 rounded p-4">
                      <h3 className="text-emerald-400 font-bold mb-3">Spending Analysis</h3>
                      <div className="h-32 bg-slate-900 rounded flex items-center justify-center text-slate-500 text-sm">
                        <div className="text-center">
                          <div className="text-2xl mb-2">📊</div>
                          <div>Chart visualization placeholder</div>
                          <div className="text-xs mt-1">(Integration with charting library)</div>
                        </div>
                      </div>
                    </div>

                    {/* JSON Viewer Toggle */}
                    <details className="bg-slate-950 border border-emerald-500/30 rounded p-4">
                      <summary className="text-emerald-400 font-bold cursor-pointer">View Raw JSON</summary>
                      <pre className="mt-3 text-xs text-slate-300 overflow-x-auto bg-slate-900 p-3 rounded">
                        {JSON.stringify(reportData, null, 2)}
                      </pre>
                    </details>

                    <button
                      onClick={() => {
                        setStep(1);
                        setStatus('PENDING');
                        setConsentData(null);
                        setRedirectUrl(null);
                        setRequestId(null);
                        setConsentId(null);
                        setFiTxnId(null);
                        setReportData(null);
                        setShowReport(false);
                        setError(null);
                        setLogs([]);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-semibold py-2 px-6 rounded transition-colors"
                    >
                      Start New Flow
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Server Logs */}
          <div className="h-full">
            <LogTerminal logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentDashboard;

