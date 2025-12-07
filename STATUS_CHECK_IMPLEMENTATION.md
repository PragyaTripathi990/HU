# ✅ Status Check API Implementation Complete

## Overview

Implemented the **POST /api/status-check** functionality to check consent status by calling Saafe's status-check API.

## What Was Implemented

### 1. Service Method: `checkStatus(request_id)`
- ✅ Calls Saafe's `POST /api/status-check` API
- ✅ Parses response with `txn_status` array
- ✅ Maps status codes to consent_status values
- ✅ Stores status history in `aa_txn_status_history` collection
- ✅ Updates `aa_consent_requests` if status changed
- ✅ Proper error handling

### 2. Status Code Mapping

The service maps Saafe status codes to consent_status:

| Saafe Status Code | Consent Status | Description |
|------------------|----------------|-------------|
| `TxnProcessing` | `IN_PROGRESS` | Transaction is being processed |
| `ReportGenerated` | `READY` | Report is ready for download |
| `ConsentRejected` | `REJECTED` | Consent was rejected |
| `ConsentPaused` | `PAUSED` | Consent is paused |
| `ConsentRevoked` | `REVOKED` | Consent was revoked |
| `ConsentApproved` | `ACTIVE` | Consent is active |

### 3. Route Handler

**Endpoint:** `POST /internal/aa/consents/status-check`

**Request Body:**
```json
{
  "request_id": 1234567890
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Status check completed successfully",
  "data": {
    "request_id": 1234567890,
    "consent_id": "consent_id_12345",
    "consent_handle": "1130468f-45ee-4f06-af5f-0059bd7cbfdf",
    "consent_status": "IN_PROGRESS",
    "report_generated": false,
    "txn_status": [
      {
        "code": "TxnProcessing",
        "status": "InProgress",
        "msg": "..."
      }
    ],
    "status_history_count": 1
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "We could not find the Transaction referred to by the client.",
  "details": { ... }
}
```

## How It Works

1. **Receives request_id** from the API call
2. **Calls Saafe API** `POST /api/status-check` with the request_id
3. **Parses response** and extracts:
   - `consent_id`
   - `consent_handle`
   - `txn_status` array
4. **Processes each status** in the `txn_status` array:
   - Maps status code to consent_status
   - Stores in `aa_txn_status_history` with `source: 'POLL'`
   - Updates consent request if status changed
5. **Returns result** with all status information

## Database Updates

### Status History Storage

For each status code in the response, a new entry is created in `aa_txn_status_history`:

```javascript
{
  txn_id: "...",
  request_id: 1234567890,
  consent_id: "consent_id_12345",
  status_code: "TxnProcessing",
  status_message: "...",
  consent_status: "IN_PROGRESS",
  source: "POLL",  // Indicates this came from polling, not webhook
  raw_payload: { ... },
  metadata: { ... }
}
```

### Consent Request Updates

If the status changed, the consent request is updated:

```javascript
{
  consent_id: "consent_id_12345",  // Set if not already set
  status: "IN_PROGRESS",            // Updated if changed
  report_generated: true            // Set if ReportGenerated
}
```

## Files Modified

1. ✅ `services/consent/consentService.js`
   - Added `checkStatus(request_id)` method
   - Added `mapStatusCodeToConsentStatus(statusCode)` helper
   - Updated imports to include `TxnStatusHistory`

2. ✅ `routes/consent.js`
   - Added `POST /internal/aa/consents/status-check` route

## Testing

### Test Script

Run the test script to verify the implementation:

```bash
node test-status-check.js
```

### Manual Testing

1. **First, create a consent** (if you don't have one):
```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test123",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

2. **Check the status** using the request_id from step 1:
```bash
curl -X POST http://localhost:3000/internal/aa/consents/status-check \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": 1234567890
  }'
```

Replace `1234567890` with the actual `request_id` from the consent creation response.

## Status Codes from Saafe API

According to the documentation, the status-check API returns these status codes:

| Status Code | Status Value | Message |
|------------|--------------|---------|
| `TxnProcessing` | `InProgress` | "Generated txn URL and transaction ID verified and initiated txn." |
| `ReportGenerated` | `Completed` | "Your account has been successfully analyzed..." |
| `ConsentRejected` | `Rejected` | "Consent has been rejected. Please try again." |
| `ConsentPaused` | `Paused` | "Consent is paused." |
| `ConsentRevoked` | `Revoked` | "Your consent has been revoked. Please try again." |

## Error Handling

The implementation handles:

- ✅ Transaction not found errors
- ✅ Network errors
- ✅ Invalid request_id
- ✅ Unexpected response formats
- ✅ Database errors when storing history

All errors are properly logged and returned with clear error messages.

## Next Steps

This status check can be used for:

1. **Manual status checking** - Call the endpoint when needed
2. **Background polling** - Set up a job to poll stuck transactions
3. **Status history tracking** - All status changes are stored

For background polling, you can create a job that:
- Queries consents with status = PENDING/IN_PROGRESS
- Checks if last webhook was > 15 minutes ago
- Calls status-check for each
- Updates database with results

---

**Implementation Date:** 2025-12-04  
**Status:** ✅ Complete and Ready for Testing

