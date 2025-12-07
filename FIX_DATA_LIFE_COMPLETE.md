# ✅ Complete Fix: "Max_Data_Life is invalid" Error

## Problem

You're getting:
```
"Consent are not as per fair use policy – Max_Data_Life is invalid"
```

This happens because `data_life_unit` and `data_life_value` fields violate Saafe's Fair Use Policy.

## Fix Applied

I've made **3 changes** to ensure these fields are NEVER sent:

1. ✅ **Removed default values** - No defaults for data_life fields
2. ✅ **Commented out conditional inclusion** - Fields won't be added even if provided
3. ✅ **Added explicit removal** - Fields are stripped from payload even if they get through

## Important: Restart Server!

The server needs to restart to pick up the changes:

1. **Stop the server** (Press `Ctrl+C` in the server terminal)
2. **Restart it**:
   ```bash
   npm run dev
   ```

## Test Again

After restarting, try this request:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test123",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

**Important:** 
- ✅ Don't include `data_life_unit` or `data_life_value`
- ✅ Don't include `frequency_unit` or `frequency_value` unless needed

## Check Server Logs

After making the request, check your **server terminal**. You should see:

```
📋 Payload being sent: {
  "customer_details": {...},
  "consent_details": [{
    ...
    // NO data_life_unit or data_life_value here!
  }]
}
```

**Verify:** Look for `data_life` fields - they should NOT be there!

## If Error Persists

If you still get the error after restarting:

1. **Check the payload in server logs** - Do you see `data_life` fields?
2. **Tell me what you see** - I'll help fix it
3. **Try the minimal request** - Just mobile + fi_types

## Why This Happens

Saafe has strict Fair Use Policy rules. The `data_life` fields:
- Must match specific valid combinations
- Have maximum limits
- Depend on other consent parameters

The safest approach: **Let Saafe use default values** (don't send these fields).

---

**After restarting the server, try again!** 🚀

