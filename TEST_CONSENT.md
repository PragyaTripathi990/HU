# 🧪 Testing Consent Generation

## Quick Test Guide

### Prerequisites

✅ Server running  
✅ Authentication working (login successful)  
✅ MongoDB connected  

---

## Test 1: Minimal Consent Request

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_123",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

**Expected:**
```json
{
  "success": true,
  "message": "Consent request initiated successfully",
  "data": {
    "request_id": 1194,
    "txn_id": "d2bb28e7-...",
    "redirect_url": "https://sandbox.redirection.saafe.in/...",
    "status": "PENDING"
  }
}
```

---

## Test 2: Full Consent Request

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "user123",
    "mobile": "9876543210",
    "email": "user@example.com",
    "dob": "1990-01-01",
    "pan": "ABCDE1234F",
    "fi_types": ["DEPOSIT", "TERM_DEPOSIT"],
    "fi_datarange_unit": "MONTH",
    "fi_datarange_value": 6,
    "purpose_code": "102"
  }'
```

---

## Test 3: Get Consent by ID

```bash
# Replace CONSENT_ID with actual ID from Test 1
curl http://localhost:3000/internal/aa/consents/CONSENT_ID
```

---

## Test 4: List All Consents

```bash
curl http://localhost:3000/internal/aa/consents
```

---

## Test 5: Validation Errors

```bash
# Missing mobile (should fail)
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "user123",
    "fi_types": ["DEPOSIT"]
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": ["Mobile number is required"]
}
```

---

## 🗄️ Check Database

### View Consent in MongoDB:

```bash
mongosh "your-mongodb-uri"
use saafe_db
db.aa_consent_requests.find().pretty()
```

Should see your consent request with status "PENDING"!

---

## 📋 Complete Test Sequence

```bash
# 1. Create consent
RESPONSE=$(curl -s -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }')

echo "Response: $RESPONSE"

# 2. Extract consent_id (if you have jq installed)
# CONSENT_ID=$(echo $RESPONSE | jq -r '.data.consent_id')

# 3. Get consent details
# curl http://localhost:3000/internal/aa/consents/$CONSENT_ID
```

---

## ✅ Success Criteria

- [ ] Consent request created successfully
- [ ] Received redirect_url
- [ ] Consent stored in MongoDB
- [ ] Status is "PENDING"
- [ ] Can retrieve consent by ID
- [ ] Validation works for invalid input

---

**Ready to test? Run Test 1 above!** 🚀

