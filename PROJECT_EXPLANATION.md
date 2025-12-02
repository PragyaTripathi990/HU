# Saafe TSP Integration - Project Explanation

## 🎯 What This Project Does

You're building a **backend service** that integrates with **Saafe TSP (Transaction Service Provider)** to automate Account Aggregator (AA) flows. Think of it as a bridge between your system and India's Account Aggregator ecosystem that lets users share their financial data (bank statements, investments, etc.) securely.

## 📋 Core Functionality

### 1. **Authentication Management**
- Login to Saafe TSP sandbox using email/password
- Get access tokens (valid 24 hours) and refresh tokens
- Automatically refresh tokens before they expire
- Store tokens securely in database

### 2. **Consent Generation**
- Create consent requests for customers
- Generate URLs where customers can approve data sharing
- Track consent status (PENDING → ACTIVE → READY)

### 3. **Webhook Processing**
- Receive real-time updates from Saafe about consent/data status
- Process webhook notifications for:
  - Consent status changes (ACTIVE, REJECTED, REVOKED, etc.)
  - Transaction status updates
  - Report generation notifications

### 4. **Status Polling** (Backup Mechanism)
- If webhooks fail, poll Saafe API to check status
- Monitor stuck transactions
- Store status history

### 5. **Financial Data Requests**
- Once consent is ACTIVE, request financial data from banks/FIPs
- Handle complex error scenarios (validation errors, AA response errors, etc.)
- Retry on network issues, fail fast on validation errors

### 6. **Report Retrieval**
- Download financial reports (JSON or XLSX format)
- Store reports in database or file storage
- Link reports to transactions

### 7. **Bank Statement Analysis (BSA)**
- Upload PDF bank statements for analysis
- Track BSA processing status
- Download analyzed results (JSON/XLSX)

## 🗄️ Database Components

You need 7 main tables:

1. **aa_tsp_tokens** - Store access/refresh tokens
2. **aa_consent_requests** - Track all consent requests
3. **aa_webhook_events** - Log all webhook payloads
4. **aa_txn_status_history** - Status change history
5. **aa_reports** - Store downloaded reports
6. **aa_bsa_runs** - Track BSA processing
7. **aa_errors** - Error logging and categorization

## 🔌 APIs You'll Build (Internal)

These are for YOUR system to use (not user-facing):

1. `POST /internal/aa/consents/initiate` - Start a consent flow
2. `GET /internal/aa/consents/:id` - View consent details
3. `POST /internal/aa/transactions/:txn_id/retrieve-report` - Download report
4. `GET /internal/aa/reports/:txn_id` - View stored report
5. `POST /internal/aa/bsa/initiate` - Start BSA analysis
6. `GET /internal/aa/bsa/status/:tracking_id` - Check BSA status

## 🔗 External APIs You'll Call (Saafe TSP)

1. `POST /api/login` - Get access token
2. `POST /api/refresh` - Refresh token
3. `POST /api/generate/consent` - Create consent
4. `POST /api/status-check` - Check consent status
5. `POST /api/data/request` - Request financial data
6. `POST /api/retrievereport` - Get reports
7. `POST /api/bsa/statement` - Upload PDF for analysis
8. `GET /api/bsa/status` - Check BSA status

## 📊 Complete Flow Example

```
1. User wants to share bank data
   ↓
2. Your system calls: POST /internal/aa/consents/initiate
   ↓
3. Your service calls: POST /api/generate/consent (to Saafe)
   ↓
4. Saafe returns consent URL
   ↓
5. Customer approves consent (on Saafe's website)
   ↓
6. Saafe sends webhook: POST /webhooks/aa/txn (to your service)
   ↓
7. Your service receives: consent_status = "ACTIVE"
   ↓
8. Your service calls: POST /api/data/request (to Saafe)
   ↓
9. Saafe fetches data from bank
   ↓
10. Saafe sends webhook: report_generated = true
    ↓
11. Your service calls: POST /api/retrievereport
    ↓
12. Report stored in your database
```

## 🛠️ Technical Requirements

- **Backend Framework**: Node.js/TypeScript OR Python (your choice)
- **Database**: PostgreSQL
- **Background Jobs**: For token refresh, status polling, BSA polling
- **Error Handling**: Categorize errors, retry logic, logging
- **Logging**: Comprehensive logging for debugging
- **Webhooks**: Public endpoints to receive Saafe callbacks

## ⚠️ Important Notes

1. **Sandbox Environment**: All APIs point to Saafe's sandbox (test environment)
2. **Token Expiry**: Access tokens expire in 24 hours - must refresh automatically
3. **Webhook Security**: Validate webhook requests (shared secret)
4. **Idempotency**: Handle duplicate webhooks gracefully
5. **Error Categories**: Different errors need different handling (retry vs. fail fast)
6. **No Frontend**: This is backend-only - just APIs and webhooks

## 🎯 Success Criteria

✅ Service can authenticate and maintain valid tokens
✅ Can generate consent requests and track them
✅ Receives and processes webhooks correctly
✅ Can request financial data and retrieve reports
✅ Can upload PDFs for BSA analysis
✅ All data stored in PostgreSQL
✅ Comprehensive error handling and logging
✅ Background jobs running smoothly

---

**In Simple Terms**: You're building a service that talks to Saafe's APIs, manages authentication, processes webhooks, fetches financial data on behalf of users, and stores everything in a database. It's like a middleman service that handles all the technical complexity of the Account Aggregator flow.

