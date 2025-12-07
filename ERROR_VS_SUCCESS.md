# 📊 Error vs Success Response Comparison

## ❌ ERROR Response (What You're Getting Now)

```json
{
  "data": [],
  "metadata": [],
  "status": "error",
  "message": "FI data range to date cannot be greater than consent expiry date",
  "success": false
}
```

**Why This Happens:**
- Wrong date order in payload
- `consent_expiry` is before `fi_datarange_to`

## ✅ SUCCESS Response (What You Should Get)

```json
{
  "status": "success",
  "message": "Consent processed successfully",
  "data": {
    "request_id": [1194],
    "txn_id": ["d2bb28e7-a45c-4b1a-abd6-b0eb806e01e8"],
    "consent_handle": "1130468f-45ee-4f06-af5f-0059bd7cbfdf",
    "vua": "9898989898@dashboard-aa",
    "date": "23062025093908682",
    "url": "https://sandbox.redirection.saafe.in/login?..."
  },
  "metadata": [],
  "success": true
}
```

## 🔍 Key Differences

| Field | Error Response | Success Response |
|-------|---------------|------------------|
| `status` | `"error"` | `"success"` |
| `data` | `[]` (empty array) | `{...}` (object with data) |
| `success` | `false` | `true` |
| `message` | Error description | "Consent processed successfully" |

## ✅ Why Empty Response?

**It's NOT because of dummy data!**

The `data: []` is empty because:
1. ✅ Request was received (HTTP 200 OK)
2. ✅ But validation FAILED (date order wrong)
3. ✅ So no data returned (empty array)

**Once dates are correct:**
- You'll get `"status": "success"`
- You'll get `"data": { request_id, txn_id, url, ... }`
- You'll get `"success": true`

## 📋 Fix Checklist

- [ ] `consent_expiry` = 6 months AFTER today (2026-06-05)
- [ ] `fi_datarange_to` = today (2025-12-05)
- [ ] `fi_datarange_to` ≤ `consent_expiry` ✅
- [ ] Authorization header with Bearer token
- [ ] All dates in correct chronological order

