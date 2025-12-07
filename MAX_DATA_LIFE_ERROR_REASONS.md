# 🔍 All Possible Reasons for "Max_Data_Life is invalid" Error

## ❌ The Error
```
"Consent are not as per fair use policy – Max_Data_Life is invalid"
```

## 🎯 Key Understanding
**Saafe calculates Max_Data_Life INTERNALLY** based on your payload. You don't send `data_life` fields, but Saafe calculates them and validates against their fair use policy.

---

## 📋 Possible Reasons (In Order of Likelihood)

### 1. **Consent Duration Too Long** ⚠️ MOST LIKELY
**Issue:** Your consent duration exceeds what's allowed for your account/AA.

**Current:** `consent_expiry: "2026-06-05"` (6 months from start)
**Try:** Reduce to 3 months or 1 month

**Test:**
```json
{
  "consent_start_date": "2025-12-05",
  "consent_expiry_date": "2026-03-05",  // 3 months instead of 6
  ...
}
```

---

### 2. **Account-Level Restrictions** 🔒
**Issue:** Your Saafe account might have specific fair use policy limits.

**Possible limits:**
- Maximum consent duration: 3 months (not 6)
- Maximum data range: 1 month (not 3)
- Specific AA ID restrictions

**Solution:** Contact Saafe support to get your account's specific limits.

---

### 3. **AA ID Specific Requirements** 🆔
**Issue:** The AA ID `dashboard-aa-preprod` might have different rules.

**Possible issues:**
- This AA ID might only allow shorter consents
- This AA ID might require specific data_life values
- This AA ID might be in a restricted mode

**Test:** Try without `aa_id` to see if Saafe uses a default AA with different rules:
```json
{
  // Remove "aa_id": ["dashboard-aa-preprod"]
  ...
}
```

---

### 4. **Data Range Too Long** 📅
**Issue:** The data range duration might violate fair use policy.

**Current:** `fi_datarange_from: "2025-09-05"` to `fi_datarange_to: "2025-12-05"` (3 months)
**Try:** Reduce to 1 month:
```json
{
  "fi_datarange_from": "2025-11-05",
  "fi_datarange_to": "2025-12-05",
  "fi_datarange_value": 1
}
```

---

### 5. **Relationship Between Consent Duration and Data Range** 🔗
**Issue:** Saafe might require: `data_range_duration ≤ consent_duration / 2`

**Example:**
- Consent: 6 months
- Data range: 3 months ✅ (3 ≤ 6/2 = 3)
- But maybe rule is: `data_range ≤ consent_duration / 3` = 2 months ❌

**Test:** Try data range = 1 month with 3-month consent:
```json
{
  "consent_start_date": "2025-12-05",
  "consent_expiry_date": "2026-03-05",  // 3 months
  "fi_datarange_from": "2025-11-05",
  "fi_datarange_to": "2025-12-05",     // 1 month
  "fi_datarange_value": 1
}
```

---

### 6. **PERIODIC vs ONETIME Restrictions** 🔄
**Issue:** PERIODIC consents might have stricter rules than ONETIME.

**Test:** Try ONETIME:
```json
{
  "fetch_type": "ONETIME",
  // Remove frequency_unit and frequency_value
}
```

---

### 7. **UAT Environment Restrictions** 🧪
**Issue:** The UAT/sandbox environment might have stricter limits than production.

**Possible:**
- UAT only allows 1-3 month consents
- UAT has different fair use policy rules
- Your UAT account needs approval for longer consents

**Solution:** Check with Saafe if UAT has different rules.

---

### 8. **Missing or Incorrect Purpose Code** 📝
**Issue:** Purpose code `102` might have specific restrictions.

**Test:** Try a different purpose code (if allowed):
```json
{
  "purpose_code": "101"  // or check what codes are valid
}
```

---

### 9. **Date Validation Issues** 📆
**Issue:** Dates might be in the wrong format or violate date rules.

**Check:**
- ✅ Dates are in `YYYY-MM-DD` format
- ✅ `consent_start` is today or past (not future)
- ✅ `fi_datarange_to` is today or past (not future)
- ✅ `consent_expiry` is after `consent_start`
- ✅ `fi_datarange_from` is before `fi_datarange_to`

---

### 10. **Account Not Fully Activated** ⚠️
**Issue:** Your Saafe account might not be fully activated/approved.

**Possible:**
- Account is in trial mode with restrictions
- Account needs approval for certain consent types
- Account has pending verification

**Solution:** Contact Saafe to verify account status.

---

### 11. **FI Types Restrictions** 💰
**Issue:** Certain FI types might have different rules.

**Current:** `fi_types: ["DEPOSIT"]`
**Test:** Try with multiple types or different types:
```json
{
  "fi_types": ["DEPOSIT", "TERM_DEPOSIT"]
}
```

---

### 12. **Frequency Settings** ⏰
**Issue:** Frequency settings for PERIODIC might violate rules.

**Current:** `frequency_unit: "MONTH"`, `frequency_value: 1`
**Test:** Try different frequency:
```json
{
  "frequency_unit": "DAY",
  "frequency_value": 30
}
```

---

## 🧪 Systematic Testing Approach

### Test 1: Minimal Payload (ONETIME, 1 month)
```json
{
  "internal_user_id": "test-1",
  "mobile": "9876543210",
  "aa_id": ["dashboard-aa-preprod"],
  "fi_types": ["DEPOSIT"],
  "consent_start_date": "2025-12-05",
  "consent_expiry_date": "2026-01-05",  // 1 month
  "fi_datarange_from": "2025-11-05",
  "fi_datarange_to": "2025-12-05",     // 1 month
  "fi_datarange_value": 1,
  "fetch_type": "ONETIME"
}
```

### Test 2: Without AA ID
```json
{
  "internal_user_id": "test-2",
  "mobile": "9876543210",
  // NO aa_id
  "fi_types": ["DEPOSIT"],
  "consent_start_date": "2025-12-05",
  "consent_expiry_date": "2026-03-05",  // 3 months
  "fi_datarange_from": "2025-11-05",
  "fi_datarange_to": "2025-12-05",
  "fi_datarange_value": 1,
  "fetch_type": "PERIODIC",
  "frequency_unit": "MONTH",
  "frequency_value": 1
}
```

### Test 3: Different Purpose Code
```json
{
  "internal_user_id": "test-3",
  "mobile": "9876543210",
  "aa_id": ["dashboard-aa-preprod"],
  "fi_types": ["DEPOSIT"],
  "purpose_code": "101",  // Different code
  "consent_start_date": "2025-12-05",
  "consent_expiry_date": "2026-03-05",
  "fi_datarange_from": "2025-11-05",
  "fi_datarange_to": "2025-12-05",
  "fetch_type": "ONETIME"
}
```

---

## 📞 Next Steps

1. **Try Test 1** (minimal ONETIME, 1 month) - Most likely to work
2. **Check server logs** - See exact payload being sent
3. **Contact Saafe Support** with:
   - Your account details
   - The error message
   - Request: "What are the exact fair use policy limits for my account?"
   - Request: "What Max_Data_Life values are allowed?"
   - Request: "Are there restrictions for AA ID: dashboard-aa-preprod?"

---

## 💡 Most Likely Solution

Based on patterns, **most likely issue is:**
- **Consent duration too long** (try 1-3 months instead of 6)
- **Account-level restrictions** (contact Saafe)

Start with **Test 1** (1 month, ONETIME) - if that works, gradually increase duration.


