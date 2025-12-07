# 🔍 "Account Aggregator not found or down" - Complete Explanation

## Summary

Based on the Saafe TSP API documentation, here are **all possible reasons** for the "Account Aggregator not found or down" error:

---

## 📋 7 Main Reasons (From Documentation)

### 1. **Invalid AA Vendor Code** ❌
**Error:** `"Account Aggregator not found"`

**What it means:**
- The `aa_id` or `aa_vendor` code you provided doesn't exist in Saafe's system
- Example: You sent `"aa_id": ["invalid-aa-code"]`
- The AA vendor code is case-sensitive and must match exactly

**From docs:** Template Consent API returns this error when AA vendor code is invalid.

**Fix:**
- Use correct AA vendor code (e.g., `"dashboard-aa"`, `"finvu-aa"`)
- Check available AAs using `/api/institutions` endpoint
- Verify spelling and case sensitivity

---

### 2. **FIU Not Mapped to AA** ❌
**Error:** `"FIU AA mapping not found"`

**What it means:**
- Your FIU account exists
- But it's NOT configured/mapped to use the Account Aggregator you specified
- Saafe hasn't set up the FIU-AA relationship

**From docs:** Template Consent API - Step 2 in business logic flow requires "AA Mapping: Retrieves the associated Account Aggregator details for the FIU"

**Fix:**
- Contact Saafe support
- Request FIU-AA mapping configuration
- They need to map your FIU to the correct AA

---

### 3. **AA Service Actually Down** ⚠️
**Error:** `"Key generation failed: Connection timeout"` or similar

**What it means:**
- The Account Aggregator's servers are unreachable
- Network connectivity issues
- AA service is experiencing downtime

**From docs:** FI Data Request API - Step 6 "Key Generation" can fail with connection timeout if AA is down.

**Fix:**
- Wait and retry later
- Check Saafe status page
- Contact Saafe support if persistent

---

### 4. **Wrong AA Vendor Code Format** ❌
**Error:** `"Account Aggregator not found"`

**What it means:**
- AA vendor code has wrong format
- Missing required format (e.g., should be array: `["dashboard-aa"]`)
- Case sensitivity issues

**From docs:** Consent generation example shows: `"aa_id": ["dashboard-aa"]` (array format)

**Fix:**
- Use array format: `["dashboard-aa"]` not `"dashboard-aa"`
- Check exact spelling and case
- Use valid vendor codes from Sahamati registry

---

### 5. **FIU Details Not Configured** ❌
**Error:** `"FIU details not found"`

**What it means:**
- Your FIU account details are missing in Saafe's system
- FIU configuration incomplete
- Missing private keys, certificates, or client secrets

**From docs:** Template Consent API error response - Step 3 "FIU Details Retrieval" can fail.

**Fix:**
- Contact Saafe to complete FIU setup
- Ensure all FIU credentials are configured

---

### 6. **Network/Connectivity Issues** ⚠️
**Error:** Timeout or connection errors

**What it means:**
- Cannot reach AA servers
- DNS resolution failures
- Firewall blocking connections
- Internet connectivity problems

**From docs:** FI Data Request - Key generation step can timeout due to network issues.

**Fix:**
- Check network connectivity
- Verify DNS resolution
- Check firewall rules
- Test with institutions API

---

### 7. **AA Certificate/Validation Failures** ❌
**Error:** `"Invalid Response from AA: invalid certificate"`

**What it means:**
- AA certificate validation failed
- Certificate expired or invalid
- SSL/TLS handshake issues

**From docs:** FI Data Request - Step 9 "Response Validation" includes certificate validation.

**Fix:**
- Usually handled by Saafe (AA certificate issues)
- Contact Saafe support if this error occurs

---

## 🎯 Where These Errors Occur

### During Consent Generation (`/api/generate/consent`)
- Invalid `aa_id` field
- FIU not mapped to AA
- AA service down

### During Template Consent (`/api/generate/template-consent`)
- **"Account Aggregator not found"** - AA vendor code invalid
- **"FIU AA mapping not found"** - FIU not mapped to AA
- **"FIU details not found"** - FIU configuration missing

### During FI Data Request (`/api/data/request`)
- **"Key generation failed: Connection timeout"** - AA service down
- **"Invalid Response from AA"** - AA communication failures
- **"Invalid certificate"** - Certificate validation errors

---

## ✅ Our Current Implementation Status

**Good News! ✅**

According to API documentation v1.1.0:
> "made the aa_id optional in consent api"

**Our code already handles this correctly:**
- `aa_id` is **NOT included** by default
- Only added if explicitly provided in input
- This allows Saafe to use FIU's default AA mapping

**This should prevent "AA not found" errors!**

---

## 🔧 How to Prevent This Error

### Option 1: Don't Send `aa_id` (Recommended)
Let Saafe use your FIU's default AA mapping:

```json
{
  "customer_details": { ... },
  "consent_details": [ ... ]
  // NO aa_id field
}
```

### Option 2: Use Correct AA Vendor Code
If you must specify AA:

```json
{
  "aa_id": ["dashboard-aa"],  // ✅ Correct format
  "customer_details": { ... },
  "consent_details": [ ... ]
}
```

**Verify AA exists:**
```bash
GET /api/institutions?aa_vendor=dashboard-aa
```

### Option 3: Contact Saafe Support
If you keep getting this error:
1. Verify your FIU-AA mapping is configured
2. Confirm which AA vendor codes you can use
3. Request mapping setup if missing

---

## 📊 Error Response Examples from Docs

### Template Consent API Errors:

1. **Account Aggregator not found:**
```json
{
  "status": "error",
  "success": false,
  "message": "Account Aggregator not found"
}
```

2. **FIU AA mapping not found:**
```json
{
  "status": "error",
  "success": false,
  "message": "FIU AA mapping not found"
}
```

3. **FIU details not found:**
```json
{
  "status": "error",
  "success": false,
  "message": "FIU details not found"
}
```

### FI Data Request API Errors:

1. **Key generation failed (AA down):**
```json
{
  "status": "error",
  "message": "Key generation failed: Connection timeout"
}
```

2. **Invalid certificate:**
```json
{
  "status": "error",
  "message": "Invalid Response from AA: invalid certificate"
}
```

---

## 🚨 Most Common Scenario

**Most likely reason:** Your FIU is not mapped to an Account Aggregator in Saafe's system.

**Solution:**
1. Contact Saafe support
2. Ask them to:
   - Verify your FIU account
   - Set up FIU-AA mapping
   - Confirm which AA vendor codes you can use

**Temporary workaround:**
- Don't send `aa_id` field (let Saafe use default)
- Our code already does this! ✅

---

## 📝 Quick Checklist

If you get this error, check:

- [ ] Is `aa_id` in your payload? (Remove it if possible)
- [ ] Is AA vendor code correct? (Case-sensitive)
- [ ] Is FIU mapped to AA? (Contact Saafe)
- [ ] Is AA service up? (Check connectivity)
- [ ] Are network/firewall rules correct?

---

**Current Status:** Our code is already optimized to avoid this error by making `aa_id` optional! ✅

