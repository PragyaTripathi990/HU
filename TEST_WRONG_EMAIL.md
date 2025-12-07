# 🧪 How to Properly Test with Wrong Email

## The Issue

You changed the email to a wrong one, but it still logs in. Here's why and how to fix:

---

## 🔍 Why This Happens

### Reason 1: Server is Using Cached Environment Variables ⚠️

**Node.js loads `.env` file ONLY when server starts.**

If you:
1. Changed `.env` file
2. But server is still running

Then the server is **still using the OLD email/password** from memory!

**Solution:** Restart the server!

### Reason 2: Existing Token in Database 🔑

If you previously logged in successfully, there's a **valid token stored in MongoDB**.

When you check status or call certain endpoints, it uses the **existing token** instead of trying to login again.

**Solution:** Delete old tokens!

---

## ✅ Proper Testing Steps

### Step 1: Stop the Server

```bash
# Press Ctrl+C in the terminal where server is running
# OR kill the process
lsof -ti:3000 | xargs kill -9
```

### Step 2: Clear Old Tokens from MongoDB

```bash
# Connect to MongoDB
mongosh "mongodb+srv://16pragyatripathi_db_user:C4BtPth0NeuZbyE4@cluster0.zjuff18.mongodb.net/saafe_db?appName=Cluster0"

# Delete all tokens
use saafe_db
db.aa_tsp_tokens.deleteMany({})
exit
```

### Step 3: Change Email to Wrong One

Edit your `.env` file:

```env
SAAFE_LOGIN_EMAIL=wrong-email@test.com
SAAFE_LOGIN_PASSWORD=wrong-password
```

### Step 4: Restart Server

```bash
npm run dev
```

### Step 5: Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login
```

**NOW it should fail!** ❌

Expected response:
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

## 🔍 Check What's Actually Happening

### Check 1: Verify Server is Reading New .env

Add this temporarily to see what email the server is using:

```javascript
// In server.js or routes/auth.js, add:
console.log('📧 Using email:', process.env.SAAFE_LOGIN_EMAIL);
```

### Check 2: Check MongoDB for Existing Tokens

```bash
mongosh "your-mongodb-uri"
use saafe_db
db.aa_tsp_tokens.find().pretty()
```

If you see a token with `is_active: true`, that's why it's "still logging in" - it's using the old token!

### Check 3: Check Server Logs

When you call `/api/auth/login`, check server console:

**With wrong email:**
```
🔐 Attempting to login to Saafe TSP...
❌ Login failed: Request failed with status code 400
```

**With correct email (but using old token):**
```
📝 No token found, logging in...
✅ Login successful! Token stored in database.
```

---

## 🎯 Quick Test Script

Run this to properly test:

```bash
#!/bin/bash

echo "🧹 Clearing old tokens..."
mongosh "mongodb+srv://16pragyatripathi_db_user:C4BtPth0NeuZbyE4@cluster0.zjuff18.mongodb.net/saafe_db?appName=Cluster0" --eval "use saafe_db; db.aa_tsp_tokens.deleteMany({});"

echo ""
echo "📧 Current email in .env:"
cat .env | grep SAAFE_LOGIN_EMAIL

echo ""
echo "🔄 Please restart server now (Ctrl+C, then npm run dev)"
echo "Then test: curl -X POST http://localhost:3000/api/auth/login"
```

---

## 📋 Verification Checklist

To properly test login failure:

- [ ] Changed email in `.env` to wrong email
- [ ] **STOPPED the server** (Ctrl+C)
- [ ] **Deleted old tokens** from MongoDB
- [ ] **RESTARTED the server** (npm run dev)
- [ ] Tested `/api/auth/login` (not `/api/auth/status`)
- [ ] Checked server logs for error messages

---

## 🔑 Key Points

1. **Environment variables are loaded ONCE** when server starts
2. **You MUST restart server** after changing `.env`
3. **Old tokens persist** in MongoDB until deleted or expired
4. **`/api/auth/status`** just checks existing token (doesn't test login)
5. **`/api/auth/login`** actually tries to login (this should fail with wrong email)

---

## ✅ Expected Results

### With Wrong Email (After Restart):
```bash
$ curl -X POST http://localhost:3000/api/auth/login

{
  "success": false,
  "error": "Request failed with status code 400",
  "details": {
    "status": "error",
    "message": "User with email : wrong-email@test.com does not exist"
  }
}
```

### Server Console Should Show:
```
🔐 Attempting to login to Saafe TSP...
❌ Login failed: Request failed with status code 400
```

---

**The main issue: You need to restart the server after changing .env!**

