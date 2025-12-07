# 🧪 Step-by-Step Testing Guide (VERY DETAILED)

I'll walk you through testing the consent generation code **step by step** with screenshots-level detail.

---

## 📋 BEFORE YOU START - Checklist

Before testing, make sure you have:

- [ ] ✅ Node.js installed (check with: `node --version`)
- [ ] ✅ MongoDB connection string in `.env` file
- [ ] ✅ Saafe API credentials (email/password) in `.env` file
- [ ] ✅ All dependencies installed (`node_modules` folder exists)
- [ ] ✅ Terminal/Command Prompt ready

---

## STEP 1: Open Terminal

### On Mac/Linux:
1. Open **Terminal** application
2. Navigate to your project folder:
   ```bash
   cd /Users/pragyatripathi/HandaUncle/saafe
   ```

### On Windows:
1. Open **Command Prompt** or **PowerShell**
2. Navigate to your project folder:
   ```bash
   cd C:\path\to\saafe
   ```
   (Replace with your actual path)

**Check:** You should see `saafe` in your terminal prompt.

---

## STEP 2: Check if Dependencies are Installed

Type this command:

```bash
ls node_modules
```

**What you should see:**
- A long list of folders (express, mongoose, axios, etc.)

**If you see "No such file or directory":**
You need to install dependencies. Type:
```bash
npm install
```
Wait for it to finish (it might take 1-2 minutes).

---

## STEP 3: Check Your .env File

Type this command to see if `.env` file exists:

```bash
ls -la .env
```

**If the file exists:**
✅ Good! Continue to next step.

**If the file doesn't exist:**
1. Copy the template:
   ```bash
   cp env.template .env
   ```
2. Open `.env` file in a text editor
3. Fill in your credentials:
   ```
   MONGODB_URI=your-mongodb-connection-string
   SAAFE_API_BASE_URL=https://uat.tsp.api.saafe.tech
   SAAFE_LOGIN_EMAIL=your-email@example.com
   SAAFE_LOGIN_PASSWORD=your-password
   PORT=3000
   NODE_ENV=development
   ```
4. Save the file

---

## STEP 4: Check if MongoDB is Accessible

Type this command to test MongoDB connection:

```bash
node -e "require('dotenv').config(); console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Missing')"
```

**What you should see:**
- `MongoDB URI: Found` ✅

**If you see "Missing":**
- Your `.env` file is not being read
- Check that `.env` file exists and has `MONGODB_URI=...`

---

## STEP 5: Start the Server

**Open a NEW terminal window** (keep the first one open too - you'll need both).

In the NEW terminal window:

1. Navigate to project folder again:
   ```bash
   cd /Users/pragyatripathi/HandaUncle/saafe
   ```

2. Start the server:
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
   🌍 Environment: development
   🔗 Health check: http://localhost:3000/health

✅ Server ready!
```

**If you see errors:**
- **Error: Cannot find module 'express'** → Run `npm install`
- **Error: Cannot connect to MongoDB** → Check your `MONGODB_URI` in `.env`
- **Error: Port 3000 already in use** → Change `PORT=3001` in `.env` or stop other server

**IMPORTANT:** Keep this terminal window open! The server needs to keep running.

---

## STEP 6: Test Health Check (First Terminal)

Go back to your **FIRST terminal window** (the one where server is NOT running).

Type this command:

```bash
curl http://localhost:3000/health
```

**What you should see:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-04T...",
  "service": "Saafe TSP Integration Service"
}
```

**If you see "Connection refused":**
- Server is not running → Go back to STEP 5
- Check that server terminal shows "Server ready!"

**If you see nothing:**
- Server might still be starting → Wait 5 seconds and try again

---

## STEP 7: Check Authentication Status

Type this command:

```bash
curl http://localhost:3000/api/auth/status
```

**What you should see:**
```json
{
  "authenticated": true,
  "token_valid": true,
  ...
}
```

**If you see `"authenticated": false`:**
- You need to login first. Type:
  ```bash
  curl -X POST http://localhost:3000/api/auth/login
  ```
- Wait a few seconds, then check status again

---

## STEP 8: Test Consent Generation (MINIMAL)

Now for the actual test! Type this command:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_001",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

**What you should see:**

**✅ SUCCESS Response:**
```json
{
  "success": true,
  "message": "Consent generated successfully",
  "data": {
    "consent_id": "...",
    "request_id": 1234,
    "txn_id": "d2bb28e7-...",
    "consent_handle": "1130468f-...",
    "vua": "9898989898@dashboard-aa",
    "redirect_url": "https://sandbox.redirection.saafe.in/...",
    "status": "PENDING"
  }
}
```

**❌ ERROR Response:**
```json
{
  "success": false,
  "error": "error message here"
}
```

---

## STEP 9: Check Server Logs

Look at your **SECOND terminal window** (where server is running).

**You should see logs like:**

```
🚀 Starting consent generation...
📤 Calling Saafe API: POST /api/generate/consent
📋 Payload being sent: {
  "customer_details": {
    "mobile_number": "9876543210"
  },
  "consent_details": [
    {
      "consent_start": "2024-12-04",
      "consent_expiry": "2025-12-04",
      "fetch_type": "PERIODIC",
      ...
    }
  ]
}
✅ Consent generated successfully!
   Request ID: 1234
   Transaction ID: d2bb28e7-...
💾 Consent request stored in database
```

**What to check in logs:**
1. ✅ `fetch_type` is "PERIODIC" (not ONETIME)
2. ✅ Payload structure looks correct
3. ✅ Success message appears
4. ✅ No error messages

---

## STEP 10: Test with More Fields

Try a more complete request:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_002",
    "mobile": "9876543210",
    "email": "test@example.com",
    "dob": "1990-01-01",
    "pan": "ABCDE1234F",
    "fi_types": ["DEPOSIT"]
  }'
```

This should also work and include email, DOB, and PAN in the payload.

---

## STEP 11: Test Error Handling

Test that errors are handled properly:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user"
  }'
```

**Expected:** Error message saying "mobile is required"

---

## STEP 12: Verify Database Storage

If you have MongoDB Compass or mongosh installed:

1. Connect to your MongoDB database
2. Find the database (usually `saafe_db`)
3. Look for collection: `aa_consent_requests`
4. You should see the consent request you just created

**Using mongosh (command line):**
```bash
mongosh "your-mongodb-uri"
use saafe_db
db.aa_consent_requests.find().sort({createdAt: -1}).limit(1).pretty()
```

---

## 🐛 TROUBLESHOOTING

### Problem: "Cannot find module"

**Solution:**
```bash
npm install
```

---

### Problem: "Cannot connect to MongoDB"

**Solution:**
1. Check your `.env` file has correct `MONGODB_URI`
2. Test MongoDB connection:
   ```bash
   mongosh "your-mongodb-uri"
   ```
3. If that works, MongoDB is fine - check your connection string in `.env`

---

### Problem: "Port 3000 already in use"

**Solution:**
1. Find what's using port 3000:
   ```bash
   lsof -i :3000
   ```
2. Kill that process, OR
3. Change port in `.env`:
   ```
   PORT=3001
   ```
4. Restart server

---

### Problem: "401 Unauthorized" or "403 Forbidden"

**Solution:**
1. Your Saafe credentials might be wrong
2. Check `.env` file:
   ```
   SAAFE_LOGIN_EMAIL=correct-email@example.com
   SAAFE_LOGIN_PASSWORD=correct-password
   ```
3. Login manually:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login
   ```

---

### Problem: "Fetch_Type is invalid" Error

**Solution:**
1. Check server logs - look at the payload being sent
2. Verify `fetch_type` is "PERIODIC" in the logs
3. If it's "ONETIME" or missing, there's a bug in the code
4. Let me know and I'll fix it!

---

### Problem: Server keeps crashing

**Solution:**
1. Check server logs for error messages
2. Common causes:
   - Missing `.env` file
   - Wrong MongoDB URI
   - Wrong Saafe credentials
   - Missing dependencies

---

## 📝 TESTING CHECKLIST

Use this checklist to track your progress:

- [ ] ✅ Terminal opened and navigated to project folder
- [ ] ✅ Dependencies installed (`node_modules` exists)
- [ ] ✅ `.env` file exists and has correct values
- [ ] ✅ MongoDB connection works
- [ ] ✅ Server starts without errors
- [ ] ✅ Health check works (`/health` endpoint)
- [ ] ✅ Authentication works (`/api/auth/status`)
- [ ] ✅ Minimal consent request works
- [ ] ✅ Server logs show correct payload structure
- [ ] ✅ Payload has `fetch_type: "PERIODIC"`
- [ ] ✅ Consent stored in database
- [ ] ✅ Error handling works (missing fields return errors)

---

## 🎯 WHAT SUCCESS LOOKS LIKE

When everything works correctly:

1. ✅ Server starts and stays running
2. ✅ Health check returns `{"status": "ok"}`
3. ✅ Consent request returns success with `redirect_url`
4. ✅ Server logs show clean payload with `fetch_type: "PERIODIC"`
5. ✅ No errors in server logs
6. ✅ Consent stored in MongoDB

---

## 🆘 NEED HELP?

If you get stuck at any step:

1. **Check the error message** - It usually tells you what's wrong
2. **Check server logs** - They show what's happening
3. **Verify your `.env` file** - Most issues are configuration problems
4. **Try each step one at a time** - Don't skip steps

---

## 📸 Quick Reference Commands

```bash
# 1. Start server
npm run dev

# 2. Test health (in another terminal)
curl http://localhost:3000/health

# 3. Test auth
curl http://localhost:3000/api/auth/status

# 4. Test consent (minimal)
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{"internal_user_id":"test","mobile":"9876543210","fi_types":["DEPOSIT"]}'
```

---

**Follow these steps one by one, and you'll be able to test successfully!** 🚀

If you get stuck at any step, tell me which step and what error you see, and I'll help you fix it!

