# ✅ Fix Applied: "Max_Data_Life is invalid" Error

## Problem

You got this error:
```
"Consent are not as per fair use policy – Max_Data_Life is invalid"
```

## Cause

Saafe has **strict fair use policy restrictions** on `data_life_unit` and `data_life_value`. The combination of these fields might:
- Exceed maximum allowed duration
- Not match consent expiry period requirements
- Be invalid for certain FI types or purpose codes

## Fix Applied

I've made `data_life_unit` and `data_life_value` **optional fields** that are only included if explicitly provided in the request. By default, they won't be sent to Saafe.

**What changed:**
- `data_life_unit` and `data_life_value` are no longer included by default
- They are only added to the payload if you explicitly provide them in your request
- This avoids fair use policy violations

## How to Test Now

### Test 1: Minimal Request (Recommended)

This should work now without data_life fields:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test123",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

### Test 2: With Frequency (But NO data_life)

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test123",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"],
    "frequency_unit": "MONTH",
    "frequency_value": 1
  }'
```

## What Fields Are Still Included

The payload will still include:
- ✅ `consent_start` and `consent_expiry`
- ✅ `fi_datarange_from` and `fi_datarange_to`
- ✅ `frequency_unit` and `frequency_value` (for PERIODIC fetch_type)
- ❌ `data_life_unit` and `data_life_value` (only if you explicitly provide them)

## Why This Works

According to Saafe's fair use policy:
- Data life restrictions are complex and depend on many factors
- It's safer to let Saafe use default values
- Or only include them when you know the exact valid combination

## Try Again!

Run your test command again without the `data_life_unit` and `data_life_value` fields. It should work now! 🚀

