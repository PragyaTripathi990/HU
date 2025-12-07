# ✅ FI Request API Implementation Complete

## Overview

Implemented the **POST /api/data/request** functionality to request financial information (FI) from FIPs via Account Aggregator after consent is ACTIVE.

## What Was Implemented

### 1. Service: `fiRequestService.js`
- ✅ `triggerFIRequest(consent_id, options)` - Main method
- ✅ `triggerFIRequestByTxnId(txn_id, options)` - Alternative method
- ✅ Date range validation (4 business rules)
- ✅ Error categorization (4 categories)
- ✅ Default date range calculation
- ✅ Consent status validation

### 2. Date Range Validation Rules

Validates according to Saafe's business rules:

1. ✅ **Chronological Order**: `from_date` must be before `to_date`
2. ✅ **No Future Dates**: Neither date can be in the future
3. ✅ **Maximum Range**: Cannot exceed 2 years
4. ✅ **Consent Compliance**: Must fall within consent period

### 3. Error Categorization

Automatically categorizes errors for retry logic:

| Category | Examples | Retry? |
|----------|----------|--------|
| **INPUT_VALIDATION** | Date range in future, missing fields | ❌ No |
| **CONSENT_ISSUES** | Consent not found, invalid consent ID | ❌ No |
| **AA_RESPONSE_VALIDATION** | JWS mismatch, invalid certificate | ❌ No |
| **INFRA_NETWORK** | Connection timeout, key generation failed | ✅ Yes |

### 4. Route Handlers

**Two endpoints created:**

1. `POST /internal/aa/transactions/fi-request`
   - Uses `consent_id` from request body
   
2. `POST /internal/aa/transactions/:txn_id/fi-request`
   - Uses `txn_id` from URL path

## API Endpoints

### Endpoint 1: By Consent ID

**POST** `/internal/aa/transactions/fi-request`

**Request Body:**
```json
{
  "consent_id": "abc-123",
  "from": "2024-01-01",      // Optional
  "to": "2024-12-31",        // Optional
  "txn_callback_url": "..."  // Optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "FI request initiated successfully",
  "data": {
    "session_id": "session_12345",
    "txn_id": "d2bb28e7-...",
    "consent_id": "abc-123",
    "ver": "2.0.0",
    "timestamp": "2024-06-01T12:00:00.000Z",
    "response": "OK"
  }
}
```

**Error Response (400/503):**
```json
{
  "success": false,
  "error": "Date range cannot be in the future",
  "error_category": "INPUT_VALIDATION",
  "retry_recommended": false,
  "details": { ... }
}
```

### Endpoint 2: By Transaction ID

**POST** `/internal/aa/transactions/:txn_id/fi-request`

**Request Body:**
```json
{
  "from": "2024-01-01",      // Optional
  "to": "2024-12-31",        // Optional
  "txn_callback_url": "..."  // Optional
}
```

**Success/Error responses same as above**

## Date Range Validation

### Business Rules

1. **Chronological Order**: `from` < `to`
2. **No Future Dates**: Both dates ≤ today
3. **Max Range**: ≤ 2 years (730 days)
4. **Within Consent**: `from` ≥ `consent_start`, `to` ≤ `consent_expiry`

### Default Date Range

If dates not provided:
- Uses `fi_datarange_from` and `fi_datarange_to` from consent_details
- Or calculates: last 2 years or consent period (whichever is smaller)

## Error Handling

### Error Categories

#### 1. INPUT_VALIDATION
- Date range in future
- Missing required fields
- Invalid date format
- **Action**: Fix input data, don't retry

#### 2. CONSENT_ISSUES
- Consent details not found
- Invalid consent ID
- Consent not ACTIVE
- **Action**: Check consent status, don't retry

#### 3. AA_RESPONSE_VALIDATION
- JWS signature mismatch
- Invalid certificate
- Missing headers
- Invalid response format
- **Action**: Usually indicates AA-side issue, may retry

#### 4. INFRA_NETWORK
- Connection timeout
- Key generation failed
- Network errors
- **Action**: Retry with exponential backoff

## Consent Validation

Before triggering FI request, the service:

1. ✅ Finds consent by `consent_id` or `txn_id`
2. ✅ Validates consent status is `ACTIVE`
3. ✅ Checks `consent_id` exists
4. ✅ Validates date range against consent period

## Database Updates

After successful FI request:

- Updates `aa_consent_requests`:
  - `fi_request_initiated: true`
  - `fi_request_initiated_at: <timestamp>`

## Files Created

1. ✅ `services/fi/fiRequestService.js` - Main service
2. ✅ `routes/transactions.js` - Route handlers
3. ✅ Updated `server.js` - Added route registration

## Files Modified

1. ✅ `server.js` - Added transactions route

## Error Messages Handled

All error scenarios from documentation:

- ✅ Consent details not found
- ✅ Date range cannot be in the future
- ✅ Key generation failed: Connection timeout
- ✅ Access token generation failed
- ✅ FI request failed : Invalid consent ID
- ✅ Invalid Response from AA: missing required headers
- ✅ Invalid Response from AA: invalid certificate
- ✅ Invalid Response from AA: invalid response format
- ✅ Invalid Response from AA: x-jws-signature mismatch
- ✅ Invalid Response from AA: ver: field required
- ✅ Invalid Response from AA: missing timestamp
- ✅ Invalid Response from AA: invalid timestamp
- ✅ Invalid Response from AA: txnid or sessionId mismatch
- ✅ Invalid Response from AA: consentId mismatch

## Testing

Run test script:

```bash
node test-fi-request.js
```

### Manual Testing

1. **Ensure consent is ACTIVE:**
```bash
# Check consent status first
POST /internal/aa/consents/status-check
{
  "request_id": 1234567890
}
```

2. **Trigger FI request:**
```bash
curl -X POST http://localhost:3000/internal/aa/transactions/fi-request \
  -H "Content-Type: application/json" \
  -d '{
    "consent_id": "abc-123",
    "from": "2024-01-01",
    "to": "2024-12-31"
  }'
```

## Next Steps

After FI request is successful:
1. Wait for webhook notification (status = READY)
2. Retrieve report using `/api/retrievereport`
3. Process financial data

## Flow

```
1. Consent becomes ACTIVE (via webhook or status check)
   ↓
2. Call POST /internal/aa/transactions/fi-request
   ↓
3. Service validates consent and date range
   ↓
4. Calls Saafe POST /api/data/request
   ↓
5. Saafe communicates with AA → AA fetches from FIPs
   ↓
6. Webhook notification: status = READY
   ↓
7. Retrieve report
```

---

**Implementation Date:** 2025-12-04  
**Status:** ✅ Complete and Ready for Testing


