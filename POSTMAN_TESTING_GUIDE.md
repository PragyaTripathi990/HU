# 🧪 Postman Testing Guide for Saafe TSP APIs

## ❌ Problem: Getting 401 Unauthorized

The 401 error means **authentication failed**. Even though login works, you need to add the Bearer token to **every API call** after login.

---

## ✅ Solution: Add Bearer Token to Authorization Header

### Step-by-Step Instructions

#### Step 1: Login and Get Token

**Request:**
```
POST https://uat.tsp.api.saafe.tech/api/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "vikas.bansal@handauncle.com",
  "password": "YRo9fG3%1^ki"
}
```

**Response:** Copy the `access_token` from the response:
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    ...
  }
}
```

#### Step 2: Use Token for Consent API

**Request:**
```
POST https://uat.tsp.api.saafe.tech/api/generate/consent
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** 
- Replace `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with your actual `access_token`
- Include the word `Bearer` before the token (with a space)

**Body (JSON):**
```json
{
  "customer_details": {
    "mobile_number": "9876543210"
  },
  "consent_details": [
    {
      "consent_start": "2025-12-04",
      "consent_expiry": "2026-12-04",
      "consent_mode": "STORE",
      "consent_types": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
      "fetch_type": "PERIODIC",
      "fi_types": ["DEPOSIT"],
      "purpose_code": "102",
      "fi_datarange_unit": "MONTH",
      "fi_datarange_value": 6,
      "fi_datarange_from": "2025-06-04",
      "fi_datarange_to": "2025-12-04",
      "frequency_unit": "MONTH",
      "frequency_value": 1
    }
  ],
  "txn_callback_url": "https://fiu.example.com/webhook/consent-status",
  "consent_callback_url": "https://fiu.example.com/consent/return"
}
```

**⚠️ Note:** Removed `data_life_unit` and `data_life_value` from your payload - these cause "Max_Data_Life is invalid" errors!

---

## 🔧 Setting Up Postman Authorization

### Option 1: Manual Header (Simple)

1. Go to **Headers** tab
2. Add new header:
   - **Key:** `Authorization`
   - **Value:** `Bearer YOUR_ACCESS_TOKEN_HERE`
   - Replace `YOUR_ACCESS_TOKEN_HERE` with actual token

### Option 2: Use Postman Authorization Tab (Better)

1. Click on **Authorization** tab (in Postman)
2. Select **Type:** `Bearer Token`
3. Paste your `access_token` in the **Token** field
4. Postman will automatically add: `Authorization: Bearer <token>`

### Option 3: Environment Variables (Best for Testing)

1. Create a Postman Environment:
   - Click **Environments** → **+**
   - Name: `Saafe TSP Sandbox`

2. Add variables:
   - `base_url`: `https://uat.tsp.api.saafe.tech`
   - `access_token`: (leave empty, will be set by login)

3. Set up Login Request:
   - URL: `{{base_url}}/api/login`
   - Add a **Test** script (after login):
     ```javascript
     if (pm.response.code === 200) {
         var jsonData = pm.response.json();
         pm.environment.set("access_token", jsonData.data.access_token);
         console.log("✅ Token saved to environment");
     }
     ```

4. Set up Consent Request:
   - URL: `{{base_url}}/api/generate/consent`
   - Authorization tab: Select `Bearer Token`
   - Token: `{{access_token}}`

This way, login automatically saves the token, and consent request uses it automatically!

---

## 📋 Complete Postman Collection Setup

### Request 1: Login

```
POST {{base_url}}/api/login
Headers: Content-Type: application/json
Body:
{
  "email": "vikas.bansal@handauncle.com",
  "password": "YRo9fG3%1^ki"
}
```

**Test Script (after login):**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.access_token) {
        pm.environment.set("access_token", jsonData.data.access_token);
        pm.environment.set("refresh_token", jsonData.data.refresh_token);
        console.log("✅ Tokens saved to environment");
    }
}
```

### Request 2: Generate Consent

```
POST {{base_url}}/api/generate/consent
Authorization: Bearer Token → {{access_token}}
Headers: Content-Type: application/json
Body:
{
  "customer_details": {
    "mobile_number": "9876543210"
  },
  "consent_details": [
    {
      "consent_start": "2025-12-04",
      "consent_expiry": "2026-12-04",
      "consent_mode": "STORE",
      "consent_types": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
      "fetch_type": "PERIODIC",
      "fi_types": ["DEPOSIT"],
      "purpose_code": "102",
      "fi_datarange_unit": "MONTH",
      "fi_datarange_value": 6,
      "fi_datarange_from": "2025-06-04",
      "fi_datarange_to": "2025-12-04",
      "frequency_unit": "MONTH",
      "frequency_value": 1
    }
  ],
  "txn_callback_url": "https://webhook.site/your-unique-url",
  "consent_callback_url": "https://webhook.site/your-unique-url"
}
```

---

## 🚨 Common Issues

### Issue 1: 401 Unauthorized
**Cause:** Missing or incorrect Authorization header
**Fix:** Add `Authorization: Bearer <token>` header

### Issue 2: 403 Forbidden  
**Cause:** Token expired (tokens last 24 hours)
**Fix:** Login again to get a new token

### Issue 3: "Max_Data_Life is invalid"
**Cause:** Payload includes `data_life_unit` and `data_life_value`
**Fix:** Remove these fields from `consent_details`

### Issue 4: Token expires quickly
**Cause:** Token valid for 24 hours only
**Fix:** Use refresh token endpoint: `POST /api/refresh` with `refresh_token`

---

## 🔄 Token Refresh Flow

When token expires, use refresh endpoint:

**Request:**
```
POST {{base_url}}/api/refresh
Headers: Content-Type: application/json
Body:
{
  "refresh_token": "{{refresh_token}}"
}
```

**Response:**
```json
{
  "data": {
    "access_token": "new_token_here",
    "token_type": "bearer"
  }
}
```

Update your environment variable with the new `access_token`.

---

## ✅ Quick Checklist

- [ ] Login request works (200 OK)
- [ ] Copied `access_token` from login response
- [ ] Added `Authorization: Bearer <token>` header to consent request
- [ ] Removed `data_life_unit` and `data_life_value` from payload
- [ ] Consent request now works (200 OK, not 401)

---

**Need Help?** Check the error message:
- **401 Unauthorized** → Missing/invalid Authorization header
- **403 Forbidden** → Token expired, login again
- **400 Bad Request** → Check payload structure, remove data_life fields


