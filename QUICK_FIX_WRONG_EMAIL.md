# ⚡ Quick Fix: Testing Wrong Email Login

## The Problem

You changed email to wrong one, but it still logs in. Here's why:

**Node.js loads environment variables ONLY when server starts!**

If server is still running, it's using OLD email from memory.

---

## 🔧 Quick Fix (3 Steps)

### Step 1: Stop Server
```bash
# Press Ctrl+C in terminal where server is running
```

### Step 2: Delete Old Tokens
```bash
mongosh "mongodb+srv://16pragyatripathi_db_user:C4BtPth0NeuZbyE4@cluster0.zjuff18.mongodb.net/saafe_db?appName=Cluster0" --eval "use saafe_db; db.aa_tsp_tokens.deleteMany({});"
```

### Step 3: Restart Server
```bash
npm run dev
```

**Now test again** - it should fail with wrong email! ✅

---

## 🧪 Test Command

```bash
curl -X POST http://localhost:3000/api/auth/login
```

**Expected with wrong email:**
```json
{
  "success": false,
  "error": "...",
  "details": {
    "message": "User with email : wrong-email@test.com does not exist"
  }
}
```

---

## 💡 Why This Happens

1. ✅ You change `.env` file
2. ❌ Server still running = using OLD variables
3. ✅ Server needs RESTART to load new variables

**Always restart server after changing .env!** 🔄

