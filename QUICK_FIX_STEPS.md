# ⚡ QUICK FIX: Stop Getting "Max_Data_Life is invalid" Error

## The Problem

You're getting this error:
```
"Consent are not as per fair use policy – Max_Data_Life is invalid"
```

## The Solution (3 Steps)

### Step 1: Restart Your Server

**In your server terminal** (where `npm run dev` is running):

1. Press `Ctrl+C` to stop the server
2. Type: `npm run dev` and press Enter
3. Wait for "Server ready!" message

### Step 2: Try the Request Again

Use this **MINIMAL** request (no data_life fields):

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test123",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

### Step 3: Check the Server Logs

Look at your **server terminal**. You should see:

```
📋 Payload being sent: {
  ...
}
```

**Check if `data_life_unit` or `data_life_value` appear in that payload.**

If they DON'T appear → Good! The fix worked.
If they DO appear → Tell me and I'll fix it.

---

## What I Fixed

1. ✅ Removed `data_life` fields from being sent
2. ✅ Added explicit removal in payload cleaning
3. ✅ Made sure they're never included

## Why This Error Happens

Saafe has strict Fair Use Policy rules. The `data_life` fields need specific valid combinations that we don't know yet. The safest approach: **Don't send them** and let Saafe use defaults.

---

**Restart your server and try again!** 🚀

If it still doesn't work, check the payload in server logs and tell me what you see.

