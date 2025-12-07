# 🔧 Fix: "Max_Data_Life is invalid" Error

## ❌ The Problem

Even though your payload **doesn't include** `data_life_unit` and `data_life_value`, you're still getting:
```
"Consent are not as per fair use policy – Max_Data_Life is invalid"
```

## 🔍 Root Cause

Saafe calculates "Max_Data_Life" **internally** based on:
1. **Consent Duration** (consent_expiry - consent_start)
2. **Data Range Duration** (fi_datarange_to - fi_datarange_from)
3. **Fair Use Policy Rules**

Your current payload has:
- Consent duration: **1 year** (2025-12-04 to 2026-12-04)
- Data range: **6 months** (2025-06-04 to 2025-12-04)

**A 1-year consent likely violates Saafe's fair use policy!**

## ✅ Solution: Reduce Consent Duration

Saafe's fair use policy typically allows:
- **Maximum consent duration: 6 months** (180 days)
- **Shorter durations are more likely to be accepted**

### Option 1: Use 6-Month Consent (Recommended)

```json
{
  "consent_details": [{
    "consent_start": "2025-12-05",
    "consent_expiry": "2026-06-05",  // 6 months from start
    "fi_datarange_from": "2025-09-05",  // 3 months back
    "fi_datarange_to": "2025-12-05",    // Today
    ...
  }]
}
```

### Option 2: Use 3-Month Consent (Safest)

```json
{
  "consent_details": [{
    "consent_start": "2025-12-05",
    "consent_expiry": "2026-03-05",  // 3 months from start
    "fi_datarange_from": "2025-09-05",  // 3 months back
    "fi_datarange_to": "2025-12-05",    // Today
    ...
  }]
}
```

## 📋 Corrected Payload (6 Months)

```json
{
  "customer_details": {
    "date_of_birth": "1990-01-01",
    "mobile_number": "9876543210",
    "email": "user@email.com",
    "pan_number": "ABCDE1234F"
  },
  "consent_details": [
    {
      "consent_start": "2025-12-05",
      "consent_expiry": "2026-06-05",
      "consent_mode": "STORE",
      "consent_types": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
      "fetch_type": "PERIODIC",
      "fi_types": ["DEPOSIT", "TERM_DEPOSIT"],
      "purpose_code": "102",
      "fi_datarange_unit": "MONTH",
      "fi_datarange_value": 3,
      "fi_datarange_from": "2025-09-05",
      "fi_datarange_to": "2025-12-05",
      "frequency_unit": "MONTH",
      "frequency_value": 1
    }
  ],
  "txn_callback_url": "https://webhook.site/your-unique-url",
  "consent_callback_url": "https://webhook.site/your-unique-url"
}
```

## 🎯 Key Changes

1. ✅ **Consent Duration:** Reduced from 1 year to **6 months**
   - Old: `2025-12-04` to `2026-12-04` (365 days)
   - New: `2025-12-05` to `2026-06-05` (182 days)

2. ✅ **Data Range:** Reduced from 6 months to **3 months**
   - Old: `2025-06-04` to `2025-12-04` (183 days)
   - New: `2025-09-05` to `2025-12-05` (92 days)

3. ✅ **Updated Dates:** Use today's date (2025-12-05)

## ⚠️ Important Notes

1. **Consent Start Date:**
   - Must be **today or in the past**
   - Cannot be in the future

2. **Consent Expiry Date:**
   - Must be **after** consent_start
   - Maximum recommended: **6 months** from start

3. **Data Range:**
   - `fi_datarange_from` must be **before** `fi_datarange_to`
   - Both dates must be within consent period
   - Cannot exceed **2 years**
   - Cannot be in the future

4. **Fair Use Policy:**
   - Saafe has internal rules about maximum consent duration
   - Longer consents are more likely to be rejected
   - Start with shorter durations (3-6 months) for testing

## 🧪 Testing Steps

1. **Update your payload** with the corrected dates
2. **Make sure today's date** matches your consent_start
3. **Test in Postman:**
   - Add `Authorization: Bearer <token>` header
   - Send the corrected payload
   - Should get 200 OK (not Max_Data_Life error)

## 📝 Date Calculation Formula

If you need to calculate dates dynamically:

```javascript
const today = new Date();
const todayStr = today.toISOString().split('T')[0]; // "2025-12-05"

// Consent start: Today
const consentStart = todayStr;

// Consent expiry: 6 months from today
const consentExpiry = new Date(today);
consentExpiry.setMonth(consentExpiry.getMonth() + 6);
const consentExpiryStr = consentExpiry.toISOString().split('T')[0]; // "2026-06-05"

// Data range from: 3 months ago
const dataFrom = new Date(today);
dataFrom.setMonth(dataFrom.getMonth() - 3);
const dataFromStr = dataFrom.toISOString().split('T')[0]; // "2025-09-05"

// Data range to: Today
const dataTo = todayStr;
```

## ✅ Checklist

- [ ] Consent duration ≤ 6 months
- [ ] Consent start date is today or past
- [ ] Data range dates are within consent period
- [ ] No future dates in data range
- [ ] Data range ≤ 2 years
- [ ] Authorization header with Bearer token included
- [ ] No `data_life_unit` or `data_life_value` fields

---

**After these changes, the "Max_Data_Life is invalid" error should be resolved!** ✅


