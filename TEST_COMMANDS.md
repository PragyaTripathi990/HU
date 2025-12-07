# 🚀 Quick Test Commands

## Prerequisites Check

```bash
# 1. Check if server is running
curl http://localhost:3000/health

# 2. Check authentication
curl http://localhost:3000/api/auth/status

# 3. Login if needed
curl -X POST http://localhost:3000/api/auth/login
```

---

## Quick Test: Minimal Request

**Copy and paste this command:**

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_001",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

**Expected:** Success response with `redirect_url`

---

## Quick Test: With Customer Details

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

---

## Check Server Logs

**Look for this in your server console:**

```
📋 Payload being sent: {
  "customer_details": {...},
  "consent_details": [{
    "fetch_type": "PERIODIC",  ← Should be PERIODIC
    ...
  }]
}
```

---

## Verify Database

```bash
# Using MongoDB Compass or mongosh
# Check latest consent
db.aa_consent_requests.find().sort({createdAt: -1}).limit(1).pretty()
```

---

## Run Automated Test

```bash
# Make script executable (first time only)
chmod +x QUICK_TEST.sh

# Run the test script
./QUICK_TEST.sh
```

---

## Common Issues

### Server not running?
```bash
npm run dev
```

### Authentication failed?
```bash
# Check your .env file has correct credentials
# Then login:
curl -X POST http://localhost:3000/api/auth/login
```

### Still getting errors?
1. Check server logs for the exact payload
2. Compare with Saafe API documentation
3. See `TEST_CONSENT_NEW.md` for detailed troubleshooting

---

## Full Testing Guide

For comprehensive testing instructions, see:
- **TEST_CONSENT_NEW.md** - Complete step-by-step guide
- **CONSENT_REWRITE_SUMMARY.md** - What was changed

