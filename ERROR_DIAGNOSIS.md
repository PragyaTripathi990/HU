# 🔍 Error Diagnosis: "Max_Data_Life is invalid"

## What I Verified

I tested the payload generation and confirmed:
- ✅ `data_life_unit` and `data_life_value` are **NOT** in the payload
- ✅ Payload structure matches documentation (except data_life)
- ✅ All required fields are present

## Why the Error Might Still Happen

The error persists, which suggests:

1. **Server hasn't restarted** - Old code still running
   - **Fix**: Stop server (Ctrl+C) and restart (`npm run dev`)

2. **Saafe validates internally** - They might calculate/validate data_life based on consent_expiry
   - **Fix**: Need to adjust consent period or other parameters

3. **Date validation issue** - Consent dates might violate fair use policy
   - **Fix**: Adjust consent_start and consent_expiry dates

## Current Payload (What We're Sending)

```json
{
  "customer_details": {
    "mobile_number": "9876543210"
  },
  "consent_details": [{
    "consent_start": "2025-12-04",
    "consent_expiry": "2026-12-04",  // 1 year from start
    "consent_mode": "STORE",
    "consent_types": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
    "fetch_type": "PERIODIC",
    "fi_types": ["DEPOSIT"],
    "purpose_code": "102",
    "fi_datarange_unit": "MONTH",
    "fi_datarange_value": 6,
    "fi_datarange_from": "2025-06-04",
    "fi_datarange_to": "2025-12-04",
    "frequency_unit": "MONTH",
    "frequency_value": 1
    // NO data_life fields ✅
  }],
  "txn_callback_url": "...",
  "consent_callback_url": "..."
}
```

## What to Do Next

### Step 1: Restart Server (IMPORTANT!)

```bash
# Stop server
Ctrl+C

# Wait 2 seconds, then restart
npm run dev
```

### Step 2: Check Server Logs

When you make the request, the server will log:
```
📋 Payload being sent: { ... }
```

**Verify:**
- No `data_life` fields in the JSON
- Dates look correct

### Step 3: Try the Request

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test123",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

### Step 4: If Error Persists

Share with me:
1. The **exact payload** from server logs
2. The **exact error message** from the response
3. Whether server was restarted

Then I can fix it! 🚀

