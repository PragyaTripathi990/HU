# 🧪 Testing Guide: Consent Generation (Rewritten)

## Prerequisites

1. ✅ Server is running
2. ✅ MongoDB is connected
3. ✅ Environment variables are set (`.env` file)
4. ✅ Authentication is working (you can login/get tokens)

---

## Step 1: Verify Server is Running

```bash
# Check if server is running
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-04T...",
  "service": "Saafe TSP Integration Service"
}
```

If not running, start it:
```bash
npm run dev
```

---

## Step 2: Verify Authentication is Working

```bash
# Check auth status
curl http://localhost:3000/api/auth/status
```

**Expected Response:**
```json
{
  "authenticated": true,
  "token_valid": true,
  ...
}
```

If not authenticated, login first:
```bash
curl -X POST http://localhost:3000/api/auth/login
```

---

## Step 3: Test Consent Generation

### Test 1: Minimal Request (Only Required Fields)

This is the simplest test - only mandatory fields:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_001",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

**What This Tests:**
- ✅ Basic payload building
- ✅ Default values (fetch_type=PERIODIC, purpose_code=102, etc.)
- ✅ Date calculations (consent_start, consent_expiry, data ranges)
- ✅ API call to Saafe

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Consent generated successfully",
  "data": {
    "consent_id": "...",
    "request_id": 1234,
    "txn_id": "d2bb28e7-...",
    "consent_handle": "1130468f-...",
    "vua": "9898989898@dashboard-aa",
    "redirect_url": "https://sandbox.redirection.saafe.in/...",
    "status": "PENDING"
  }
}
```

---

### Test 2: Request with Optional Customer Fields

Test with email, DOB, and PAN:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_002",
    "mobile": "9876543210",
    "email": "test@example.com",
    "dob": "1990-01-01",
    "pan": "ABCDE1234F",
    "fi_types": ["DEPOSIT"]
  }'
```

**What This Tests:**
- ✅ Optional customer_details fields
- ✅ Date and PAN validation
- ✅ Field inclusion in payload

---

### Test 3: Request with Custom Dates and FI Types

Test with multiple FI types and custom date ranges:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_003",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT", "TERM_DEPOSIT"],
    "consent_start_date": "2024-01-01",
    "consent_expiry_date": "2025-12-31",
    "fi_datarange_from": "2024-06-01",
    "fi_datarange_to": "2024-12-01",
    "fi_datarange_unit": "MONTH",
    "fi_datarange_value": 6
  }'
```

**What This Tests:**
- ✅ Multiple FI types
- ✅ Custom date ranges
- ✅ Date range calculations

---

### Test 4: Full Request (All Fields)

Test with all optional fields:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_004",
    "mobile": "9876543210",
    "email": "user@example.com",
    "dob": "1990-01-01",
    "pan": "ABCDE1234F",
    "customer_id": "CUST123",
    "delivery_mode": ["SMS", "EMAIL"],
    "fip_id": ["FIP001"],
    "fi_types": ["DEPOSIT"],
    "consent_start_date": "2024-01-01",
    "consent_expiry_date": "2025-01-01",
    "purpose_code": "102",
    "consent_mode": "STORE",
    "consent_types": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
    "fetch_type": "PERIODIC",
    "fi_datarange_unit": "MONTH",
    "fi_datarange_value": 6,
    "fi_datarange_from": "2024-06-01",
    "fi_datarange_to": "2024-12-01",
    "data_life_unit": "MONTH",
    "data_life_value": 6,
    "frequency_unit": "MONTH",
    "frequency_value": 1
  }'
```

**What This Tests:**
- ✅ All optional fields
- ✅ Delivery mode and FIP IDs
- ✅ Custom callback URLs (if provided)

---

## Step 4: Check Server Logs

Watch your server console for detailed logs:

**You should see:**
```
🚀 Starting consent generation...
📤 Calling Saafe API: POST /api/generate/consent
📋 Payload being sent: {
  "customer_details": {
    "mobile_number": "9876543210",
    ...
  },
  "consent_details": [
    {
      "consent_start": "2024-12-04",
      "consent_expiry": "2025-12-04",
      "fetch_type": "PERIODIC",
      ...
    }
  ],
  ...
}
✅ Consent generated successfully!
   Request ID: 1234
   Transaction ID: d2bb28e7-...
   Consent Handle: 1130468f-...
💾 Consent request stored in database
```

**Key Things to Check:**
1. ✅ Payload structure matches Saafe API format
2. ✅ `fetch_type` is "PERIODIC" (not ONETIME)
3. ✅ All required fields are present
4. ✅ No undefined/null fields in payload
5. ✅ Success message appears

---

## Step 5: Verify Database Storage

Check MongoDB to verify the consent was stored:

```bash
# Using mongosh
mongosh "your-mongodb-uri"

# Switch to database
use saafe_db

# Find latest consent
db.aa_consent_requests.find().sort({createdAt: -1}).limit(1).pretty()

# Or find by internal_user_id
db.aa_consent_requests.find({internal_user_id: "test_user_001"}).pretty()
```

**What to Verify:**
- ✅ `request_id` is stored
- ✅ `txn_id` is stored
- ✅ `consent_handle` is stored
- ✅ `status` is "PENDING"
- ✅ `customer_details` is stored correctly
- ✅ `consent_details` is stored correctly
- ✅ `raw_request` contains the payload sent to Saafe
- ✅ `raw_response` contains Saafe's response

---

## Step 6: Test Error Scenarios

### Error Test 1: Missing Required Fields

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "error": "mobile is required"
}
```

---

### Error Test 2: Missing FI Types

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user",
    "mobile": "9876543210"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "error": "fi_types is required and must be a non-empty array"
}
```

---

### Error Test 3: Invalid Mobile Number

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user",
    "mobile": "12345",
    "fi_types": ["DEPOSIT"]
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "error": "Mobile number must be 10 digits starting with 6-9"
}
```

---

### Error Test 4: Invalid Email Format

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user",
    "mobile": "9876543210",
    "email": "invalid-email",
    "fi_types": ["DEPOSIT"]
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "error": "Invalid email format"
}
```

---

### Error Test 5: Invalid PAN Format

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user",
    "mobile": "9876543210",
    "pan": "INVALID",
    "fi_types": ["DEPOSIT"]
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "error": "PAN must be in format: ABCDE1234F"
}
```

---

### Error Test 6: Invalid FI Type

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user",
    "mobile": "9876543210",
    "fi_types": ["INVALID_TYPE"]
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "error": "Invalid FI type: INVALID_TYPE. Valid types: DEPOSIT, TERM_DEPOSIT, ..."
}
```

---

## Step 7: Check API Response Structure

After a successful request, verify the response contains:

```json
{
  "success": true,
  "message": "Consent generated successfully",
  "data": {
    "consent_id": "MongoDB ObjectId",
    "request_id": 1234,
    "txn_id": "UUID string",
    "consent_handle": "UUID string",
    "vua": "mobile@dashboard-aa",
    "redirect_url": "https://sandbox.redirection.saafe.in/...",
    "status": "PENDING"
  }
}
```

**The redirect_url** is what you'll use to redirect customers to Saafe's consent approval page.

---

## Step 8: Test Retrieving Consent

After creating a consent, test retrieving it:

```bash
# Replace CONSENT_ID with the ID from the response
curl http://localhost:3000/internal/aa/consents/CONSENT_ID
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "internal_user_id": "test_user_001",
    "request_id": 1234,
    "txn_id": "...",
    "status": "PENDING",
    ...
  }
}
```

---

## Step 9: List All Consents

```bash
# Get all consents
curl http://localhost:3000/internal/aa/consents

# Get consents with filters
curl "http://localhost:3000/internal/aa/consents?status=PENDING&internal_user_id=test_user_001"
```

---

## Step 10: Verify Payload Structure

The most important thing is to check that the payload sent to Saafe matches the exact structure. 

**In your server logs, look for:**
```
📋 Payload being sent: {
  "customer_details": {
    "mobile_number": "9876543210"  // Only these 4 fields possible
  },
  "consent_details": [
    {
      "consent_start": "2024-12-04",
      "consent_expiry": "2025-12-04",
      "consent_mode": "STORE",
      "consent_types": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
      "fetch_type": "PERIODIC",  // ✅ Must be PERIODIC
      "fi_types": ["DEPOSIT"],
      "purpose_code": "102",
      "fi_datarange_unit": "MONTH",
      "fi_datarange_value": 6,
      "fi_datarange_from": "2024-06-04",
      "fi_datarange_to": "2024-12-04",
      "data_life_unit": "MONTH",
      "data_life_value": 6,
      "frequency_unit": "MONTH",  // ✅ Included because PERIODIC
      "frequency_value": 1        // ✅ Included because PERIODIC
    }
  ],
  "txn_callback_url": "...",
  "consent_callback_url": "..."
}
```

**Key Checks:**
- ✅ `fetch_type` is "PERIODIC" (not ONETIME)
- ✅ `frequency_unit` and `frequency_value` are present (for PERIODIC)
- ✅ No undefined/null/empty fields
- ✅ Structure matches Saafe API documentation exactly

---

## Common Issues & Solutions

### Issue 1: "Fetch_Type is invalid" Error

**Cause:** Payload structure doesn't match Saafe requirements

**Solution:**
1. Check server logs for the exact payload being sent
2. Verify `fetch_type` is "PERIODIC"
3. Verify frequency fields are included
4. Compare with Saafe API documentation

---

### Issue 2: "Invalid mobile number" Error

**Cause:** Mobile number format is incorrect

**Solution:**
- Use 10 digits starting with 6-9
- Example: "9876543210"

---

### Issue 3: Authentication Failed (403)

**Cause:** Token expired or invalid

**Solution:**
```bash
# Refresh authentication
curl -X POST http://localhost:3000/api/auth/login
```

---

### Issue 4: Server Not Responding

**Cause:** Server not running or crashed

**Solution:**
```bash
# Check server logs
npm run dev

# Check if port is in use
lsof -i :3000
```

---

## Quick Test Checklist

- [ ] Server is running (`/health` endpoint works)
- [ ] Authentication is working (`/api/auth/status` returns valid token)
- [ ] Minimal request succeeds (only mobile + fi_types)
- [ ] Payload in logs shows `fetch_type: "PERIODIC"`
- [ ] Payload in logs shows frequency fields present
- [ ] No undefined/null fields in payload
- [ ] Consent stored in MongoDB
- [ ] Error scenarios return proper error messages
- [ ] Can retrieve consent by ID
- [ ] Can list consents

---

## Next Steps After Testing

Once consent generation works:

1. ✅ Use the `redirect_url` to send customers to Saafe
2. ✅ Wait for webhook notifications (Phase 4)
3. ✅ Implement status polling (Phase 5)
4. ✅ Implement FI data request (Phase 6)

---

**Ready to test? Start with Step 1 and work through each test!** 🚀

