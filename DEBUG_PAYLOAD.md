# 🔍 Debug: Check What Payload is Being Sent

The error suggests `data_life` fields might still be in the payload. Let's check what's actually being sent.

## Step 1: Check Server Logs

Look at your **server terminal** (where `npm run dev` is running). 

When you make the request, you should see:
```
📋 Payload being sent: {
  ...
}
```

**Check if `data_life_unit` or `data_life_value` appear in that payload!**

## Step 2: If Fields Are Still There

If you see `data_life` fields in the logs, the server might not have restarted. Try:

1. **Stop the server** (Ctrl+C)
2. **Restart it**: `npm run dev`
3. **Try the request again**

## Step 3: Verify Payload Structure

The payload should look like this (NO data_life fields):

```json
{
  "customer_details": {
    "mobile_number": "9876543210"
  },
  "consent_details": [
    {
      "consent_start": "2024-12-04",
      "consent_expiry": "2025-12-04",
      "consent_mode": "STORE",
      "consent_types": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
      "fetch_type": "PERIODIC",
      "fi_types": ["DEPOSIT"],
      "purpose_code": "102",
      "fi_datarange_unit": "MONTH",
      "fi_datarange_value": 6,
      "fi_datarange_from": "...",
      "fi_datarange_to": "...",
      "frequency_unit": "MONTH",
      "frequency_value": 1
      // NO data_life_unit or data_life_value here!
    }
  ]
}
```

## Next Steps

1. Check server logs for the actual payload
2. Tell me what you see - especially if `data_life` fields appear
3. I'll fix it based on what's actually being sent

