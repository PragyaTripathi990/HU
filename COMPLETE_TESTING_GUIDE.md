# 🎯 COMPLETE Testing Guide - Follow These Steps EXACTLY

I found that `package.json` was missing. I've created it for you. Now follow these steps **in order**:

---

## ✅ STEP-BY-STEP INSTRUCTIONS

### STEP 1: Open Terminal

**Mac:**
- Press `Cmd + Space`
- Type "Terminal"
- Press Enter

**Windows:**
- Press `Windows + R`
- Type `cmd`
- Press Enter

---

### STEP 2: Go to Your Project Folder

In the terminal, type:

```bash
cd /Users/pragyatripathi/HandaUncle/saafe
```

Press Enter.

**Check:** You should see the folder path in your terminal prompt.

---

### STEP 3: Install Dependencies (FIRST TIME ONLY)

Type this command:

```bash
npm install
```

**Wait for it to finish!** This might take 1-2 minutes. You'll see a lot of text scrolling by - that's normal.

**What you'll see:**
- A lot of package names being downloaded
- At the end: "added X packages"

**If you see errors:**
- Make sure you have internet connection
- Make sure Node.js is installed (check with: `node --version`)

---

### STEP 4: Check Your .env File

Type this to see if `.env` exists:

```bash
ls -la .env
```

**If file exists:**
✅ Good! Continue to next step.

**If file doesn't exist:**
1. Copy the template:
   ```bash
   cp env.template .env
   ```
2. Open `.env` file in a text editor
3. Fill in your values:
   ```
   MONGODB_URI=your-mongodb-connection-string-here
   SAAFE_API_BASE_URL=https://uat.tsp.api.saafe.tech
   SAAFE_LOGIN_EMAIL=your-email@example.com
   SAAFE_LOGIN_PASSWORD=your-password-here
   PORT=3000
   NODE_ENV=development
   ```
4. Save and close the file

---

### STEP 5: Start the Server

Type this command:

```bash
npm run dev
```

**What you should see:**
```
🚀 Server is running!
   📍 Port: 3000
   🌍 Environment: development
   🔗 Health check: http://localhost:3000/health

✅ Server ready!
```

**OR if you see:**
```
✅ MongoDB Connected: ...
🚀 Server is running!
...
✅ Server ready!
```

**IMPORTANT:** 
- ✅ Keep this terminal window OPEN!
- ✅ Don't close it!
- ✅ The server needs to keep running

**If you see errors:**

**Error: "Cannot find module 'express'"**
→ Run `npm install` again (from STEP 3)

**Error: "Cannot connect to MongoDB"**
→ Check your `MONGODB_URI` in `.env` file

**Error: "Port 3000 already in use"**
→ Something else is using port 3000
→ Type `Ctrl+C` to stop
→ Change `PORT=3001` in `.env` file
→ Try again

**Error: "EADDRINUSE"**
→ Same as above - port is in use

---

### STEP 6: Open a NEW Terminal Window

1. Open a **NEW terminal window** (keep the server running!)
2. Navigate to project folder again:
   ```bash
   cd /Users/pragyatripathi/HandaUncle/saafe
   ```

---

### STEP 7: Test Health Check

In the NEW terminal, type:

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
- Make sure server terminal shows "Server ready!"

**If you see nothing:**
- Server might still be starting → Wait 5 seconds and try again

---

### STEP 8: Test Authentication

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
- Type this to login:
  ```bash
  curl -X POST http://localhost:3000/api/auth/login
  ```
- Wait a few seconds
- Try status check again

---

### STEP 9: TEST CONSENT GENERATION (THE MAIN TEST!)

Copy and paste this ENTIRE command:

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_001",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }'
```

Press Enter.

**What you should see:**

**✅ SUCCESS (Good!):**
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

**❌ ERROR (Not good):**
```json
{
  "success": false,
  "error": "error message here"
}
```

**If you see an error:**
- Write down the error message
- Continue to STEP 10 to check logs
- Tell me the error message and I'll help fix it

---

### STEP 10: Check Server Logs

Look at your **FIRST terminal window** (where server is running).

**You should see:**

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
      "consent_mode": "STORE",
      "consent_types": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
      "fetch_type": "PERIODIC",
      "fi_types": ["DEPOSIT"],
      ...
    }
  ],
  ...
}
✅ Consent generated successfully!
   Request ID: 1234
   Transaction ID: d2bb28e7-...
💾 Consent request stored in database
```

**What to check:**

1. ✅ Look for `"fetch_type": "PERIODIC"` in the payload
   - ✅ Good: It says "PERIODIC"
   - ❌ Bad: It says "ONETIME" or is missing

2. ✅ Look for `frequency_unit` and `frequency_value` in the payload
   - ✅ Good: They are present
   - ❌ Bad: They are missing

3. ✅ Look for success message
   - ✅ Good: "Consent generated successfully!"
   - ❌ Bad: Error messages

4. ✅ Check for any error messages
   - ✅ Good: No errors
   - ❌ Bad: Red error text

---

## 🎉 SUCCESS!

If everything worked:
- ✅ Server is running
- ✅ Test returned success
- ✅ Server logs show correct payload
- ✅ `fetch_type` is "PERIODIC"

**You're done! The code is working correctly!** 🚀

---

## 🐛 TROUBLESHOOTING

### Problem: "Cannot find module"

**Fix:**
1. Make sure you ran `npm install` (STEP 3)
2. Check `node_modules` folder exists:
   ```bash
   ls node_modules
   ```
3. If it's empty or missing, run `npm install` again

---

### Problem: "Cannot connect to MongoDB"

**Fix:**
1. Open your `.env` file
2. Check `MONGODB_URI` line:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   ```
3. Replace with your actual MongoDB connection string
4. Save the file
5. Restart server (Ctrl+C, then `npm run dev` again)

---

### Problem: "401 Unauthorized" or "403 Forbidden"

**Fix:**
1. Check your `.env` file has correct Saafe credentials:
   ```
   SAAFE_LOGIN_EMAIL=your-email@example.com
   SAAFE_LOGIN_PASSWORD=your-password
   ```
2. Make sure email and password are correct
3. Restart server after changing `.env`

---

### Problem: "Fetch_Type is invalid" Error

**Fix:**
1. Check server logs for the payload
2. If `fetch_type` is not "PERIODIC", there's a bug
3. Tell me and I'll fix it!

---

### Problem: Server keeps crashing

**Fix:**
1. Check what error message you see in server terminal
2. Common causes:
   - Missing `.env` file → Create it
   - Wrong MongoDB URI → Fix in `.env`
   - Wrong Saafe credentials → Fix in `.env`
   - Missing dependencies → Run `npm install`

---

## 📋 QUICK CHECKLIST

Use this to track your progress:

- [ ] ✅ Terminal opened
- [ ] ✅ Went to project folder
- [ ] ✅ Ran `npm install` (wait for it to finish!)
- [ ] ✅ `.env` file exists and has correct values
- [ ] ✅ Server started (`npm run dev`)
- [ ] ✅ Server shows "Server ready!"
- [ ] ✅ Health check works (`curl /health`)
- [ ] ✅ Auth status works (`curl /api/auth/status`)
- [ ] ✅ Consent test works (`curl /internal/aa/consents/initiate`)
- [ ] ✅ Server logs show correct payload
- [ ] ✅ Payload has `fetch_type: "PERIODIC"`
- [ ] ✅ No errors in logs

---

## 📝 EXACT COMMANDS TO COPY-PASTE

**Terminal 1 (Server):**
```bash
cd /Users/pragyatripathi/HandaUncle/saafe
npm install
npm run dev
```

**Terminal 2 (Testing):**
```bash
cd /Users/pragyatripathi/HandaUncle/saafe

# Test 1: Health
curl http://localhost:3000/health

# Test 2: Auth
curl http://localhost:3000/api/auth/status

# Test 3: Consent
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{"internal_user_id":"test123","mobile":"9876543210","fi_types":["DEPOSIT"]}'
```

---

## 🆘 STILL STUCK?

Tell me:
1. **Which step are you on?** (1, 2, 3, etc.)
2. **What command did you run?**
3. **What error message did you see?** (Copy the exact error)

I'll help you fix it! 🚀

---

**Follow these steps EXACTLY in order, and you'll be able to test!** ✅

