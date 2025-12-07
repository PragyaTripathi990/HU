# ✅ Consent Generation Code Rewritten

## What Was Changed

The consent generation code has been completely rewritten to **strictly follow** the Saafe TSP API documentation. This ensures the payload structure matches exactly what Saafe expects, preventing Fair Use Policy errors.

---

## Files Created/Modified

### 1. `utils/validators.js` (NEW)
- Validation functions for all input fields:
  - `validateMobileNumber()` - 10 digits, starting with 6-9
  - `validateEmail()` - Email format validation
  - `validateDate()` - YYYY-MM-DD format
  - `validatePAN()` - PAN format (ABCDE1234F)
  - `validateFITypes()` - Valid FI types array
  - `validateDeliveryMode()` - SMS, EMAIL, WHATSAPP
  - `validateFIPIds()` - FIP ID array validation

### 2. `services/consent/consentService.js` (NEW - Rewritten)
- **Strict payload building** according to Saafe API spec:
  - Top-level fields: customer_id, delivery_mode, fip_id (all optional)
  - customer_details: ONLY mobile_number (mandatory), email, date_of_birth, pan_number (optional)
  - consent_details: Single object in array with exact required fields
  - Default values: fetch_type = "PERIODIC" (NOT ONETIME), purpose_code = "102", etc.
  - Payload cleaning: Removes undefined/null/empty fields recursively
- Methods:
  - `buildCustomerDetails()` - Builds customer_details object
  - `buildConsentDetails()` - Builds consent_details array
  - `buildSaafePayload()` - Builds complete payload
  - `generateConsent()` - Calls Saafe API and stores result
  - `getConsentById()`, `getConsentByTxnId()`, `getConsentByRequestId()`

### 3. `routes/consent.js` (NEW - Rewritten)
- `POST /internal/aa/consents/initiate` - Initiate consent generation
- `GET /internal/aa/consents/:id` - Get consent by ID
- `GET /internal/aa/consents` - List consents with filters

### 4. `server.js` (MODIFIED)
- Added consent routes: `app.use('/internal/aa/consents', require('./routes/consent'))`

---

## Key Changes from Previous Version

### ✅ Fixed Issues

1. **fetch_type always "PERIODIC"** (not ONETIME)
   - Frequency fields always included
   - Matches Saafe API requirements

2. **Strict customer_details structure**
   - Only sends: mobile_number, email, date_of_birth, pan_number
   - No extra fields

3. **Strict consent_details structure**
   - Single object in array
   - All required fields present
   - No filter_type/filter_value unless explicitly provided

4. **Payload cleaning**
   - Removes undefined, null, empty fields
   - Recursive cleaning for nested objects/arrays

5. **Validation before API call**
   - All inputs validated before building payload
   - Clear error messages

---

## Exact Payload Structure

The code now generates payloads in this exact format:

```json
{
  "customer_id": "OPTIONAL",
  "delivery_mode": ["SMS"], // OPTIONAL - only if provided
  "fip_id": ["FIP001"], // OPTIONAL - only if provided
  "customer_details": {
    "mobile_number": "9876543210", // MANDATORY
    "email": "user@example.com", // OPTIONAL
    "date_of_birth": "1990-01-01", // OPTIONAL
    "pan_number": "ABCDE1234F" // OPTIONAL
  },
  "consent_details": [
    {
      "consent_start": "2024-01-01",
      "consent_expiry": "2025-01-01",
      "consent_mode": "STORE",
      "consent_types": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
      "fetch_type": "PERIODIC",
      "fi_types": ["DEPOSIT"],
      "purpose_code": "102",
      "fi_datarange_unit": "MONTH",
      "fi_datarange_value": 6,
      "fi_datarange_from": "2024-06-01",
      "fi_datarange_to": "2024-12-01",
      "data_life_unit": "MONTH",
      "data_life_value": 6,
      "frequency_unit": "MONTH",
      "frequency_value": 1
    }
  ],
  "txn_callback_url": "https://your-domain.com/webhooks/aa/txn",
  "consent_callback_url": "https://your-domain.com/webhooks/aa/consent"
}
```

---

## How to Test

### 1. Start Server
```bash
npm run dev
```

### 2. Test Consent Generation

**Minimal Request (only required fields):**
```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_123",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

**Full Request (all fields):**
```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_123",
    "mobile": "9876543210",
    "email": "user@example.com",
    "dob": "1990-01-01",
    "pan": "ABCDE1234F",
    "customer_id": "CUST123",
    "delivery_mode": ["SMS"],
    "fip_id": ["FIP001"],
    "fi_types": ["DEPOSIT", "TERM_DEPOSIT"],
    "consent_start_date": "2024-01-01",
    "consent_expiry_date": "2025-01-01",
    "purpose_code": "102"
  }'
```

### 3. Check Server Logs

You'll see:
```
🚀 Starting consent generation...
📤 Calling Saafe API: POST /api/generate/consent
📋 Payload being sent: {
  "customer_details": {...},
  "consent_details": [...],
  ...
}
```

This shows the **exact payload** being sent to Saafe.

### 4. Verify Database

Check MongoDB:
```bash
mongosh "your-mongodb-uri"
use saafe_db
db.aa_consent_requests.find().sort({createdAt: -1}).limit(1).pretty()
```

---

## Expected Behavior

### ✅ Success Case
- Payload matches Saafe API structure exactly
- No "Fetch_Type is invalid" errors
- Consent request stored in database
- Returns redirect_url for customer approval

### ❌ Error Cases Handled
- Missing required fields (mobile, fi_types)
- Invalid field formats (email, PAN, dates)
- Invalid FI types
- Validation errors before API call

---

## Default Values

When not provided, the service uses:

- `fetch_type`: "PERIODIC" (always)
- `consent_mode`: "STORE"
- `consent_types`: ["PROFILE", "SUMMARY", "TRANSACTIONS"]
- `purpose_code`: "102"
- `fi_datarange_unit`: "MONTH"
- `fi_datarange_value`: 6
- `data_life_unit`: "MONTH"
- `data_life_value`: 6
- `frequency_unit`: "MONTH"
- `frequency_value`: 1
- `consent_start`: Today
- `consent_expiry`: 1 year from start
- `fi_datarange_from`: Today minus 6 months
- `fi_datarange_to`: Today

---

## Important Notes

1. **fetch_type is ALWAYS "PERIODIC"** - Do not use "ONETIME"
2. **No filter fields** unless explicitly provided
3. **All fields validated** before API call
4. **Payload is cleaned** to remove undefined/null/empty
5. **Exact structure** matches Saafe documentation

---

## Next Steps

1. ✅ Test with minimal request
2. ✅ Test with full request
3. ✅ Verify payload in server logs
4. ✅ Check database storage
5. ✅ Test error scenarios

**The code is now ready and should work without Fair Use Policy errors!** 🎉

