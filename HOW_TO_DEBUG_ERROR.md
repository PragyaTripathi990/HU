# 🔍 How to Debug "Max_Data_Life is invalid" Error

## Step 1: Check What Payload is Actually Being Sent

The error says "Max_Data_Life is invalid" but we've removed those fields. Let's verify what's actually being sent.

### Look at Server Logs

In your **server terminal** (where `npm run dev` is running), when you make the request, you should see:

```
📋 Payload being sent: {
  ...
}
```

**Copy that entire JSON and check:**
1. Does it have `data_life_unit` or `data_life_value`? 
   - If YES → Server hasn't restarted with new code
   - If NO → Continue to Step 2

2. What are the `consent_start` and `consent_expiry` dates?
   - Are they in the future? (Shouldn't be)
   - Do they make sense?

3. Does the payload structure match what you expect?

## Step 2: Compare with Documentation Example

The documentation example shows:

```json
{
  "aa_id": ["dashboard-aa"],
  "customer_id": "CUST123",
  "consent_details": [{
    "data_life_unit": "MONTH",
    "data_life_value": 6,
    ...
  }]
}
```

**Questions:**
- Should we include `aa_id`?
- Should we include `data_life` fields from the example?
- Are there other fields we're missing?

## Step 3: Test Payload Locally

I created a test script. Run it:

```bash
node test-consent-payload.js
```

This shows exactly what payload is generated **before** it's sent to Saafe.

## Step 4: Check Server Restart

Make sure server restarted:
1. Did you stop it (Ctrl+C)?
2. Did you start it again (`npm run dev`)?
3. Does it show "Server ready!"?

## Step 5: Share What You See

Tell me:
1. What does the payload in server logs show?
2. Does it have `data_life` fields?
3. What are the date values?

Then I can fix it properly! 🚀

