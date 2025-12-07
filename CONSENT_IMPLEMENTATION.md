# ✅ Consent Generation - What We Just Built

## 🎯 Overview

We just implemented **Phase 3: Consent Generation** - the system that creates consent requests for customers to share their financial data via Account Aggregator.

---

## 📁 Files Created

### 1. **services/consent/consentService.js** - Consent Service
**What it does:**
- Builds consent request payloads for Saafe API
- Calculates dates (consent start/expiry, data ranges)
- Calls Saafe API to generate consent
- Stores consent data in MongoDB

**Key Functions:**
- `generateConsent(input)` - Main function to create consent
- `buildConsentDetails(input)` - Builds consent details array
- `buildCustomerDetails(input)` - Builds customer details object
- `calculateConsentStart()` - Calculates consent start date
- `calculateConsentExpiry()` - Calculates consent expiry (1 year)
- `calculateDataRangeFrom()` - Calculates data range start date

### 2. **routes/consent.js** - API Routes
**Endpoints:**
- `POST /internal/aa/consents/initiate` - Create consent request
- `GET /internal/aa/consents/:id` - Get consent by ID (with history)
- `GET /internal/aa/consents` - List all consents
- `GET /internal/aa/consents/by-txn/:txn_id` - Get consent by transaction ID

### 3. **utils/validators.js** - Input Validation
**Validates:**
- Mobile number (10 digits, Indian format)
- Email format
- Date format (YYYY-MM-DD)
- PAN number format
- FI types array
- Consent date order

---

## 🔄 How It Works

### Simple Flow:

```
1. Your system calls: POST /internal/aa/consents/initiate
   {
     "internal_user_id": "user123",
     "mobile": "9876543210",
     "email": "user@example.com",
     "fi_types": ["DEPOSIT"]
   }
   ↓
2. Our service validates input
   ↓
3. Our service builds Saafe payload:
   - Customer details
   - Consent details (dates, FI types, etc.)
   - Callback URLs
   ↓
4. Calls Saafe API: POST /api/generate/consent
   ↓
5. Saafe returns:
   - request_id
   - txn_id
   - consent_handle
   - redirect_url (for customer approval)
   ↓
6. Stores everything in MongoDB
   ↓
7. Returns redirect_url to your system
```

### Detailed Explanation:

#### Step 1: Request Comes In
```javascript
POST /internal/aa/consents/initiate
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

#### Step 2: Validation
- Checks mobile number format
- Validates email (if provided)
- Validates dates
- Validates FI types

#### Step 3: Build Saafe Payload
```javascript
{
  customer_details: {
    mobile_number: "9876543210",
    email: "user@example.com",
    date_of_birth: "1990-01-01",
    pan_number: "ABCDE1234F"
  },
  consent_details: [{
    consent_start: "2025-01-01",
    consent_expiry: "2026-01-01",
    fi_types: ["DEPOSIT"],
    fi_datarange_unit: "MONTH",
    fi_datarange_value: 6,
    fi_datarange_from: "2024-07-01",
    // ... more fields
  }],
  txn_callback_url: "http://localhost:3000/webhooks/aa/txn",
  consent_callback_url: "http://localhost:3000/webhooks/aa/consent"
}
```

#### Step 4: Call Saafe API
- Uses httpClient (automatically adds Bearer token)
- POST /api/generate/consent
- Gets response with consent details

#### Step 5: Store in Database
- Creates record in `aa_consent_requests` collection
- Stores all fields: request_id, txn_id, consent_handle, etc.
- Status = "PENDING"

#### Step 6: Return Response
```json
{
  "success": true,
  "data": {
    "request_id": 1194,
    "txn_id": "d2bb28e7-...",
    "consent_handle": "1130468f-...",
    "redirect_url": "https://sandbox.redirection.saafe.in/..."
  }
}
```

---

## 🧪 How to Test

### Prerequisites:
1. ✅ Authentication working (Phase 2 complete)
2. ✅ MongoDB connected
3. ✅ Server running

### Test 1: Create Consent Request

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_123",
    "mobile": "9876543210",
    "email": "test@example.com",
    "dob": "1990-01-01",
    "pan": "ABCDE1234F",
    "fi_types": ["DEPOSIT"],
    "fi_datarange_unit": "MONTH",
    "fi_datarange_value": 6
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Consent request initiated successfully",
  "data": {
    "consent_id": "...",
    "request_id": 1194,
    "txn_id": "d2bb28e7-...",
    "consent_handle": "1130468f-...",
    "redirect_url": "https://sandbox.redirection.saafe.in/...",
    "status": "PENDING"
  }
}
```

### Test 2: Get Consent by ID

```bash
# Use consent_id from Test 1
curl http://localhost:3000/internal/aa/consents/YOUR_CONSENT_ID
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "consent": {
      "id": "...",
      "request_id": 1194,
      "txn_id": "d2bb28e7-...",
      "status": "PENDING",
      "redirect_url": "...",
      ...
    },
    "status_history": [],
    "latest_webhook": null
  }
}
```

### Test 3: List All Consents

```bash
curl http://localhost:3000/internal/aa/consents
```

### Test 4: Minimal Request (Only Required Fields)

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "user123",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

---

## 📊 Database Changes

### After Consent Generation:

**Collection: `aa_consent_requests`**

New document created with:
```javascript
{
  _id: ObjectId("..."),
  internal_user_id: "test_user_123",
  request_id: 1194,
  txn_id: "d2bb28e7-...",
  consent_handle: "1130468f-...",
  consent_id: null, // Will be set when ACTIVE
  vua: "9876543210@dashboard-aa",
  status: "PENDING",
  redirect_url: "https://sandbox.redirection.saafe.in/...",
  customer_details: { ... },
  consent_details: [ ... ],
  raw_request: { ... },
  raw_response: { ... },
  createdAt: ISODate("2025-01-XX..."),
  updatedAt: ISODate("2025-01-XX...")
}
```

---

## 🎓 Key Concepts Explained

### 1. **Consent Request**
**What:** A request for customer to approve sharing their financial data  
**Status:** Starts as PENDING → becomes ACTIVE when customer approves

### 2. **Redirect URL**
**What:** URL where customer goes to approve consent  
**Use:** Your system redirects customer to this URL  
**Customer:** Logs in, reviews, approves/rejects

### 3. **Request ID & Transaction ID**
- **request_id**: Saafe's internal ID for this consent request
- **txn_id**: Transaction ID for tracking
- **consent_handle**: Handle for this consent journey
- **consent_id**: Actual consent ID (set when ACTIVE)

### 4. **FI Types**
**What:** Types of financial information to fetch  
**Examples:** DEPOSIT, TERM_DEPOSIT, MUTUAL_FUNDS, etc.  
**Required:** At least one FI type must be specified

### 5. **Data Range**
**What:** How far back to fetch data  
**Example:** Last 6 months of transactions  
**Format:** Unit (MONTH/YEAR) + Value (6) = 6 months

### 6. **Callback URLs**
**What:** URLs Saafe will call when status changes  
**Types:**
- `txn_callback_url` - For transaction status updates
- `consent_callback_url` - For consent status updates

---

## 📝 Request Format

### Required Fields:
- `internal_user_id` - Your system's user ID
- `mobile` - Customer mobile number (10 digits)
- `fi_types` - Array of FI types (e.g., `["DEPOSIT"]`)

### Optional Fields:
- `email` - Customer email
- `dob` - Date of birth (YYYY-MM-DD)
- `pan` - PAN number
- `customer_id` - Your customer ID
- `fip_id` - Array of FIP IDs (specific banks)
- `consent_start_date` - Consent start (default: today)
- `consent_expiry_date` - Consent expiry (default: 1 year)
- `fi_datarange_unit` - MONTH/YEAR/DAY (default: MONTH)
- `fi_datarange_value` - Number (default: 6)
- `purpose_code` - Purpose code (default: "102")

### Example Full Request:

```json
{
  "internal_user_id": "user123",
  "mobile": "9876543210",
  "email": "user@example.com",
  "dob": "1990-01-01",
  "pan": "ABCDE1234F",
  "customer_id": "CUST123",
  "fi_types": ["DEPOSIT", "TERM_DEPOSIT"],
  "fip_id": ["FIP001", "FIP002"],
  "consent_start_date": "2025-01-01",
  "consent_expiry_date": "2026-01-01",
  "fi_datarange_unit": "MONTH",
  "fi_datarange_value": 6,
  "purpose_code": "102"
}
```

---

## 🎯 What Happens Next?

After consent is generated:

1. **Your System** gets `redirect_url`
2. **Customer** clicks/goes to redirect_url
3. **Customer** logs into Saafe's portal
4. **Customer** reviews and approves consent
5. **Saafe** sends webhook (we'll build this in Phase 4)
6. **Consent Status** changes: PENDING → ACTIVE
7. **Then** you can request financial data (Phase 6)

---

## 🔍 Understanding the Response

### Success Response:
```json
{
  "success": true,
  "message": "Consent request initiated successfully",
  "data": {
    "consent_id": "507f1f77bcf86cd799439011",
    "request_id": 1194,
    "txn_id": "d2bb28e7-a45c-4b1a-abd6-b0eb806e01e8",
    "consent_handle": "1130468f-45ee-4f06-af5f-0059bd7cbfdf",
    "vua": "9876543210@dashboard-aa",
    "redirect_url": "https://sandbox.redirection.saafe.in/...",
    "status": "PENDING"
  }
}
```

**What to do with this:**
- Store `consent_id` in your system
- Redirect customer to `redirect_url`
- Wait for webhook notification (Phase 4)

---

## ⚠️ Common Errors

### Error 1: Validation Failed
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": ["Mobile number is required"]
}
```
**Fix:** Check all required fields are provided

### Error 2: Invalid Mobile Number
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": ["Invalid mobile number. Must be 10 digits starting with 6-9"]
}
```
**Fix:** Use valid Indian mobile number format

### Error 3: Invalid FI Type
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": ["Invalid FI types: INVALID_TYPE"]
}
```
**Fix:** Use valid FI types from the list

### Error 4: Saafe API Error
```json
{
  "success": false,
  "error": "Request failed with status code 400",
  "details": {
    "status": "error",
    "message": "Invalid purpose code: 10"
  }
}
```
**Fix:** Check error message, correct the issue, try again

---

## 📚 Next Steps

1. ✅ **Consent Generation** - Done!
2. ⏭️ **Phase 4: Webhook Handlers** - Receive status updates
3. ⏭️ **Phase 5: Status Polling** - Backup to webhooks
4. ⏭️ **Phase 6: FI Data Request** - Request financial data

---

## 🧪 Testing Checklist

- [ ] Server is running
- [ ] Authentication works (token available)
- [ ] MongoDB connected
- [ ] Test consent generation with minimal data
- [ ] Test consent generation with full data
- [ ] Verify consent stored in database
- [ ] Test validation errors
- [ ] Test getting consent by ID
- [ ] Test listing consents

---

**🎉 Consent Generation is Complete!**

**Next:** Build webhook handlers (Phase 4) to receive status updates!

