# 🗺️ Implementation Roadmap - Saafe TSP Integration

## Phase 0: Project Setup & Planning (Day 1)

### Tasks
- [ ] Choose tech stack (Node.js/TypeScript recommended for async/await patterns)
- [ ] Initialize project structure
- [ ] Set up version control (Git)
- [ ] Create `.env.example` file with all required configuration
- [ ] Set up development environment (IDE, database client, Postman)
- [ ] Review API documentation thoroughly
- [ ] Import Postman collection and test basic connectivity

### Deliverables
- ✅ Project repository initialized
- ✅ Basic folder structure created
- ✅ Environment variables documented

---

## Phase 1: Database Setup (Day 1-2)

### Tasks
- [ ] Set up PostgreSQL database
- [ ] Create migration system (using migrations tool)
- [ ] Design and create all 7 tables:
  - [ ] `aa_tsp_tokens`
  - [ ] `aa_consent_requests`
  - [ ] `aa_webhook_events`
  - [ ] `aa_txn_status_history`
  - [ ] `aa_reports`
  - [ ] `aa_bsa_runs`
  - [ ] `aa_errors`
- [ ] Create indexes for frequently queried fields
- [ ] Add foreign key constraints
- [ ] Create database connection module

### Deliverables
- ✅ Database schema complete
- ✅ Migrations run successfully
- ✅ Database connection tested

---

## Phase 2: Authentication Module (Day 2-3)

### Tasks
- [ ] Create `tspAuth` service/module
- [ ] Implement `login()` function:
  - [ ] Call `POST /api/login`
  - [ ] Store tokens in `aa_tsp_tokens` table
  - [ ] Calculate `expires_at` (24 hours from now)
- [ ] Implement `refreshToken()` function:
  - [ ] Call `POST /api/refresh`
  - [ ] Update tokens in database
- [ ] Implement `getValidToken()` function:
  - [ ] Check if current token is valid
  - [ ] Auto-refresh if < 5 minutes until expiry
  - [ ] Return Bearer token for API calls
- [ ] Create HTTP client wrapper with auto token injection
- [ ] Handle 403 errors: auto-retry with refresh
- [ ] Add error handling for auth failures

### Testing
- [ ] Test login flow
- [ ] Test token refresh
- [ ] Test token expiry handling
- [ ] Test 403 retry logic

### Deliverables
- ✅ Authentication module complete
- ✅ Token management working
- ✅ Auto-refresh implemented

---

## Phase 3: Consent Generation (Day 3-4)

### Tasks
- [ ] Create consent service/module
- [ ] Implement `generateConsent()` function:
  - [ ] Map internal request to Saafe format
  - [ ] Call `POST /api/generate/consent` with Bearer token
  - [ ] Store full request/response in `aa_consent_requests`
- [ ] Build internal API endpoint:
  - [ ] `POST /internal/aa/consents/initiate`
  - [ ] Validate input parameters
  - [ ] Generate callback URLs from env vars
  - [ ] Return consent details + redirect URL
- [ ] Create consent details builder:
  - [ ] Handle date calculations (consent_start, consent_expiry)
  - [ ] Map FI types
  - [ ] Set defaults (purpose_code, data_life, etc.)
- [ ] Add validation for required fields
- [ ] Error handling and logging

### Testing
- [ ] Test consent generation with sample data
- [ ] Verify database storage
- [ ] Test error scenarios (invalid purpose code, etc.)

### Deliverables
- ✅ Consent generation working
- ✅ Internal API endpoint ready
- ✅ Data persisted correctly

---

## Phase 4: Webhook Handlers (Day 4-5)

### Tasks
- [ ] Create webhook middleware:
  - [ ] Validate `X-AA-Signature` header (or custom header)
  - [ ] Verify webhook secret
- [ ] Implement `POST /webhooks/aa/txn` endpoint:
  - [ ] Log raw payload to `aa_webhook_events`
  - [ ] Extract `txn_id`, `request_id`, `consent_status`
  - [ ] Update `aa_consent_requests` table
  - [ ] Handle idempotency (don't process duplicate)
- [ ] Implement `POST /webhooks/aa/consent` endpoint:
  - [ ] Similar to txn webhook
  - [ ] Map all consent statuses (PENDING, ACTIVE, REVOKED, etc.)
- [ ] Create webhook processor:
  - [ ] Parse webhook payload
  - [ ] Find matching consent request
  - [ ] Update status fields
  - [ ] Handle `consent_id` (when ACTIVE)
  - [ ] Handle `report_generated` flag
- [ ] Add idempotency check:
  - [ ] Use `txn_id` + `consent_status` as key
  - [ ] Skip if already processed
- [ ] Create status history entries

### Testing
- [ ] Test webhook endpoints (use Postman/webhook.site)
- [ ] Test all status scenarios
- [ ] Test idempotency
- [ ] Test invalid webhook (wrong secret)

### Deliverables
- ✅ Webhook endpoints working
- ✅ Status updates persisted
- ✅ Idempotency implemented

---

## Phase 5: Status Polling (Day 5-6)

### Tasks
- [ ] Create status polling service
- [ ] Implement `pollConsentStatus(request_id)`:
  - [ ] Call `POST /api/status-check`
  - [ ] Parse `txn_status` array
  - [ ] Map status codes (TxnProcessing, ReportGenerated, etc.)
  - [ ] Store in `aa_txn_status_history`
- [ ] Create background job:
  - [ ] Query consents where: status = PENDING/IN_PROGRESS
  - [ ] AND last_webhook > 15 minutes ago
  - [ ] Poll each consent
  - [ ] Update database with results
- [ ] Set up job scheduler (cron or similar)
- [ ] Handle rate limiting (don't poll too frequently)
- [ ] Add logging for polling activities

### Testing
- [ ] Test polling for specific request_id
- [ ] Test background job
- [ ] Test status mapping

### Deliverables
- ✅ Status polling working
- ✅ Background job configured
- ✅ Status history tracked

---

## Phase 6: FI Data Request (Day 6-7)

### Tasks
- [ ] Create FI request service
- [ ] Implement `triggerFIRequest(consent_id, dateRange)`:
  - [ ] Validate consent is ACTIVE
  - [ ] Validate date range (no future, max 2 years, within consent period)
  - [ ] Call `POST /api/data/request`
  - [ ] Handle response
- [ ] Create error categorizer:
  - [ ] Map error messages to categories:
    - INPUT_VALIDATION
    - AA_RESPONSE_VALIDATION
    - CONSENT_ISSUES
    - INFRA/NETWORK
  - [ ] Store in `aa_errors` table
- [ ] Implement retry logic:
  - [ ] Retry 3 times with exponential backoff for INFRA/NETWORK
  - [ ] Fail fast for validation errors
- [ ] Add comprehensive error logging
- [ ] Create internal endpoint to trigger FI request:
  - [ ] `POST /internal/aa/transactions/:txn_id/fi-request`

### Testing
- [ ] Test FI request with valid consent
- [ ] Test all error scenarios
- [ ] Test retry logic
- [ ] Test date range validation

### Deliverables
- ✅ FI request working
- ✅ Error categorization complete
- ✅ Retry logic implemented

---

## Phase 7: Report Retrieval (Day 7-8)

### Tasks
- [ ] Create report service
- [ ] Implement `retrieveReport(txn_id, report_type)`:
  - [ ] Call `POST /api/retrievereport`
  - [ ] Handle JSON response
  - [ ] Store JSON in `aa_reports.json_data` (JSONB)
  - [ ] Handle XLSX: download file, store path/URL
  - [ ] Update consent request: `report_status = COMPLETED`
- [ ] Create status history entry
- [ ] Implement file storage (local or S3-like):
  - [ ] Create storage service
  - [ ] Generate unique file paths
  - [ ] Handle file uploads/downloads
- [ ] Create internal API:
  - [ ] `POST /internal/aa/transactions/:txn_id/retrieve-report`
  - [ ] `GET /internal/aa/reports/:txn_id`
- [ ] Add error handling for report not found

### Testing
- [ ] Test JSON report retrieval
- [ ] Test XLSX report retrieval
- [ ] Test file storage
- [ ] Test error scenarios

### Deliverables
- ✅ Report retrieval working
- ✅ Reports stored correctly
- ✅ Internal APIs ready

---

## Phase 8: BSA (Bank Statement Analysis) (Day 8-9)

### Tasks
- [ ] Create BSA service
- [ ] Implement PDF upload:
  - [ ] `POST /internal/aa/bsa/initiate`
  - [ ] Accept multipart/form-data with PDF files
  - [ ] Call `POST /api/bsa/statement`
  - [ ] Store `tracking_id` in `aa_bsa_runs`
- [ ] Implement status checking:
  - [ ] `GET /internal/aa/bsa/status/:tracking_id`
  - [ ] Call `GET /api/bsa/status?tracking_id=...`
  - [ ] Update status in database
- [ ] Create background job for BSA polling:
  - [ ] Poll status for INITIATED entries
  - [ ] Continue until COMPLETED or terminal failure
  - [ ] Download JSON/XLSX on completion
  - [ ] Store download URLs
- [ ] Handle webhook for BSA status (if provided in callback)
- [ ] Add error handling

### Testing
- [ ] Test PDF upload
- [ ] Test status polling
- [ ] Test download on completion

### Deliverables
- ✅ BSA upload working
- ✅ Status tracking complete
- ✅ Background polling job ready

---

## Phase 9: Internal APIs & Views (Day 9-10)

### Tasks
- [ ] Build remaining internal endpoints:
  - [ ] `GET /internal/aa/consents/:id` - View consent with history
  - [ ] Include status history in response
  - [ ] Include latest webhook data
- [ ] Create admin/debug endpoints:
  - [ ] `GET /internal/aa/tokens/status` - Check token status
  - [ ] `GET /internal/aa/health` - Health check
- [ ] Add request validation
- [ ] Add response formatting
- [ ] Add pagination for list endpoints

### Testing
- [ ] Test all internal APIs
- [ ] Test error responses
- [ ] Test validation

### Deliverables
- ✅ All internal APIs complete
- ✅ Admin endpoints ready

---

## Phase 10: Error Handling & Logging (Day 10-11)

### Tasks
- [ ] Implement centralized error handler
- [ ] Map all Saafe error responses to internal format
- [ ] Create error logging service:
  - [ ] Log to `aa_errors` table
  - [ ] Include context, category, raw response
- [ ] Set up application logging:
  - [ ] Use structured logging (Winston/Pino)
  - [ ] Log all API calls (URL, headers sans secrets, body)
  - [ ] Log all responses
  - [ ] Correlate logs with `request_id`/`txn_id`
- [ ] Add request timeout handling (10-15 seconds)
- [ ] Create error alerting (log errors above threshold)

### Testing
- [ ] Test error scenarios
- [ ] Verify error logging
- [ ] Check log correlation

### Deliverables
- ✅ Error handling robust
- ✅ Comprehensive logging in place

---

## Phase 11: Background Jobs Setup (Day 11)

### Tasks
- [ ] Set up job scheduler (Bull/BullMQ, Agenda, or cron)
- [ ] Create jobs:
  - [ ] Token refresh job (run every 12 hours)
  - [ ] Status polling job (run every 5 minutes)
  - [ ] BSA polling job (run every 2 minutes)
- [ ] Add job failure handling
- [ ] Add job monitoring/logging
- [ ] Test all background jobs

### Deliverables
- ✅ Background jobs configured
- ✅ Jobs running reliably

---

## Phase 12: Integration Testing (Day 12-13)

### Tasks
- [ ] End-to-end test: Full consent flow
  1. Generate consent
  2. Simulate webhook (ACTIVE)
  3. Trigger FI request
  4. Simulate webhook (READY)
  5. Retrieve report
  6. Verify all data in DB
- [ ] Test error scenarios:
  - [ ] Invalid consent
  - [ ] Network timeout
  - [ ] Token expiry during flow
- [ ] Test webhook idempotency
- [ ] Test BSA flow end-to-end
- [ ] Load testing (optional): Multiple concurrent requests

### Deliverables
- ✅ End-to-end tests passing
- ✅ Error scenarios handled

---

## Phase 13: Documentation & Deployment Prep (Day 13-14)

### Tasks
- [ ] Write API documentation (Swagger/OpenAPI)
- [ ] Create README with setup instructions
- [ ] Document environment variables
- [ ] Create deployment guide
- [ ] Add code comments where needed
- [ ] Create troubleshooting guide
- [ ] Prepare .env.example file

### Deliverables
- ✅ Documentation complete
- ✅ Ready for deployment

---

## 🎯 Quick Reference: Implementation Order

```
1. Database Setup (Day 1-2)
2. Authentication (Day 2-3)
3. Consent Generation (Day 3-4)
4. Webhooks (Day 4-5)
5. Status Polling (Day 5-6)
6. FI Request (Day 6-7)
7. Report Retrieval (Day 7-8)
8. BSA (Day 8-9)
9. Internal APIs (Day 9-10)
10. Error Handling (Day 10-11)
11. Background Jobs (Day 11)
12. Testing (Day 12-13)
13. Documentation (Day 13-14)
```

## 📝 Daily Checklist Template

At the end of each day, ask:
- ✅ What did I build today?
- ✅ Did I test it?
- ✅ Are there any blockers?
- ✅ What's next tomorrow?

## 🔥 Priority Order (If Time-Constrained)

1. **Must Have**: Auth, Consent, Webhooks, Reports
2. **Should Have**: Status Polling, FI Request
3. **Nice to Have**: BSA, Advanced Error Handling

---

**Total Estimated Time**: 13-14 days (assuming full-time work)

**Recommended Tech Stack**:
- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL + TypeORM/Prisma
- **Jobs**: BullMQ or node-cron
- **HTTP Client**: Axios
- **Logging**: Winston or Pino
- **Validation**: Zod or Joi

