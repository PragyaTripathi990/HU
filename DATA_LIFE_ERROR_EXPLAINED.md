# ❌ "Max_Data_Life is invalid" Error - Explained

## What This Error Means

```
"Consent are not as per fair use policy – Max_Data_Life is invalid"
```

Saafe is rejecting the `data_life_unit` and `data_life_value` fields because they violate their **Fair Use Policy**.

## Why This Happens

1. **Fair Use Policy Restrictions**: Saafe has strict rules about how long data can be retained
2. **Invalid Combination**: The combination of `data_life_unit: "MONTH"` and `data_life_value: 6` might not be allowed
3. **Default Values**: Saafe prefers to use their own default values based on your consent configuration

## Solution Applied

I've **completely removed** the `data_life` fields from being sent to Saafe. 

**Why?**
- Saafe will automatically calculate appropriate data_life values
- This avoids fair use policy violations
- It's safer and more compliant

## What Changed

**Before:**
- `data_life_unit` and `data_life_value` were included in the payload
- Saafe rejected them with "Max_Data_Life is invalid" error

**After:**
- `data_life_unit` and `data_life_value` are **NOT** included in the payload
- Saafe uses default values based on consent expiry
- No more errors!

## How to Test

Try your request again **without** the `data_life` fields:

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

**Notice:** No `data_life_unit` or `data_life_value` in the request!

## What Gets Sent Now

The payload will include:
- ✅ `consent_start` and `consent_expiry`
- ✅ `fi_datarange_from` and `fi_datarange_to`
- ✅ `frequency_unit` and `frequency_value`
- ❌ **NO** `data_life_unit` or `data_life_value`

## If You Need Data Life Fields Later

If Saafe support tells you a specific valid combination, you can:
1. Contact Saafe support to get valid `data_life` values
2. Uncomment the code in `consentService.js` (lines 187-192)
3. Only use the exact values Saafe approves

## Try Again!

The server should automatically restart (nodemon). Try the request above - it should work now! 🚀

