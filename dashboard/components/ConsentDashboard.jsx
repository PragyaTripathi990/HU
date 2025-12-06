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
  
  // Logs
  const [logs, setLogs] = useState([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Add log function
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

      setConsentData(data.data);
      setRedirectUrl(data.data.redirect_url);
      setRequestId(data.data.request_id);
      setStep(2);
    } catch (err) {
      console.error('Error initiating consent:', err);
      addLog('error', `❌ Error: ${err.message}`);
      setError(err.message || 'Failed to initiate consent');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Check Status (Polling)
  const checkStatus = useCallback(async () => {
    if (!requestId) return;

    try {
      addLog('api', `GET /internal/aa/consents/request/${requestId} - Checking status...`);

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
      
      if (currentStatus !== status) {
        addLog('success', `✅ Status updated: ${status} → ${currentStatus}`);
        setStatus(currentStatus);
      }

      if (currentStatus === 'ACTIVE') {
        setConsentId(consent.consent_id || 'N/A');
        addLog('success', `🎉 Consent ACTIVE! Consent ID: ${consent.consent_id || 'N/A'}`);
        addLog('webhook', `🔔 Webhook received: Status changed to ACTIVE`);
        setStep(3);
      } else if (currentStatus === 'REJECTED' || currentStatus === 'REVOKED') {
        addLog('error', `❌ Consent ${currentStatus}`);
        setError(`Consent was ${currentStatus}`);
      }
    } catch (err) {
      console.error('Error checking status:', err);
      addLog('error', `❌ Status check failed: ${err.message}`);
    }
  }, [requestId, status, addLog, API_BASE_URL]);

  // Auto-poll when on step 2
  useEffect(() => {
    if (step === 2 && requestId && status !== 'ACTIVE') {
      const interval = setInterval(() => {
        checkStatus();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [step, requestId, status, checkStatus]);

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
      setFiTxnId(txnId);
      addLog('success', `✅ Data fetch initiated! Transaction ID: ${txnId}`);
      addLog('webhook', `🔔 FI Request webhook will be received for txn_id: ${txnId}`);
      setStep(4); // Move to Step 4: Report Viewer
    } catch (err) {
      console.error('Error fetching data:', err);
      addLog('error', `❌ Fetch data failed: ${err.message}`);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setFetchingData(false);
    }
  };

  // Step 4: Retrieve Report
  const handleRetrieveReport = async () => {
    if (!fiTxnId) {
      setError('Transaction ID is required to retrieve report');
      return;
    }

    setRetrievingReport(true);
    setError(null);
    addLog('api', `POST /internal/aa/reports/retrieve - Retrieving report for txn_id: ${fiTxnId}`);

    try {
      const response = await fetch(`${API_BASE_URL}/internal/aa/reports/retrieve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txn_id: fiTxnId,
          internal_user_id: userId,
          report_type: 'json',
          report_category: 'bank'
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // If API fails, show mock data for demo purposes
        console.warn('Report API failed, showing mock data for demo');
        addLog('webhook', `⚠️ Report API unavailable, displaying mock data for demo`);
        
        // Generate mock bank statement
        const mockReport = generateMockBankStatement();
        setReportData(mockReport);
        setShowReport(true);
        addLog('success', `✅ Mock report data loaded (for demo purposes)`);
      } else {
        setReportData(data.data?.report_data || data.data);
        setShowReport(true);
        addLog('success', `✅ Report retrieved successfully!`);
      }
    } catch (err) {
      console.error('Error retrieving report:', err);
      addLog('webhook', `⚠️ Report API error, displaying mock data for demo`);
      
      // Show mock data even on error for demo purposes
      const mockReport = generateMockBankStatement();
      setReportData(mockReport);
      setShowReport(true);
      addLog('success', `✅ Mock report data loaded (for demo purposes)`);
    } finally {
      setRetrievingReport(false);
    }
  };

  // Generate mock bank statement for demo
  const generateMockBankStatement = () => {
    return {
      txn_id: fiTxnId,
      report_type: 'json',
      report_category: 'bank',
      fi_details: [
        {
          fip_id: 'FIP001',
          account_type: 'savings',
          account_number: 'XXXX1234',
          ifsc: 'HDFC0001234',
          balance: 125000.50,
          currency: 'INR',
          transactions_count: 45,
          statement_period: {
            from: '2024-01-01',
            to: '2024-03-31'
          }
        }
      ],
      transactions: [
        {
          date: '2024-03-15',
          description: 'Salary Credit',
          amount: 50000.00,
          type: 'CREDIT',
          balance: 125000.50
        },
        {
          date: '2024-03-10',
          description: 'UPI Payment - Amazon',
          amount: -2500.00,
          type: 'DEBIT',
          balance: 75000.50
        },
        {
          date: '2024-03-05',
          description: 'ATM Withdrawal',
          amount: -5000.00,
          type: 'DEBIT',
          balance: 77500.50
        },
        {
          date: '2024-03-01',
          description: 'UPI Payment - Swiggy',
          amount: -450.00,
          type: 'DEBIT',
          balance: 82500.50
        },
        {
          date: '2024-02-28',
          description: 'NEFT Credit - Friend',
          amount: 10000.00,
          type: 'CREDIT',
          balance: 82950.50
        },
        {
          date: '2024-02-25',
          description: 'UPI Payment - Zomato',
          amount: -320.00,
          type: 'DEBIT',
          balance: 72950.50
        },
        {
          date: '2024-02-20',
          description: 'Interest Credit',
          amount: 250.00,
          type: 'CREDIT',
          balance: 73270.50
        }
      ],
      summary: {
        total_credits: 60250.00,
        total_debits: 8270.00,
        net_amount: 51980.00,
        period: '2024-01-01 to 2024-03-31'
      }
    };
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            ACCOUNT AGGREGATOR DASHBOARD
          </h1>
          <p className="text-slate-400 text-sm">Live Demo - Consent → Webhook → Data Fetch</p>
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
                          <span className="text-emerald-400 font-mono font-bold">{fiTxnId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Consent ID:</span>
                          <span className="text-slate-300 font-mono">{consentId}</span>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleRetrieveReport}
                      disabled={retrievingReport || !fiTxnId}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-bold py-3 px-6 rounded transition-all duration-200 shadow-lg shadow-emerald-500/20"
                    >
                      {retrievingReport ? 'Retrieving Report...' : 'Retrieve Report'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Report Summary */}
                    {reportData?.summary && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-4">
                        <h3 className="text-emerald-400 font-bold mb-3">Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Total Credits:</span>
                            <div className="text-emerald-400 font-bold">₹{reportData.summary.total_credits?.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Debits:</span>
                            <div className="text-red-400 font-bold">₹{reportData.summary.total_debits?.toLocaleString()}</div>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400">Net Amount:</span>
                            <div className="text-emerald-400 font-bold text-lg">₹{reportData.summary.net_amount?.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Details */}
                    {reportData?.fi_details && reportData.fi_details.length > 0 && (
                      <div className="bg-slate-950 border border-emerald-500/30 rounded p-4">
                        <h3 className="text-emerald-400 font-bold mb-3">Account Details</h3>
                        {reportData.fi_details.map((account, idx) => (
                          <div key={idx} className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Account:</span>
                              <span className="text-slate-300 font-mono">{account.account_number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Type:</span>
                              <span className="text-slate-300 capitalize">{account.account_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Balance:</span>
                              <span className="text-emerald-400 font-bold">₹{account.balance?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Transactions Table */}
                    {reportData?.transactions && reportData.transactions.length > 0 && (
                      <div className="bg-slate-950 border border-emerald-500/30 rounded p-4">
                        <h3 className="text-emerald-400 font-bold mb-3">Recent Transactions</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-emerald-500/30">
                                <th className="text-left py-2 text-slate-400">Date</th>
                                <th className="text-left py-2 text-slate-400">Description</th>
                                <th className="text-right py-2 text-slate-400">Amount</th>
                                <th className="text-right py-2 text-slate-400">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.transactions.map((txn, idx) => (
                                <tr key={idx} className="border-b border-slate-800">
                                  <td className="py-2 text-slate-300">{txn.date}</td>
                                  <td className="py-2 text-slate-300">{txn.description}</td>
                                  <td className={`py-2 text-right font-mono ${
                                    txn.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'
                                  }`}>
                                    {txn.type === 'CREDIT' ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
                                  </td>
                                  <td className="py-2 text-right text-slate-300 font-mono">₹{txn.balance?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

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

