# 🎯 Consent Generation - Simple Explanation

## What We Just Built

We built a system that creates **consent requests** - asking customers for permission to fetch their financial data from banks.

---

## 🎓 Simple Explanation

### What is Consent?

**Like asking permission:**
- You want to see someone's bank statement
- You ask: "Can I see your bank data?"
- They say: "Yes" or "No"
- If Yes → You can fetch the data

### What We Built:

1. **API Endpoint** - `/internal/aa/consents/initiate`
   - You call this with customer details
   - We create a consent request

2. **Consent Service** - Builds everything needed
   - Formats customer details
   - Calculates dates
   - Calls Saafe API

3. **Returns Redirect URL** - Where customer goes to approve
   - Customer clicks this URL
   - Goes to Saafe's website
   - Approves/rejects consent

---

## 🔄 Complete Flow

```
You (Your System)
  ↓
Calls: POST /internal/aa/consents/initiate
  Body: { mobile: "9876543210", fi_types: ["DEPOSIT"] }
  ↓
Our Service
  ↓
Validates input ✅
Builds payload 📝
Calls Saafe API 📞
  ↓
Saafe Returns:
  - request_id
  - txn_id
  - redirect_url (for customer)
  ↓
Our Service
  ↓
Saves to MongoDB 💾
Returns redirect_url to You ✅
  ↓
You show redirect_url to Customer
Customer clicks URL → Approves
↓
(Webhooks will come next - Phase 4!)
```

---

## 📝 What You Need to Provide

### Minimum Required:
```json
{
  "internal_user_id": "user123",
  "mobile": "9876543210",
  "fi_types": ["DEPOSIT"]
}
```

### Optional (Add More Details):
```json
{
  "internal_user_id": "user123",
  "mobile": "9876543210",
  "email": "user@example.com",
  "dob": "1990-01-01",
  "pan": "ABCDE1234F",
  "fi_types": ["DEPOSIT", "TERM_DEPOSIT"],
  "fi_datarange_unit": "MONTH",
  "fi_datarange_value": 6
}
```

---

## 🧪 Quick Test

### Step 1: Make Sure Server is Running

```bash
npm run dev
```

### Step 2: Test Consent Creation

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

### Step 3: Check Response

You should get:
- ✅ `success: true`
- ✅ `redirect_url` - URL for customer
- ✅ `request_id`, `txn_id` - For tracking

### Step 4: Check Database

```bash
mongosh "your-mongodb-uri"
use saafe_db
db.aa_consent_requests.find().pretty()
```

Should see your consent request! 🎉

---

## 🎯 What Happens Next?

1. ✅ Consent created
2. ✅ You get `redirect_url`
3. ⏭️ Customer clicks URL → Approves
4. ⏭️ Saafe sends webhook (we'll build this next!)
5. ⏭️ Status changes: PENDING → ACTIVE
6. ⏭️ Then you can fetch data!

---

## 📚 Files Created

1. **services/consent/consentService.js** - Main consent logic
2. **routes/consent.js** - API endpoints
3. **utils/validators.js** - Input validation

---

## 📖 Documentation

- **CONSENT_IMPLEMENTATION.md** - Complete technical details
- **TEST_CONSENT.md** - Testing guide

---

**Ready to test? Try the Quick Test above!** 🚀

