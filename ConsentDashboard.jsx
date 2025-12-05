import React, { useState, useEffect } from 'react';
import './ConsentDashboard.css';

const ConsentDashboard = () => {
  const [step, setStep] = useState(1); // 1: Initiate, 2: Approve, 3: Success
  const [mobile, setMobile] = useState('9898989898');
  const [internalUserId] = useState(`user-${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Step 1: Consent initiation
  const [consentData, setConsentData] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [requestId, setRequestId] = useState(null);
  
  // Step 2: Status polling
  const [status, setStatus] = useState('PENDING');
  const [polling, setPolling] = useState(false);
  
  // Step 3: Success
  const [consentId, setConsentId] = useState(null);

  const API_BASE_URL = 'http://localhost:3000';

  // Step 1: Initiate Consent
  const handleInitiateConsent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/internal/aa/consents/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          internal_user_id: internalUserId,
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
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate consent');
      }

      setConsentData(data.data);
      setRedirectUrl(data.data.redirect_url);
      setRequestId(data.data.request_id);
      setStep(2);
    } catch (err) {
      console.error('Error initiating consent:', err);
      setError(err.message || 'Failed to initiate consent. Please check CORS settings and ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Check Status
  const checkStatus = async () => {
    if (!requestId) return;

    setPolling(true);
    setError(null);

    try {
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
      setStatus(currentStatus);

      if (currentStatus === 'ACTIVE') {
        setConsentId(consent.consent_id || 'N/A');
        setStep(3);
        setPolling(false);
      } else if (currentStatus === 'REJECTED' || currentStatus === 'REVOKED') {
        setError(`Consent was ${currentStatus}`);
        setPolling(false);
      }
    } catch (err) {
      console.error('Error checking status:', err);
      setError(err.message || 'Failed to check status');
      setPolling(false);
    }
  };

  // Auto-poll when on step 2
  useEffect(() => {
    if (step === 2 && !polling && status !== 'ACTIVE' && requestId) {
      const interval = setInterval(() => {
        checkStatus();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, polling, status, requestId]);

  const handleAuthorize = () => {
    if (redirectUrl) {
      window.open(redirectUrl, '_blank');
    }
  };

  const handleFetchData = () => {
    // Placeholder for next phase
    alert('Fetch Data functionality will be implemented in the next phase');
  };

  return (
    <div className="consent-dashboard">
      <div className="dashboard-container">
        <h1 className="dashboard-title">Bank Account Connection</h1>
        <p className="dashboard-subtitle">Connect your bank account securely via Account Aggregator</p>

        {/* Stepper Indicator */}
        <div className="stepper">
          <div className={`stepper-step ${step >= 1 ? 'active' : ''}`}>
            <div className="stepper-number">1</div>
            <div className="stepper-label">Initiate</div>
          </div>
          <div className={`stepper-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`stepper-step ${step >= 2 ? 'active' : ''}`}>
            <div className="stepper-number">2</div>
            <div className="stepper-label">Approve</div>
          </div>
          <div className={`stepper-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`stepper-step ${step >= 3 ? 'active' : ''}`}>
            <div className="stepper-number">3</div>
            <div className="stepper-label">Success</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-card glass-card">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
            {error.includes('CORS') && (
              <div className="error-hint">
                <strong>Fix CORS:</strong> Ensure your Express backend has CORS enabled:
                <code>app.use(cors());</code>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Initiate Consent */}
        {step === 1 && (
          <div className="glass-card">
            <h2 className="card-title">Step 1: Initiate Consent</h2>
            <div className="form-group">
              <label htmlFor="mobile">Mobile Number</label>
              <input
                id="mobile"
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter mobile number"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="userId">Internal User ID</label>
              <input
                id="userId"
                type="text"
                value={internalUserId}
                disabled
                className="form-input disabled"
              />
            </div>
            <button
              onClick={handleInitiateConsent}
              disabled={loading || !mobile}
              className="btn-primary"
            >
              {loading ? 'Connecting...' : 'Connect Bank Account'}
            </button>
          </div>
        )}

        {/* Step 2: Authorization */}
        {step === 2 && (
          <div className="glass-card">
            <h2 className="card-title">Step 2: Authorize on Saafe</h2>
            <div className="status-info">
              <div className="status-badge pending">Status: {status}</div>
            </div>
            <div className="info-section">
              <p className="info-text">
                Click the button below to authorize the consent on Saafe's secure platform.
              </p>
              <button
                onClick={handleAuthorize}
                className="btn-primary"
              >
                Authorize on Saafe
              </button>
            </div>
            <div className="url-display">
              <label>Authorization URL:</label>
              <div className="url-box">{redirectUrl}</div>
            </div>
            <div className="status-section">
              <button
                onClick={checkStatus}
                disabled={polling}
                className="btn-secondary"
              >
                {polling ? 'Checking...' : 'Check Status'}
              </button>
              {polling && (
                <div className="polling-indicator">
                  <div className="spinner"></div>
                  <span>Polling every 5 seconds...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="glass-card success-card">
            <div className="success-icon">✅</div>
            <h2 className="card-title">Connection Successful!</h2>
            <p className="success-message">
              Your bank account has been successfully connected via Account Aggregator.
            </p>
            <div className="success-details">
              <div className="detail-item">
                <span className="detail-label">Consent ID:</span>
                <span className="detail-value">{consentId || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value success-badge">ACTIVE</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Request ID:</span>
                <span className="detail-value">{requestId}</span>
              </div>
            </div>
            <div className="action-buttons">
              <button
                onClick={handleFetchData}
                className="btn-primary"
              >
                Fetch Data
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setStatus('PENDING');
                  setConsentData(null);
                  setRedirectUrl(null);
                  setRequestId(null);
                  setConsentId(null);
                  setError(null);
                }}
                className="btn-secondary"
              >
                Start New Connection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentDashboard;

