# 🎯 SUPER SIMPLE Testing Guide

I'll help you test step-by-step. Follow these instructions exactly.

---

## 🚀 Quick Start (3 Steps)

### STEP 1: Open Terminal and Go to Project Folder

**On Mac:**
1. Press `Cmd + Space` to open Spotlight
2. Type "Terminal" and press Enter
3. Type this command:
   ```bash
   cd /Users/pragyatripathi/HandaUncle/saafe
   ```
4. Press Enter

**On Windows:**
1. Press `Windows + R`
2. Type `cmd` and press Enter
3. Type this command (change path if needed):
   ```bash
   cd C:\Users\pragyatripathi\HandaUncle\saafe
   ```
4. Press Enter

---

### STEP 2: Start the Server

In the same terminal, type:

```bash
npm run dev
```

**OR if that doesn't work:**

```bash
node server.js
```

**What you should see:**
```
🚀 Server is running!
   📍 Port: 3000
   🔗 Health check: http://localhost:3000/health

✅ Server ready!
```

**IMPORTANT:** Leave this terminal window open! The server needs to keep running.

**If you see errors:**
- "Cannot find module" → Type: `npm install` and wait, then try again
- "Port 3000 already in use" → Type `Ctrl+C` to stop, then change PORT in `.env` file to 3001
- MongoDB error → Check your `.env` file has correct `MONGODB_URI`

---

### STEP 3: Test in a NEW Terminal Window

1. Open a **NEW terminal window** (keep the server running!)
2. Type this command:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{"internal_user_id":"test123","mobile":"9876543210","fi_types":["DEPOSIT"]}'
```

**What you should see:**

✅ **SUCCESS:**
```json
{
  "success": true,
  "message": "Consent generated successfully",
  "data": {
    "request_id": 1234,
    "txn_id": "...",
    "redirect_url": "https://..."
  }
}
```

❌ **ERROR:**
```json
{
  "success": false,
  "error": "error message here"
}
```

---

## 📋 Check Server Logs

Look at the terminal where the server is running. You should see:

```
🚀 Starting consent generation...
📋 Payload being sent: {
  "customer_details": {...},
  "consent_details": [{
    "fetch_type": "PERIODIC",
    ...
  }]
}
✅ Consent generated successfully!
```

**Check that `fetch_type` is "PERIODIC"** (not ONETIME)

---

## 🐛 Common Problems & Fixes

### Problem 1: "Cannot find module"

**Fix:**
```bash
npm install
```
Wait 1-2 minutes, then try starting server again.

---

### Problem 2: "Cannot connect to MongoDB"

**Fix:**
1. Check your `.env` file exists
2. Make sure it has this line:
   ```
   MONGODB_URI=mongodb+srv://your-connection-string
   ```
3. Replace `your-connection-string` with your actual MongoDB connection string

---

### Problem 3: Server won't start

**Fix:**
1. Check if port 3000 is in use:
   - On Mac/Linux: `lsof -i :3000`
   - On Windows: `netstat -ano | findstr :3000`
2. If something is using it, stop it OR change PORT in `.env` to 3001

---

### Problem 4: "401 Unauthorized" or "403 Forbidden"

**Fix:**
1. Your Saafe credentials might be wrong
2. Check `.env` file:
   ```
   SAAFE_LOGIN_EMAIL=your-email@example.com
   SAAFE_LOGIN_PASSWORD=your-password
   ```
3. Make sure email and password are correct

---

## ✅ Success Checklist

When everything works:

- [ ] ✅ Server starts and shows "Server ready!"
- [ ] ✅ Test command returns `"success": true`
- [ ] ✅ Server logs show payload with `fetch_type: "PERIODIC"`
- [ ] ✅ No error messages in server logs

---

## 📝 Exact Commands to Copy-Paste

**Terminal 1 (Server):**
```bash
cd /Users/pragyatripathi/HandaUncle/saafe
npm run dev
```

**Terminal 2 (Testing):**
```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{"internal_user_id":"test123","mobile":"9876543210","fi_types":["DEPOSIT"]}'
```

---

## 🆘 Still Having Issues?

Tell me:
1. Which step are you stuck at?
2. What error message do you see?
3. What does your server terminal show?

I'll help you fix it! 🚀

