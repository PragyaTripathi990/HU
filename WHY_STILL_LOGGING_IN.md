# 🔍 Why It's Still Logging In with Wrong Email?

## The Problem

You changed the email in `.env` to a wrong email, but it's still logging in successfully. This is happening because:

---

## 🎯 Main Reason: Server Needs Restart!

### The Issue

**Node.js loads environment variables ONLY when the server starts.**

Here's what happens:

1. ✅ You change `.env` file
2. ❌ Server is still running with OLD variables in memory
3. ✅ Server still uses old email/password from when it started

### The Solution

**You MUST restart the server after changing `.env` file!**

---

## 🔄 How to Fix This

### Step 1: Stop the Server

If your server is running:
- Press `Ctrl + C` in the terminal where server is running
- OR kill the process

### Step 2: Check Your .env File

```bash
cat .env | grep SAAFE_LOGIN_EMAIL
```

Make sure it shows your wrong email (to test).

### Step 3: Restart the Server

```bash
npm run dev
```

### Step 4: Now Test Login Again

```bash
curl -X POST http://localhost:3000/api/auth/login
```

**NOW it should fail** with the wrong email!

---

## 🧪 How to Test This

### Test 1: Verify .env is Actually Changed

```bash
# Check current email in .env
cat .env | grep SAAFE_LOGIN_EMAIL

# Should show your "wrong" email
```

### Test 2: Stop and Restart Server

```bash
# Stop server (Ctrl+C)
# Then restart:
npm run dev
```

### Test 3: Test Login with Wrong Email

```bash
curl -X POST http://localhost:3000/api/auth/login
```

**Expected Result with Wrong Email:**
```json
{
  "success": false,
  "error": "...",
  "details": {
    "status": "error",
    "message": "User with email : wrong-email@example.com does not exist"
  }
}
```

---

## 🔍 Other Possible Reasons

### Reason 2: There's Already a Valid Token

If you previously logged in successfully, there might be a **valid token stored in MongoDB** that's still being used.

**Check:**
```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# Check tokens
use saafe_db
db.aa_tsp_tokens.find().pretty()
```

If you see a token with `is_active: true`, that token might still be valid (not expired yet).

**Solution:** Delete the old token to force a fresh login:

```bash
# In MongoDB shell:
db.aa_tsp_tokens.deleteMany({})
```

Then restart server and try login again.

---

### Reason 3: Using Wrong Endpoint

If you're checking `/api/auth/status` instead of `/api/auth/login`:

- `/api/auth/status` - Just checks if a token EXISTS (doesn't test new login)
- `/api/auth/login` - Actually tries to LOGIN with current credentials

**Test the login endpoint:**
```bash
curl -X POST http://localhost:3000/api/auth/login
```

---

## 🧪 Complete Test Process

Here's how to properly test with wrong credentials:

### Step 1: Change .env to Wrong Email

```env
SAAFE_LOGIN_EMAIL=wrong-email@test.com
SAAFE_LOGIN_PASSWORD=wrong-password
```

### Step 2: Delete Old Tokens (Optional but Recommended)

```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# Delete all tokens
use saafe_db
db.aa_tsp_tokens.deleteMany({})
exit
```

### Step 3: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 4: Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login
```

**Should now fail!** ❌

### Step 5: Verify Server Logs

Check your server terminal - you should see:
```
🔐 Attempting to login to Saafe TSP...
❌ Login failed: ...
```

---

## 🔧 Quick Fix Script

Create a test script to verify:

```bash
#!/bin/bash
# test-login.sh

echo "1. Stopping server..."
# Kill any running node process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "2. Checking .env email..."
cat .env | grep SAAFE_LOGIN_EMAIL

echo "3. Clearing old tokens..."
mongosh "your-mongodb-uri" --eval "use saafe_db; db.aa_tsp_tokens.deleteMany({});"

echo "4. Starting server..."
npm run dev &
sleep 3

echo "5. Testing login..."
curl -X POST http://localhost:3000/api/auth/login

echo ""
echo "Done! Check the response above."
```

---

## ✅ Verification Checklist

To properly test with wrong email:

- [ ] Changed `.env` file with wrong email
- [ ] Stopped the server (Ctrl+C)
- [ ] Restarted the server (`npm run dev`)
- [ ] Deleted old tokens from MongoDB (optional)
- [ ] Tested `/api/auth/login` endpoint (not status)
- [ ] Checked server logs for error messages

---

## 🎯 Expected Behavior

### With CORRECT Email:
```json
{
  "success": true,
  "message": "Login successful",
  "expires_at": "2025-01-XX..."
}
```

### With WRONG Email:
```json
{
  "success": false,
  "error": "Request failed with status code 400",
  "details": {
    "status": "error",
    "message": "User with email : wrong-email@test.com does not exist"
  }
}
```

---

## 💡 Key Takeaway

**Always restart the server after changing `.env` file!**

Environment variables are loaded into memory when Node.js starts. Changes to `.env` while server is running won't be picked up automatically.

---

## 🚀 Quick Test Right Now

```bash
# 1. Verify wrong email in .env
cat .env | grep EMAIL

# 2. Stop server if running (Ctrl+C)

# 3. Delete old tokens
mongosh "your-mongodb-uri" --eval "use saafe_db; db.aa_tsp_tokens.deleteMany({});"

# 4. Restart server
npm run dev

# 5. In another terminal, test login
curl -X POST http://localhost:3000/api/auth/login
```

**Now it should fail with wrong email!** ✅

