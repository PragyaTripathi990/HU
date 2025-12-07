# 🚨 Quick Fix: 401 Unauthorized Error

## The Problem
You're getting **401 Unauthorized** when calling `/api/generate/consent` in Postman.

## The Solution (3 Steps)

### Step 1: Login and Get Token ✅ (You already did this!)

Your login works and returns:
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    ...
  }
}
```

### Step 2: Copy the Access Token
Copy this value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your full token)

### Step 3: Add to Consent Request

**In Postman, for the `/api/generate/consent` request:**

#### Option A: Add Header Manually
1. Click on **Headers** tab
2. Add new header:
   - **Key:** `Authorization`
   - **Value:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ⚠️ Replace with your actual token!

#### Option B: Use Authorization Tab (Easier)
1. Click on **Authorization** tab
2. Select **Type:** `Bearer Token`
3. Paste your `access_token` in the **Token** field

## ⚠️ Also Fix Your Payload

**Remove these fields** from `consent_details`:
- ❌ `data_life_unit`
- ❌ `data_life_value`

These cause "Max_Data_Life is invalid" errors!

### Your Current Payload (WRONG):
```json
{
  "consent_details": [{
    ...
    "data_life_unit": "MONTH",    ← REMOVE THIS
    "data_life_value": 6,          ← REMOVE THIS
    ...
  }]
}
```

### Correct Payload (RIGHT):
See `CORRECTED_POSTMAN_PAYLOAD.json` file!

## ✅ After These Fixes

Your request should work:
- ✅ 200 OK response
- ✅ Consent generated successfully
- ✅ No 401 or Max_Data_Life errors

---

**Summary:**
1. Add `Authorization: Bearer <token>` header
2. Remove `data_life_unit` and `data_life_value` from payload
3. Test again!

