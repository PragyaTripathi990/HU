# 📊 Database Schema Visual Diagram

## Complete Schema Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMAS                         │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────┐
│   1. TSPToken (aa_tsp_tokens)      │
├────────────────────────────────────┤
│ • access_token (String, indexed)   │
│ • refresh_token (String)           │
│ • token_type: "bearer"             │
│ • fiu_id (String, indexed)         │
│ • expires_at (Date, indexed)       │
│ • is_active (Boolean, indexed)     │
│ • createdAt, updatedAt             │
└────────────────────────────────────┘
            │
            │ Used by all API calls
            │
            ▼

┌────────────────────────────────────┐
│ 2. ConsentRequest                  │
│    (aa_consent_requests)           │
├────────────────────────────────────┤
│ • internal_user_id (String, idx)   │
│ • request_id (Mixed, unique)       │
│ • txn_id (String, unique, idx)     │◄──┐
│ • consent_handle (String, idx)     │   │
│ • consent_id (String, idx)         │   │
│ • vua (String)                     │   │
│ • status (Enum, indexed)           │   │
│ • report_generated (Boolean)       │   │
│ • customer_details (Mixed)         │   │
│ • consent_details (Mixed)          │   │
│ • raw_request (Mixed)              │   │
│ • raw_response (Mixed)             │   │
│ • redirect_url (String)            │   │
│ • last_webhook_received_at         │   │
│ • fi_request_initiated             │   │
└────────────────────────────────────┘   │
            │                             │
            │ Has many ───────────────────┤
            │                             │
    ┌───────┴────────┐                   │
    │                │                   │
    ▼                ▼                   │
┌──────────────┐  ┌──────────────┐       │
│ 3. Webhook   │  │ 4. TxnStatus │       │
│    Event     │  │    History   │       │
├──────────────┤  ├──────────────┤       │
│ • event_type │  │ • txn_id     │───────┘
│ • txn_id     │──┼• status_code │
│ • request_id │  │ • status_msg │
│ • payload    │  │ • source     │
│ • processed  │  │ • raw_payload│
│ • idemp_key  │  │              │
└──────────────┘  └──────────────┘
                          │
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼

┌──────────────────────────────────────────┐
│ 5. Report (aa_reports)                   │
├──────────────────────────────────────────┤
│ • txn_id (String, unique, indexed) ─────┘
│ • request_id (Mixed, indexed)            │
│ • consent_id (String, indexed)           │
│ • report_type: "JSON" | "XLSX"           │
│ • json_data (Mixed, nullable)            │
│ • file_path (String, nullable)           │
│ • file_url (String, nullable)            │
│ • status: PENDING | COMPLETED | FAILED   │
│ • source_report_url (String)             │
│ • metadata (Mixed)                       │
└──────────────────────────────────────────┘


┌──────────────────────────────────────────┐
│ 6. BSARun (aa_bsa_runs)                  │
├──────────────────────────────────────────┤
│ • tracking_id (String, unique, idx)      │
│ • status (Enum, indexed)                 │
│ • xlsx_docs_url (String)                 │
│ • json_docs_url (String)                 │
│ • xlsx_file_path (String)                │
│ • json_file_path (String)                │
│ • webhook_url (String)                   │
│ • raw_last_response (Mixed)              │
│ • initiated_at (Date)                    │
│ • completed_at (Date)                    │
└──────────────────────────────────────────┘
            │
            │ Can have errors
            ▼

┌──────────────────────────────────────────┐
│ 7. Error (aa_errors)                     │
├──────────────────────────────────────────┤
│ • context (Enum, indexed)                │
│ • txn_id (String, indexed, sparse)       │◄── Can reference ConsentRequest
│ • request_id (Mixed, indexed, sparse)    │
│ • tracking_id (String, indexed, sparse)  │◄── Can reference BSARun
│ • error_category (Enum, indexed)         │
│ • error_message (String)                 │
│ • error_code (String)                    │
│ • http_status_code (Number)              │
│ • raw_response (Mixed)                   │
│ • is_retryable (Boolean, indexed)        │
│ • retry_count (Number)                   │
│ • resolved (Boolean, indexed)            │
└──────────────────────────────────────────┘
```

## Relationship Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW                                │
└─────────────────────────────────────────────────────────────┘

1. AUTHENTICATION
   TSPToken (1 active token)
        │
        └──→ Used for all API calls

2. CONSENT LIFECYCLE
   ConsentRequest created
        │
        ├──→ WebhookEvent logged (when status changes)
        │
        ├──→ TxnStatusHistory added (each status change)
        │
        └──→ Report created (when data retrieved)
                │
                └──→ Can reference same txn_id

3. ERROR HANDLING
   Any operation
        │
        └──→ Error logged (if failure occurs)
                ├──→ Links to txn_id (if consent-related)
                └──→ Links to tracking_id (if BSA-related)

4. BSA FLOW
   BSARun created
        │
        └──→ Status tracked independently
                │
                └──→ Error logged (if failure)
```

## Index Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    INDEXES                                  │
└─────────────────────────────────────────────────────────────┘

PRIMARY INDEXES (Unique)
├── TSPToken: None (single active record)
├── ConsentRequest: request_id, txn_id
├── WebhookEvent: None (allow duplicates for audit)
├── TxnStatusHistory: None (allow duplicates)
├── Report: txn_id
├── BSARun: tracking_id
└── Error: None (allow multiple errors)

LOOKUP INDEXES (Fast Queries)
├── TSPToken: access_token, fiu_id, expires_at, is_active
├── ConsentRequest: internal_user_id, consent_handle, 
│                   consent_id, status, report_generated
├── WebhookEvent: event_type, txn_id, processed, idempotency_key
├── TxnStatusHistory: txn_id, request_id, status_code, consent_status
├── Report: request_id, consent_id, status
├── BSARun: status
└── Error: context, error_category, txn_id, is_retryable

COMPOUND INDEXES (Complex Queries)
├── TSPToken: (is_active, expires_at) - For refresh checks
├── ConsentRequest: 
│   ├── (status, last_webhook_received_at) - For polling
│   ├── (internal_user_id, createdAt) - User history
│   └── (status, report_generated) - Report retrieval
├── WebhookEvent: 
│   ├── (processed, createdAt) - Unprocessed webhooks
│   └── (txn_id, event_type, createdAt) - History
├── TxnStatusHistory: 
│   ├── (txn_id, createdAt) - Transaction timeline
│   └── (request_id, createdAt) - Request timeline
└── Error:
    ├── (context, createdAt) - Context errors
    ├── (error_category, resolved, createdAt) - By category
    └── (is_retryable, resolved, createdAt) - Retry jobs
```

## Status Enums Reference

```
CONSENT STATUSES
├── PENDING
├── ACTIVE
├── REJECTED
├── REVOKED
├── PAUSED
├── FAILED
├── EXPIRED
├── DENIED
├── TIMEOUT
├── READY
└── IN_PROGRESS

BSA STATUSES
├── INITIATED
├── COMPLETED
├── FAILED
├── ERRORED
├── FETCH_ERRORED
├── PURGED
├── INITIATION_FAILED
└── IN_PROGRESS

REPORT STATUSES
├── PENDING
├── COMPLETED
└── FAILED

ERROR CATEGORIES
├── INPUT_VALIDATION
├── AA_RESPONSE_VALIDATION
├── CONSENT_ISSUES
├── INFRA_NETWORK
├── AUTHENTICATION
├── TIMEOUT
└── UNKNOWN

ERROR CONTEXTS
├── LOGIN
├── CONSENT
├── FI_REQUEST
├── RETRIEVE_REPORT
├── BSA
├── REFRESH_TOKEN
└── STATUS_CHECK
```

## Common Query Patterns

```
┌─────────────────────────────────────────────────────────────┐
│              QUERY EXAMPLES                                 │
└─────────────────────────────────────────────────────────────┘

1. GET ACTIVE TOKEN
   TSPToken.findOne({ is_active: true })

2. FIND PENDING CONSENTS (for polling)
   ConsentRequest.find({
     status: { $in: ['PENDING', 'IN_PROGRESS'] },
     $or: [
       { last_webhook_received_at: null },
       { last_webhook_received_at: { $lt: threshold } }
     ]
   })

3. CHECK WEBHOOK IDEMPOTENCY
   WebhookEvent.findOne({ 
     idempotency_key: `${txnId}_${status}`,
     processed: true
   })

4. GET CONSENT HISTORY
   TxnStatusHistory.find({ txn_id })
     .sort({ createdAt: -1 })

5. FIND RETRYABLE ERRORS
   Error.find({
     is_retryable: true,
     resolved: false,
     retry_count: { $lt: 3 }
   })

6. GET REPORT BY TRANSACTION
   Report.findOne({ txn_id, status: 'COMPLETED' })

7. FIND IN-PROGRESS BSA RUNS
   BSARun.find({
     status: { $in: ['INITIATED', 'IN_PROGRESS'] }
   })
```

---

**📖 For detailed documentation, see SCHEMA_DOCUMENTATION.md**

