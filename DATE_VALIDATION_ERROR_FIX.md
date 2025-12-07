# 🔧 Fix: "FI data range to date cannot be greater than consent expiry date"

## ❌ The Problem

You're getting this error:
```
"FI data range to date cannot be greater than consent expiry date"
```

## 🔍 Root Cause

Your payload has an **invalid date order**:

```json
{
  "consent_start": "2025-12-05",     ✅ Today
  "consent_expiry": "2025-06-05",    ❌ WRONG! This is BEFORE start date!
  "fi_datarange_to": "2025-12-05"    ✅ Today
}
```

**The Problem:**
- `consent_expiry` (`2025-06-05`) is **6 months BEFORE** `consent_start` (`2025-12-05`)
- `fi_datarange_to` (`2025-12-05`) is **AFTER** `consent_expiry` (`2025-06-05`)
- This violates the rule: data range end date must be ≤ consent expiry date

## ✅ Solution: Fix the Date Order

**Correct Date Order:**

```
consent_start (today)
    ↓
fi_datarange_from (3 months ago)
    ↓
fi_datarange_to (today)
    ↓
consent_expiry (6 months from today)
```

### Corrected Payload:

```json
{
  "consent_start": "2025-12-05",      // Today
  "consent_expiry": "2026-06-05",     // 6 months AFTER today ✅
  "fi_datarange_from": "2025-09-05",  // 3 months BEFORE today
  "fi_datarange_to": "2025-12-05"     // Today
}
```

## 📋 Date Validation Rules

Saafe validates dates in this order:

1. ✅ `consent_start` < `consent_expiry`
2. ✅ `fi_datarange_from` < `fi_datarange_to`
3. ✅ `fi_datarange_from` ≥ `consent_start`
4. ✅ `fi_datarange_to` ≤ `consent_expiry`
5. ✅ No future dates allowed

## 🎯 Corrected Full Payload

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

## 📅 Date Calculation Logic

If today is `2025-12-05`:

```
Today: 2025-12-05

Consent Start: 2025-12-05 (today)
Consent Expiry: 2026-06-05 (today + 6 months) ✅

Data Range From: 2025-09-05 (today - 3 months)
Data Range To: 2025-12-05 (today)

Validation:
✅ consent_start (2025-12-05) < consent_expiry (2026-06-05)
✅ fi_datarange_from (2025-09-05) < fi_datarange_to (2025-12-05)
✅ fi_datarange_from (2025-09-05) < consent_start (2025-12-05) - allowed
✅ fi_datarange_to (2025-12-05) ≤ consent_expiry (2026-06-05) ✅
```

## ❓ Why 200 OK with Error?

You asked: **"But why is it empty?"**

This is **normal behavior** for Saafe API:
- They return **HTTP 200 OK** (request was received and processed)
- But the **response body** contains an error:
  ```json
  {
    "status": "error",
    "message": "FI data range to date cannot be greater than consent expiry date",
    "data": [],      ← Empty because error occurred
    "success": false
  }
  ```

This is different from HTTP error codes (400, 401, 500) which indicate the request itself failed. Here, the request succeeded, but the business logic validation failed.

## ✅ Checklist

- [ ] `consent_expiry` is **AFTER** `consent_start`
- [ ] `fi_datarange_to` is **BEFORE or EQUAL to** `consent_expiry`
- [ ] `fi_datarange_from` is **BEFORE** `fi_datarange_to`
- [ ] All dates are in YYYY-MM-DD format
- [ ] No future dates (except consent_expiry which can be future)
- [ ] Authorization header with Bearer token included

---

**After fixing the date order, your request should succeed!** ✅


