'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [consentData, setConsentData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:3001';
  const requestId = searchParams.get('request_id') || searchParams.get('requestId');
  const consentHandle = searchParams.get('consent_handle') || searchParams.get('consentHandle');
  
  console.log('Success page loaded with params:', { requestId, consentHandle });

  useEffect(() => {
    // Reset retry counter
    sessionStorage.removeItem('consent_fetch_retry');
    
    // If no request_id, try to get it from localStorage (from dashboard)
    const storedRequestId = localStorage.getItem('last_request_id');
    const finalRequestId = requestId || storedRequestId;
    
    console.log('Success page useEffect:', { requestId, storedRequestId, finalRequestId });
    
    if (!finalRequestId) {
      // Try to find the most recent consent request
      console.log('No request_id found, attempting to find recent consent...');
      findRecentConsent();
      return;
    }

    // Fetch consent status
    fetchConsentStatus(finalRequestId);
  }, [requestId]);

  const findRecentConsent = async () => {
    try {
      // Try to get the most recent consent from the dashboard's localStorage
      const lastConsentData = localStorage.getItem('last_consent_data');
      if (lastConsentData) {
        try {
          const consent = JSON.parse(lastConsentData);
          if (consent.request_id) {
            console.log('Found consent data in localStorage:', consent.request_id);
            fetchConsentStatus(consent.request_id);
            return;
          }
        } catch (e) {
          console.error('Error parsing localStorage data:', e);
        }
      }
      
      // Try to get most recent consent from backend
      console.log('Fetching most recent consent from backend...');
      const userId = localStorage.getItem('last_user_id');
      const response = await fetch(`${API_BASE_URL}/internal/aa/consents/recent${userId ? `?internal_user_id=${userId}` : ''}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('Found recent consent:', data.data.request_id);
          fetchConsentStatus(data.data.request_id);
          return;
        }
      }
      
      // If still no consent, show helpful message
      setError('Unable to find consent request. Please return to the dashboard and initiate a new consent.');
      setStatus('error');
    } catch (err) {
      console.error('Error finding recent consent:', err);
      setError('Unable to find consent request. Please return to the dashboard.');
      setStatus('error');
    }
  };

  const fetchConsentStatus = async (reqId = requestId) => {
    if (!reqId) {
      console.error('No request_id provided to fetchConsentStatus');
      return;
    }
    
    console.log(`Fetching consent status for request_id: ${reqId} (Type: ${typeof reqId})`);
    
    try {
      // Get consent request details
      const response = await fetch(`${API_BASE_URL}/internal/aa/consents/request/${reqId}`);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
      }
      
      const data = await response.json();
      console.log('Consent status response:', data);

      if (!response.ok || !data.success) {
        // If not found, try polling a few times (webhook might be processing)
        if (response.status === 404 || data.error?.includes('not found')) {
          const retryCount = parseInt(sessionStorage.getItem('consent_fetch_retry') || '0');
          if (retryCount < 5) {
            console.log(`Consent not found (attempt ${retryCount + 1}/5), will retry in 3 seconds...`);
            sessionStorage.setItem('consent_fetch_retry', (retryCount + 1).toString());
            setTimeout(() => {
              fetchConsentStatus(reqId);
            }, 3000);
            return;
          } else {
            // After 5 retries, show helpful message
            console.log('Consent not found after multiple retries');
            setError('Consent request not found. This may happen if the consent was initiated from a different session. Please return to the dashboard to check your consent status.');
            setStatus('error');
            return;
          }
        }
        throw new Error(data.error || 'Failed to fetch consent status');
      }
      
      // Reset retry counter on success
      sessionStorage.removeItem('consent_fetch_retry');

      const consent = data.data;
      console.log('Consent found:', { 
        request_id: consent.request_id, 
        status: consent.status, 
        consent_id: consent.consent_id 
      });
      
      setConsentData(consent);
      setStatus(consent.status || 'PENDING');

      // If consent is ACTIVE, try to fetch report
      if (consent.status === 'ACTIVE' && consent.consent_id) {
        console.log('Consent is ACTIVE, checking if we need to fetch FI data first...');
        
        // Check if we have a txn_id from FI request (for report retrieval)
        // If not, we need to trigger FI request first
        if (!consent.txn_id || !consent.fi_request_initiated) {
          console.log('No FI request found, triggering FI fetch...');
          // Trigger FI request first
          setTimeout(() => {
            triggerFIRequest(consent.consent_id, consent.internal_user_id);
          }, 2000);
        } else if (consent.txn_id && !reportData) {
          // We have txn_id, fetch report directly
          console.log('Found txn_id, fetching report in 2 seconds...');
          setTimeout(() => {
            fetchReport(consent.txn_id, consent.internal_user_id);
          }, 2000);
        }
      } else if (consent.txn_id && !reportData) {
        // Even if not ACTIVE, try to fetch report if txn_id exists
        console.log('Attempting to fetch report with existing txn_id...');
        setTimeout(() => {
          fetchReport(consent.txn_id, consent.internal_user_id);
        }, 2000);
      }
      
      // If still pending, poll for status update
      if (consent.status === 'PENDING' || consent.status === 'IN_PROGRESS') {
        console.log(`Consent status is ${consent.status}, polling again in 3 seconds...`);
        setTimeout(() => {
          fetchConsentStatus(reqId);
        }, 3000);
      }
    } catch (err) {
      console.error('Error fetching consent status:', err);
      // Retry once if it's the first attempt
      const retryCount = parseInt(sessionStorage.getItem('consent_fetch_retry') || '0');
      if (retryCount < 2) {
        sessionStorage.setItem('consent_fetch_retry', (retryCount + 1).toString());
        console.log(`Retrying consent fetch (attempt ${retryCount + 2})...`);
        setTimeout(() => {
          fetchConsentStatus(reqId);
        }, 2000);
      } else {
        setError(err.message || 'Failed to fetch consent status. Please check the dashboard.');
        setStatus('error');
      }
    }
  };

  // Trigger FI Request first (if needed)
  const triggerFIRequest = async (consentId, userId) => {
    if (!consentId) return;

    try {
      console.log(`🚀 Triggering FI request for consent_id: ${consentId}`);
      const response = await fetch(`${API_BASE_URL}/internal/aa/fi/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consent_id: consentId
        }),
      });

      const data = await response.json();
      console.log('FI request response:', { success: data.success, txn_id: data.data?.txn_id });

      if (response.ok && data.success) {
        const txnId = data.data?.txn_id;
        console.log(`✅ FI request initiated! txn_id: ${txnId}`);
        
        // Wait 3 seconds for report to be ready, then fetch
        setTimeout(() => {
          fetchReport(txnId, userId);
        }, 3000);
      } else {
        console.error('FI request failed:', data.error || 'Unknown error');
        setError(`Failed to fetch data: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error triggering FI request:', err);
      setError(`Error: ${err.message}`);
    }
  };

  const fetchReport = async (txnId, userId) => {
    if (!txnId) {
      console.warn('No txn_id provided for report fetch');
      return;
    }

    try {
      console.log(`📥 Fetching report for txn_id: ${txnId}, user_id: ${userId}`);
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/internal/aa/reports/retrieve`, {
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

      const data = await response.json();
      console.log('Report fetch response:', { success: data.success, hasData: !!data.data });

      if (response.ok && data.success) {
        const report = data.data?.report_data || data.data?.json_data || data.data;
        
        console.log('Report data received:', { 
          hasFiDetails: !!report?.fi_details,
          hasExtractedTransactions: !!data.data?.extracted_transactions,
          hasExtractedAccounts: !!data.data?.extracted_accounts
        });
        
        // Use extracted data from backend if available, otherwise extract locally
        let transactions = data.data?.extracted_transactions || [];
        let accounts = data.data?.extracted_accounts || [];
        
        // If backend didn't extract, do it locally
        if (transactions.length === 0 && accounts.length === 0 && report) {
          console.log('Extracting transactions locally...');
          const extracted = extractTransactions(report);
          transactions = extracted.transactions;
          accounts = extracted.accounts;
        }
        
        console.log(`✅ Extracted ${transactions.length} transactions and ${accounts.length} accounts`);
        
        setReportData({
          ...report,
          extracted_transactions: transactions,
          extracted_accounts: accounts
        });
        
        setStatus('ACTIVE'); // Show success UI
        setError(null); // Clear any errors
      } else {
        console.error('Report fetch failed:', data.error || 'Unknown error');
        setError(`Failed to retrieve report: ${data.error || 'Unknown error'}`);
        
        // If report not ready, try again after 5 seconds
        if (data.error?.includes('not found') || data.error?.includes('not ready')) {
          console.log('Report not ready yet, retrying in 5 seconds...');
          setTimeout(() => {
            fetchReport(txnId, userId);
          }, 5000);
        }
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(`Error fetching report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const extractTransactions = (reportData) => {
    const transactions = [];
    const accounts = [];

    try {
      if (reportData.fi_details && typeof reportData.fi_details === 'object') {
        Object.keys(reportData.fi_details).forEach(fipId => {
          const fipData = reportData.fi_details[fipId];
          if (Array.isArray(fipData) && fipData.length > 0) {
            fipData.forEach(accountData => {
              const decryptedData = accountData.decrypted_data || accountData;
              const account = decryptedData.Account || decryptedData.account || decryptedData;
              
              if (account) {
                const accountNumber = account.accountNumber || account.AccountNumber || account.account_number || 'N/A';
                const summary = account.Summary || account.summary || {};
                const currentBalance = summary.currentBalance || summary.CurrentBalance || account.balance || 0;
                const profile = account.Profile || account.profile || {};
                const holders = profile.Holders || profile.holders || {};
                const holder = (holders.Holder && Array.isArray(holders.Holder) ? holders.Holder[0] : holders.Holder) || {};
                const holderName = holder.name || holder.Name || 'N/A';
                
                accounts.push({
                  fip_id: fipId,
                  account_number: accountNumber,
                  masked_account_number: accountNumber ? 
                    `${accountNumber.toString().slice(0, 4)}XXXX${accountNumber.toString().slice(-4)}` : 
                    'N/A',
                  account_type: account.accountType || account.AccountType || 'N/A',
                  ifsc: account.ifsc || account.IFSC || 'N/A',
                  balance: parseFloat(currentBalance),
                  holder_name: holderName
                });

                const transactionsData = account.Transactions || account.transactions || {};
                const transactionArray = transactionsData.Transaction || 
                                        transactionsData.transaction || 
                                        (Array.isArray(transactionsData) ? transactionsData : []) ||
                                        [];
                
                if (Array.isArray(transactionArray) && transactionArray.length > 0) {
                  transactionArray.forEach(txn => {
                    transactions.push({
                      fip_id: fipId,
                      account_number: accountNumber,
                      date: txn.date || txn.Date || 'N/A',
                      narration: txn.narration || txn.Narration || txn.description || txn.Description || 'N/A',
                      amount: parseFloat(txn.amount || txn.Amount || 0),
                      type: txn.type || txn.Type || (parseFloat(txn.amount || txn.Amount || 0) >= 0 ? 'CREDIT' : 'DEBIT'),
                      balance: parseFloat(txn.balance || txn.Balance || currentBalance || 0)
                    });
                  });
                }
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error extracting transactions:', error);
    }

    return { transactions, accounts };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {status === 'loading' && (
          <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Processing Consent...</h2>
            <p className="text-slate-400">Please wait while we fetch your data</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Processing Your Consent</h2>
            <p className="text-yellow-300 mb-4">
              {error?.includes('not found') 
                ? 'Your consent is being processed. Please return to the dashboard to check the status, or wait a moment and refresh this page.'
                : error || 'Please return to the dashboard to view your consent status.'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  // Save consent data to localStorage before navigating
                  if (consentData) {
                    localStorage.setItem('last_request_id', consentData.request_id?.toString() || '');
                    localStorage.setItem('last_user_id', consentData.internal_user_id || '');
                    localStorage.setItem('last_consent_data', JSON.stringify(consentData));
                    if (consentData.consent_id) {
                      localStorage.setItem('last_consent_id', consentData.consent_id);
                    }
                  }
                  router.push('/');
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-6 rounded"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  const reqId = requestId || localStorage.getItem('last_request_id');
                  if (reqId) {
                    sessionStorage.removeItem('consent_fetch_retry');
                    fetchConsentStatus(reqId);
                  } else {
                    window.location.reload();
                  }
                }}
                className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-400 font-bold py-2 px-6 rounded"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {status === 'ACTIVE' && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-emerald-400 mb-2">Consent Approved Successfully!</h1>
              <p className="text-slate-400">Your financial data has been retrieved</p>
            </div>

            {/* Account Summary */}
            {reportData?.extracted_accounts && reportData.extracted_accounts.length > 0 && (
              <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6">
                <h2 className="text-xl font-bold text-emerald-400 mb-4">Account Summary</h2>
                {reportData.extracted_accounts.map((account, idx) => (
                  <div key={idx} className="space-y-2 text-sm mb-4 pb-4 border-b border-slate-800 last:border-0">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Holder:</span>
                      <span className="text-slate-300 font-semibold">{account.holder_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Number:</span>
                      <span className="text-slate-300 font-mono">{account.masked_account_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Balance:</span>
                      <span className="text-emerald-400 font-bold text-xl">₹{account.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Transactions Table */}
            {reportData?.extracted_transactions && reportData.extracted_transactions.length > 0 ? (
              <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6">
                <h2 className="text-xl font-bold text-emerald-400 mb-4">
                  Transactions ({reportData.extracted_transactions.length})
                </h2>
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
                      {reportData.extracted_transactions.map((txn, idx) => (
                        <tr key={idx} className="border-b border-slate-800 hover:bg-slate-900/50">
                          <td className="py-2 px-2 text-slate-300">{txn.date || 'N/A'}</td>
                          <td className="py-2 px-2 text-slate-300 max-w-xs truncate" title={txn.narration || 'N/A'}>
                            {txn.narration || 'N/A'}
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
            ) : reportData && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 text-center">
                <p className="text-yellow-400">Report data is being processed. Please wait...</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-6 rounded transition-colors"
              >
                Go to Dashboard
              </button>
              {consentData?.consent_id && (
                <button
                  onClick={() => {
                    if (consentData.txn_id) {
                      fetchReport(consentData.txn_id, consentData.internal_user_id);
                    }
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-400 font-bold py-3 px-6 rounded transition-colors"
                >
                  Refresh Data
                </button>
              )}
            </div>
          </div>
        )}

        {status !== 'loading' && status !== 'error' && status !== 'ACTIVE' && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Consent Status: {status}</h2>
            <p className="text-yellow-300">Your consent is being processed. Status: {status}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-6 rounded"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

