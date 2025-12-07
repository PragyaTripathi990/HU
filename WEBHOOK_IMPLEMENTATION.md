# 📥 Phase 4: Webhook Handling Implementation

## ✅ What Was Implemented

### 1. **Webhook Service** (`services/webhook/webhookService.js`)

**Methods:**
- `handleTxnWebhook(payload)` - Handles transaction status webhooks
- `handleConsentWebhook(payload)` - Handles consent status webhooks
- `mapConsentStatus(saafeStatus)` - Maps Saafe status to internal status

**Features:**
- ✅ Finds consent request by `txn_id`, `consent_handle`, or `request_id`
- ✅ Updates consent status (PENDING → ACTIVE, REJECTED, REVOKED, etc.)
- ✅ Sets `consent_id` when status becomes ACTIVE
- ✅ Updates `report_generated` flag when report is ready
- ✅ Logs all webhooks to `aa_webhook_events` collection
- ✅ Idempotency checking (prevents duplicate processing)
- ✅ Updates `last_webhook_received_at` timestamp

### 2. **Webhook Routes** (`routes/webhookRoutes.js`)

**Endpoints:**
- `POST /webhooks/aa/txn` - Transaction status webhook
- `POST /webhooks/aa/consent` - Consent status webhook

**Features:**
- ✅ Validates payload
- ✅ Processes webhook via service
- ✅ Returns 200 OK to Saafe (even on errors - to acknowledge receipt)
- ✅ Comprehensive logging

### 3. **Server Integration** (`server.js`)

- ✅ Registered webhook routes: `app.use('/webhooks', require('./routes/webhookRoutes'))`

---

## 🔄 Webhook Flow

```
1. User approves consent on Saafe UI
   ↓
2. Saafe sends POST to /webhooks/aa/txn
   ↓
3. webhookRoutes.js receives request
   ↓
4. webhookService.handleTxnWebhook() processes:
   - Checks for duplicate (idempotency)
   - Logs webhook to database
   - Finds consent request by txn_id/consent_handle/request_id
   - Updates status (PENDING → ACTIVE)
   - Sets consent_id if ACTIVE
   - Updates report_generated if READY
   ↓
5. Returns 200 OK to Saafe
```

---

## 📋 Webhook Payload Examples

### ACTIVE Status
```json
{
  "txn_id": "d2bb28e7-a45c-4b1a-abd6-b0eb806e01e8",
  "status": "success",
  "data": {
    "consent_handle": "1130468f-45ee-4f06-af5f-0059bd7cbfdf",
    "consent_id": "VALID_CONSENT_ID_HERE",
    "consent_status": "ACTIVE"
  }
}
```

### REJECTED Status
```json
{
  "txn_id": "d2bb28e7-a45c-4b1a-abd6-b0eb806e01e8",
  "status": "error",
  "data": {
    "consent_handle": "1130468f-45ee-4f06-af5f-0059bd7cbfdf",
    "consent_status": "REJECTED"
  }
}
```

### READY Status (Report Generated)
```json
{
  "txn_id": "d2bb28e7-a45c-4b1a-abd6-b0eb806e01e8",
  "status": "success",
  "data": {
    "consent_handle": "1130468f-45ee-4f06-af5f-0059bd7cbfdf",
    "consent_status": "READY",
    "report_generated": true
  }
}
```

---

## 🗄️ Database Updates

When webhook is processed, the following fields are updated in `aa_consent_requests`:

- `status` - Updated based on `consent_status` from webhook
- `consent_id` - Set when status becomes ACTIVE
- `report_generated` - Set to `true` when report is ready
- `last_webhook_received_at` - Timestamp of last webhook

All webhooks are logged to `aa_webhook_events` collection with:
- `event_type` - TXN_STATUS or CONSENT_STATUS
- `txn_id` - Transaction ID
- `payload` - Full webhook payload
- `processed` - Boolean flag
- `processed_at` - Processing timestamp

---

## 🧪 Testing

### Test Script
```bash
node test-webhook.js
```

### Manual Test with curl
```bash
curl -X POST http://localhost:3000/webhooks/aa/txn \
  -H "Content-Type: application/json" \
  -d '{
    "txn_id": "test-txn-id-123",
    "status": "success",
    "data": {
      "consent_handle": "test-consent-handle-123",
      "consent_id": "VALID_CONSENT_ID_HERE",
      "consent_status": "ACTIVE"
    }
  }'
```

### Test with Postman
1. Method: `POST`
2. URL: `http://localhost:3000/webhooks/aa/txn`
3. Headers: `Content-Type: application/json`
4. Body: Use one of the payload examples above

---

## 🔍 Status Mapping

| Saafe Status | Internal Status | Description |
|-------------|----------------|-------------|
| ACTIVE | ACTIVE | Consent approved and active |
| REJECTED | REJECTED | Consent rejected by user |
| REVOKED | REVOKED | Consent revoked by user |
| PAUSED | PAUSED | Consent paused |
| EXPIRED | EXPIRED | Consent expired |
| DENIED | DENIED | Consent denied |
| TIMEOUT | TIMEOUT | Consent request timed out |
| READY | READY | Report generated and ready |
| TxnProcessing | IN_PROGRESS | Transaction in progress |
| ReportGenerated | READY | Report generated |

---

## ✅ Features

1. **Idempotency** - Duplicate webhooks are detected and skipped
2. **Flexible Lookup** - Finds consent by `txn_id`, `consent_handle`, or `request_id`
3. **Comprehensive Logging** - All webhooks logged to database
4. **Error Handling** - Errors logged but 200 OK returned to Saafe
5. **Status Updates** - Automatic status updates in database
6. **Consent ID Management** - Automatically sets `consent_id` when ACTIVE

---

## 📝 Next Steps

After webhook is received and status is ACTIVE:
1. ✅ Consent is ready for FI Request (Phase 5)
2. ✅ Can trigger data fetch from banks
3. ✅ Monitor for READY status to retrieve reports

---

## 🎯 Success Criteria

- ✅ Webhook endpoints respond to Saafe POST requests
- ✅ Consent status automatically updated in database
- ✅ `consent_id` set when status becomes ACTIVE
- ✅ All webhooks logged for audit trail
- ✅ Duplicate webhooks handled (idempotent)
- ✅ Returns 200 OK to Saafe (acknowledges receipt)

---

**Phase 4 Complete! 🎉**


