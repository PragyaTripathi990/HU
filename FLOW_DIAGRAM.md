# 🔄 Complete Flow Diagram

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                    │
└─────────────────────────────────────────────────────────┘

[Start] → Login with Email/Password
    │
    ├─→ POST /api/login (Saafe API)
    │
    ├─→ Receive: access_token, refresh_token, expires_at
    │
    ├─→ Store in: aa_tsp_tokens table
    │
    └─→ Token valid for 24 hours
        │
        ├─→ Before expiry (e.g., 5 min remaining)
        │   ├─→ Auto-refresh via POST /api/refresh
        │   └─→ Update tokens in DB
        │
        └─→ On 403 error
            ├─→ Try refresh
            ├─→ Retry original request
            └─→ If refresh fails → Re-login
```

## Complete Consent-to-Report Flow

```
┌─────────────────────────────────────────────────────────┐
│              CONSENT → DATA → REPORT FLOW                │
└─────────────────────────────────────────────────────────┘

STEP 1: INITIATE CONSENT
─────────────────────────
Your System
    │
    └─→ POST /internal/aa/consents/initiate
        {
          "internal_user_id": "123",
          "mobile": "9876543210",
          "email": "user@example.com",
          "dob": "1990-01-01",
          "pan": "ABCDE1234F",
          "fi_types": ["DEPOSIT"],
          "data_range": "6 months"
        }
    │
    ▼
Your Service
    │
    ├─→ Build Saafe payload
    ├─→ Set callback URLs
    └─→ POST /api/generate/consent (Saafe)
    │
    ▼
Saafe API
    │
    └─→ Returns:
        {
          "request_id": 1194,
          "txn_id": "d2bb28e7-...",
          "consent_handle": "1130468f-...",
          "vua": "9898989898@dashboard-aa",
          "url": "https://sandbox.redirection.saafe.in/..."
        }
    │
    ▼
Your Service
    │
    ├─→ Store in: aa_consent_requests
    │   - status = "PENDING"
    │   - Store all fields + raw response
    │
    └─→ Return redirect_url to Your System
    │
    ▼
Your System → Shows URL to Customer


STEP 2: CUSTOMER APPROVES CONSENT
──────────────────────────────────
Customer → Opens redirect_url → Saafe's website
    │
    ├─→ Customer logs in
    ├─→ Reviews consent
    ├─→ Approves/Rejects
    │
    └─→ Customer redirected back


STEP 3: WEBHOOK NOTIFICATION (ACTIVE)
──────────────────────────────────────
Saafe → POST /webhooks/aa/txn (to your service)
    │
    Payload:
    {
      "txn_id": "d2bb28e7-...",
      "request_id": 1194,
      "data": {
        "consent_status": "ACTIVE",
        "consent_id": "consent_id_12345",
        "report_generated": false
      }
    }
    │
    ▼
Your Service
    │
    ├─→ Validate webhook secret
    ├─→ Log to: aa_webhook_events
    ├─→ Update: aa_consent_requests
    │   - status = "ACTIVE"
    │   - consent_id = "consent_id_12345"
    ├─→ Create: aa_txn_status_history entry
    │
    └─→ Trigger FI Request (next step)


STEP 4: REQUEST FINANCIAL DATA
───────────────────────────────
Your Service (or triggered manually)
    │
    └─→ POST /api/data/request (Saafe)
        {
          "consent_id": "consent_id_12345",
          "from": "2024-01-01",
          "to": "2024-12-31",
          "txn_callback_url": "https://your-domain.com/webhooks/aa/txn"
        }
    │
    ▼
Saafe API
    │
    ├─→ Validates consent
    ├─→ Generates encryption keys
    ├─→ Communicates with AA
    ├─→ AA fetches data from Bank/FIP
    │
    └─→ Returns:
        {
          "status": "success",
          "data": {
            "txnid": "d2bb28e7-...",
            "sessionId": "session_12345",
            "response": "OK"
          }
        }
    │
    ▼
Your Service
    │
    └─→ Store FI request details


STEP 5: WEBHOOK NOTIFICATION (REPORT READY)
────────────────────────────────────────────
Saafe → POST /webhooks/aa/txn
    │
    Payload:
    {
      "txn_id": "d2bb28e7-...",
      "data": {
        "consent_status": "READY",
        "consent_id": "consent_id_12345",
        "report_generated": true
      }
    }
    │
    ▼
Your Service
    │
    ├─→ Update: status = "READY"
    ├─→ Update: report_generated = true
    │
    └─→ Trigger Report Retrieval (next step)


STEP 6: RETRIEVE REPORT
────────────────────────
Your Service (or triggered manually)
    │
    └─→ POST /api/retrievereport (Saafe)
        {
          "txn_id": "d2bb28e7-...",
          "report_type": "json"
        }
    │
    ▼
Saafe API
    │
    └─→ Returns:
        {
          "status": "success",
          "data": {
            "txn_id": "d2bb28e7-...",
            "fi_details": [
              {
                "fip_id": "FIP001",
                "account_type": "savings",
                "account_number": "XXXX1234",
                "balance": 50000.00,
                "transactions_count": 150
              }
            ],
            "source_report": "https://storage.googleapis.com/..."
          }
        }
    │
    ▼
Your Service
    │
    ├─→ Store in: aa_reports
    │   - json_data = (JSONB column)
    │   - report_type = "JSON"
    │   - status = "COMPLETED"
    │
    ├─→ Update: aa_consent_requests
    │   - report_status = "COMPLETED"
    │
    └─→ Report is now available!


OPTIONAL: STATUS POLLING (Backup)
──────────────────────────────────
Background Job (every 5 minutes)
    │
    └─→ For consents with:
        - status = PENDING/IN_PROGRESS
        - AND no webhook for > 15 minutes
        │
        └─→ POST /api/status-check
            {
              "request_id": 1194
            }
        │
        └─→ Update status if changed
```

## BSA (Bank Statement Analysis) Flow

```
┌─────────────────────────────────────────────────────────┐
│                   BSA ANALYSIS FLOW                      │
└─────────────────────────────────────────────────────────┘

STEP 1: UPLOAD PDF
──────────────────
Your System
    │
    └─→ POST /internal/aa/bsa/initiate
        Form-data:
          - tracking_id: "uuid"
          - files: bankstatement.pdf
          - file_password: "optional"
          - webhook_url: "https://..."
    │
    ▼
Your Service
    │
    ├─→ POST /api/bsa/statement (Saafe)
    │   Multipart form-data with PDF
    │
    └─→ Store in: aa_bsa_runs
        - tracking_id
        - status = "INITIATED"
    │
    ▼
Saafe API
    │
    └─→ Returns: Success


STEP 2: POLL STATUS
───────────────────
Background Job (every 2 minutes)
    │
    └─→ For BSA runs with status = "INITIATED"
        │
        └─→ GET /api/bsa/status?tracking_id=...
        │
        ▼
    Saafe API
        │
        └─→ Returns:
            {
              "tracking_id": "...",
              "status": "COMPLETED",
              "xlsx_docs_url": "https://...",
              "json_docs_url": "https://..."
            }
        │
        ▼
    Your Service
        │
        ├─→ Update: aa_bsa_runs
        │   - status = "COMPLETED"
        │   - xlsx_docs_url = "..."
        │   - json_docs_url = "..."
        │
        └─→ (Optional) Download and store files


OR: WEBHOOK NOTIFICATION
─────────────────────────
Saafe → POST to webhook_url (provided in step 1)
    │
    └─→ Same payload as status check
    │
    └─→ Your service processes and updates DB
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│                  ERROR HANDLING FLOW                     │
└─────────────────────────────────────────────────────────┘

API Call to Saafe
    │
    ▼
Check Response Status
    │
    ├─→ 200 OK → Continue
    │
    ├─→ 403 Forbidden
    │   ├─→ Refresh token
    │   ├─→ Retry request
    │   └─→ If still fails → Re-login
    │
    └─→ 400/500 Error
        ├─→ Parse error message
        ├─→ Categorize error:
        │   ├─→ INPUT_VALIDATION → Fail fast (no retry)
        │   ├─→ AA_RESPONSE_VALIDATION → Fail fast
        │   ├─→ CONSENT_ISSUES → Fail fast
        │   └─→ INFRA/NETWORK → Retry 3x with backoff
        │
        ├─→ Store in: aa_errors table
        │   - context: LOGIN/CONSENT/FI_REQUEST/etc.
        │   - error_category
        │   - error_message
        │   - raw_response
        │
        └─→ Log to application logs
            - Include request_id/txn_id
            - Include full context
```

## Database Relationships

```
aa_consent_requests (1) ──── (many) aa_txn_status_history
    │
    ├─── (1) ──── (many) aa_reports
    │
    └─── (1) ──── (many) aa_webhook_events

aa_bsa_runs (independent)

aa_tsp_tokens (single row, updated in place)

aa_errors (independent, references txn_id/request_id)
```

---

## Key Points to Remember

1. **Tokens**: Auto-refresh before expiry (check every request)
2. **Webhooks**: Always validate secret, handle idempotency
3. **Status Polling**: Backup mechanism if webhooks fail
4. **Error Categories**: Determine retry strategy
5. **Date Validation**: No future dates, max 2 years, within consent period
6. **Idempotency**: Use txn_id + status as key for webhooks

