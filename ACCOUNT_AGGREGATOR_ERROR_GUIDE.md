# 🔍 Account Aggregator Error Guide

## Error: "Account Aggregator not found or down"

This error occurs when Saafe TSP cannot find or communicate with the specified Account Aggregator (AA).

---

## 📋 Possible Reasons

### 1. **Account Aggregator Not Found**

The AA vendor code you're using doesn't exist in Saafe's system.

**Where it happens:**
- During consent generation (`/api/generate/consent`)
- During template consent generation (`/api/generate/template-consent`)
- During FI data request (`/api/data/request`)

**Common causes:**
- ❌ Invalid `aa_id` or `aa_vendor` code
- ❌ AA vendor code not registered with Saafe
- ❌ Typo in AA vendor code (e.g., `dashboard-aa` vs `dashboard-AA`)
- ❌ FIU not mapped to the specified AA

**Example error from template consent API:**
```json
{
  "status": "error",
  "success": false,
  "message": "Account Aggregator not found"
}
```

---

### 2. **FIU AA Mapping Not Found**

Your FIU account is not mapped/configured to use the specified Account Aggregator.

**Error message:**
```json
{
  "status": "error",
  "success": false,
  "message": "FIU AA mapping not found"
}
```

**This means:**
- Your FIU account exists
- But it's not configured to use the AA you specified
- Or the mapping hasn't been set up in Saafe's system

---

### 3. **Account Aggregator Service Down**

The AA service is temporarily unavailable or experiencing issues.

**Signs:**
- Connection timeouts
- 500/503 errors from AA
- "Connection timeout" errors during AA communication

**From FI data request API:**
```
"Key generation failed: Connection timeout"
```

---

### 4. **Invalid AA Vendor Code in Request**

You're sending an incorrect or unsupported AA vendor code.

**Where `aa_id` is used:**
- In consent generation: `"aa_id": ["dashboard-aa"]`
- In template consent: Implied from FIU configuration
- In institutions API: `aa_vendor` parameter

**Valid AA vendor codes** (examples):
- `dashboard-aa`
- `finvu-aa`
- Other AA codes registered with Sahamati

---

### 5. **Network/Connectivity Issues**

Cannot reach the AA's servers.

**Indicators:**
- Timeout errors
- DNS resolution failures
- Network unreachable errors

---

## 🔍 Where This Error Can Occur

### 1. **During Consent Generation**

When calling `/api/generate/consent`:
- If `aa_id` field contains invalid AA vendor code
- If FIU is not mapped to the specified AA
- If AA service is down during consent creation

### 2. **During Template Consent**

When calling `/api/generate/template-consent`:
- FIU AA mapping not found (common)
- Account Aggregator not found in system
- Template requires AA that's not configured

### 3. **During FI Data Request**

When calling `/api/data/request`:
- AA communication fails during data fetch
- AA service is down
- Cannot reach AA servers

**Error examples:**
```json
{
  "status": "error",
  "message": "Key generation failed: Connection timeout"
}
```

---

## ✅ How to Fix

### Fix 1: Verify AA Vendor Code

**Check the AA vendor code:**
```bash
# Use the institutions API to find available AAs
GET /api/institutions?aa_vendor=dashboard-aa

# Or
POST /api/institutions
{
  "aa_vendor": "dashboard-aa",
  "fi_type": "deposit"
}
```

**Verify your code matches exactly:**
- ✅ Correct: `"dashboard-aa"`
- ❌ Wrong: `"Dashboard-AA"` (case sensitive)
- ❌ Wrong: `"dashboard-aa "` (extra spaces)

---

### Fix 2: Check FIU Configuration

**Ensure your FIU is mapped to an AA:**
- Contact Saafe support to verify FIU-AA mapping
- Confirm which AA vendor codes your FIU can use
- Ask them to set up the mapping if missing

---

### Fix 3: Use Correct AA ID in Consent

**In consent generation payload:**
```json
{
  "aa_id": ["dashboard-aa"],  // ✅ Use valid AA vendor code
  "customer_details": { ... },
  "consent_details": [ ... ]
}
```

**Note:** According to documentation v1.1.0, `aa_id` is **optional**. If not provided, Saafe will use the default AA mapped to your FIU.

**Our current implementation:**
```javascript
// In consentService.js
aa_id: input.aa_id || ["dashboard-aa"],  // Default fallback
```

**Recommendation:** Remove `aa_id` or make it truly optional if your FIU has a default AA.

---

### Fix 4: Handle AA Down Gracefully

**Implement retry logic:**
- Retry on timeout/connection errors
- Use exponential backoff
- Log errors for monitoring

**Error categories:**
- `INFRA_NETWORK` → Retry (AA down, network issues)
- `INPUT_VALIDATION` → Don't retry (invalid AA code)
- `CONSENT_ISSUES` → Don't retry (mapping issues)

---

### Fix 5: Check AA Service Status

**Verify AA is operational:**
1. Check Saafe status page (if available)
2. Try institutions API to see if AA responds
3. Contact Saafe support if AA appears down

---

## 🔧 Implementation Fixes

### Fix 1: Make `aa_id` Optional

According to docs v1.1.0: `aa_id` is optional. Let's update our code:

```javascript
// In buildSaafePayload() - make aa_id truly optional
const payload = {
  customer_details: customerDetails,
  consent_details: consentDetails
};

// Only add aa_id if explicitly provided
if (input.aa_id && Array.isArray(input.aa_id) && input.aa_id.length > 0) {
  payload.aa_id = input.aa_id;
}
```

### Fix 2: Better Error Handling

Add specific error handling for AA-related errors:

```javascript
if (error.response?.data?.message?.includes('Account Aggregator')) {
  // AA not found or mapping issue
  errorCategory = 'AA_CONFIGURATION';
  // Don't retry - this needs manual fix
}
```

---

## 📊 Error Categories

Based on the documentation, AA-related errors fall into:

| Error Type | Category | Retry? | Action |
|-----------|----------|--------|--------|
| Account Aggregator not found | `AA_CONFIGURATION` | ❌ No | Fix AA vendor code or mapping |
| FIU AA mapping not found | `AA_CONFIGURATION` | ❌ No | Contact Saafe to set up mapping |
| Connection timeout | `INFRA_NETWORK` | ✅ Yes | Retry with backoff |
| Key generation failed | `INFRA_NETWORK` | ✅ Yes | Retry (AA might be down) |

---

## 🚨 Common Scenarios

### Scenario 1: Using Wrong AA Vendor Code

**Problem:**
```json
{
  "aa_id": ["invalid-aa-code"]
}
```

**Solution:**
- Check available AAs using institutions API
- Use correct vendor code from Saafe
- Or remove `aa_id` to use default

---

### Scenario 2: FIU Not Mapped

**Problem:**
```
"FIU AA mapping not found"
```

**Solution:**
- Contact Saafe support
- Request FIU-AA mapping setup
- Verify your FIU account configuration

---

### Scenario 3: AA Service Down

**Problem:**
```
"Key generation failed: Connection timeout"
```

**Solution:**
- Implement retry logic
- Wait and retry later
- Contact Saafe if persistent

---

## 📝 Testing Checklist

When you get this error:

- [ ] Check if `aa_id` is correct (case-sensitive)
- [ ] Verify AA vendor code exists (use institutions API)
- [ ] Confirm FIU is mapped to AA (contact Saafe)
- [ ] Try removing `aa_id` to use default
- [ ] Check network connectivity
- [ ] Verify AA service status
- [ ] Review error message details

---

## 🔗 Related API Errors

This error is related to:
1. **Template Consent API** - "Account Aggregator not found"
2. **FI Data Request** - Connection/timeout errors during AA communication
3. **Consent Generation** - AA validation failures

---

## 📞 Support

If the error persists:
1. Check Saafe API documentation
2. Contact Saafe support with:
   - Your FIU ID
   - AA vendor code you're using
   - Error message and timestamp
   - Request payload (remove sensitive data)

---

**Last Updated:** 2025-12-04

