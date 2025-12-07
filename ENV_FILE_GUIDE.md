# 📝 .env File Setup Guide

## Quick Reference

Create a file named `.env` in the root directory with these variables:

---

## ✅ REQUIRED Variables (Must Have)

### 1. MongoDB Connection

**Option A: Local MongoDB**
```env
MONGODB_URI=mongodb://localhost:27017/saafe_db
```

**Option B: MongoDB Atlas (Cloud)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saafe_db
```

**What it does:** Connects to your MongoDB database where tokens and data are stored.

**How to get it:**
- **Local:** If MongoDB is installed locally, use: `mongodb://localhost:27017/saafe_db`
- **Atlas:** Get from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - sign up free, create cluster, click "Connect" → "Connect your application" → copy connection string

---

### 2. Saafe API Configuration

```env
SAAFE_API_BASE_URL=https://uat.tsp.api.saafe.tech
SAAFE_LOGIN_EMAIL=your-email@example.com
SAAFE_LOGIN_PASSWORD=your-password
```

**What it does:** 
- `SAAFE_API_BASE_URL` - Where to call Saafe APIs (sandbox URL)
- `SAAFE_LOGIN_EMAIL` - Your email for Saafe login
- `SAAFE_LOGIN_PASSWORD` - Your password for Saafe login

**How to get it:**
- Check email from Saafe with sandbox credentials
- Check the Postman collection they provided
- Or contact Saafe support for sandbox access

---

## ⚙️ OPTIONAL Variables (Have Defaults)

### 3. Server Configuration

```env
PORT=3000
NODE_ENV=development
```

**What it does:**
- `PORT` - Port number for server (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

**Default values:** If you don't add these, it will use PORT=3000 and NODE_ENV=development

---

## 🔮 Future Variables (For Later Phases)

These are for features we'll build later, but you can add them now:

```env
# Webhooks (Phase 4)
WEBHOOK_SECRET=your-webhook-secret-here
BASE_URL=http://localhost:3000
TXN_CALLBACK_URL=http://localhost:3000/webhooks/aa/txn
CONSENT_CALLBACK_URL=http://localhost:3000/webhooks/aa/consent

# File Storage (Phase 7-8)
STORAGE_PATH=./storage/reports

# Background Jobs (Phase 11)
ENABLE_TOKEN_REFRESH_JOB=true
ENABLE_STATUS_POLLING_JOB=true
ENABLE_BSA_POLLING_JOB=true
STATUS_POLL_INTERVAL=5
BSA_POLL_INTERVAL=2
TOKEN_REFRESH_INTERVAL=12

# Logging
LOG_LEVEL=info
```

**For now:** You can ignore these! We'll add them when we build those features.

---

## 📄 Complete .env File Example

### Minimal (Just what you need now):

```env
# MongoDB - Choose one option:

# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/saafe_db

# Option B: MongoDB Atlas (Cloud) - uncomment and use this instead
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saafe_db

# Saafe TSP API - REQUIRED
SAAFE_API_BASE_URL=https://uat.tsp.api.saafe.tech
SAAFE_LOGIN_EMAIL=your-email@saafe.tech
SAAFE_LOGIN_PASSWORD=your-password-here

# Server (optional - has defaults)
PORT=3000
NODE_ENV=development
```

### Full (Everything including future features):

```env
# ============================================
# REQUIRED - You MUST have these
# ============================================

# MongoDB Connection
# Option A: Local
MONGODB_URI=mongodb://localhost:27017/saafe_db

# Option B: MongoDB Atlas (Cloud) - use this instead
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saafe_db

# Saafe TSP API Credentials
SAAFE_API_BASE_URL=https://uat.tsp.api.saafe.tech
SAAFE_LOGIN_EMAIL=your-email@example.com
SAAFE_LOGIN_PASSWORD=your-password

# ============================================
# OPTIONAL - Has default values
# ============================================

# Server Configuration
PORT=3000
NODE_ENV=development

# ============================================
# FUTURE - For later phases (ignore for now)
# ============================================

# Webhooks (Phase 4)
WEBHOOK_SECRET=your-webhook-secret-here
BASE_URL=http://localhost:3000
TXN_CALLBACK_URL=http://localhost:3000/webhooks/aa/txn
CONSENT_CALLBACK_URL=http://localhost:3000/webhooks/aa/consent

# File Storage (Phase 7-8)
STORAGE_PATH=./storage/reports

# Background Jobs (Phase 11)
ENABLE_TOKEN_REFRESH_JOB=true
ENABLE_STATUS_POLLING_JOB=true
ENABLE_BSA_POLLING_JOB=true
STATUS_POLL_INTERVAL=5
BSA_POLL_INTERVAL=2
TOKEN_REFRESH_INTERVAL=12

# Logging
LOG_LEVEL=info
```

---

## 🎯 Step-by-Step Setup

### Step 1: Create the file

```bash
# In your project directory
cd /Users/pragyatripathi/HandaUncle/saafe

# Create .env file
touch .env

# OR open in your editor
code .env
```

### Step 2: Add Required Variables

Copy and paste this template, then fill in YOUR values:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/saafe_db

# Saafe API - REPLACE WITH YOUR CREDENTIALS
SAAFE_API_BASE_URL=https://uat.tsp.api.saafe.tech
SAAFE_LOGIN_EMAIL=REPLACE_WITH_YOUR_EMAIL
SAAFE_LOGIN_PASSWORD=REPLACE_WITH_YOUR_PASSWORD

# Server
PORT=3000
NODE_ENV=development
```

### Step 3: Fill in Your Values

**Replace:**
- `REPLACE_WITH_YOUR_EMAIL` → Your actual Saafe email
- `REPLACE_WITH_YOUR_PASSWORD` → Your actual Saafe password
- `mongodb://localhost:27017/saafe_db` → Your MongoDB connection string (if using Atlas)

---

## 🔍 How to Get Saafe Credentials

### Method 1: Check Your Email
- Look for email from Saafe with subject like "Sandbox Access" or "API Credentials"
- Should have email and password

### Method 2: Check Postman Collection
- Open the `Saafe360 APIs.postman_collection.json` file
- Look for environment variables or examples
- May have test credentials

### Method 3: Contact Saafe
- Email Saafe support asking for sandbox/test credentials
- Mention you need credentials for TSP API sandbox

### Method 4: Test Directly
Try logging in directly:
```bash
curl -X POST https://uat.tsp.api.saafe.tech/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'
```

If this works, your credentials are correct!

---

## 🧪 Verify Your .env File

### Check 1: File exists
```bash
ls -la .env
```
Should show the file

### Check 2: Has required variables
```bash
cat .env | grep SAAFE_LOGIN_EMAIL
```
Should show your email

### Check 3: No typos
Make sure:
- No spaces around `=` sign: `KEY=value` ✅ (not `KEY = value` ❌)
- No quotes needed (but won't hurt if you add them)
- Each variable on its own line

---

## ❌ Common Mistakes

### ❌ Wrong Format
```env
# BAD
SAAFE_LOGIN_EMAIL = your-email@example.com  # Spaces around =
SAAFE_LOGIN_EMAIL="your-email@example.com"  # Quotes not needed (but OK)
SAAFE_LOGIN_EMAIL=your-email@example.com SAAFE_LOGIN_PASSWORD=pass  # Multiple on one line
```

### ✅ Correct Format
```env
# GOOD
SAAFE_LOGIN_EMAIL=your-email@example.com
SAAFE_LOGIN_PASSWORD=your-password
MONGODB_URI=mongodb://localhost:27017/saafe_db
```

### ❌ Missing Variables
If you forget required variables:
- `SAAFE_LOGIN_EMAIL` → Login will fail
- `SAAFE_LOGIN_PASSWORD` → Login will fail
- `MONGODB_URI` → Database connection will fail

---

## 📋 Quick Checklist

Before running the server, make sure:

- [ ] `.env` file exists in project root
- [ ] `MONGODB_URI` is set (local or Atlas)
- [ ] `SAAFE_API_BASE_URL` is set
- [ ] `SAAFE_LOGIN_EMAIL` is set with YOUR email
- [ ] `SAAFE_LOGIN_PASSWORD` is set with YOUR password
- [ ] No spaces around `=` signs
- [ ] Each variable on its own line

---

## 🚀 Test Your .env File

After creating `.env`, test it:

```bash
# Start server
npm run dev

# Should connect to MongoDB successfully
# Should start on port 3000
# Then test login:
curl -X POST http://localhost:3000/api/auth/login
```

If you see errors about missing variables, check your `.env` file again!

---

## 💡 Tips

1. **Never commit .env to Git** - It's already in `.gitignore`
2. **Use different .env for different environments:**
   - `.env.development` - Local testing
   - `.env.production` - Production server
3. **Keep credentials secret** - Don't share your `.env` file
4. **Test before building** - Make sure login works before moving forward

---

## 📞 Still Need Help?

1. **Can't find Saafe credentials?**
   - Check email from Saafe
   - Check Postman collection
   - Contact Saafe support

2. **MongoDB connection fails?**
   - Verify MongoDB is running: `brew services list` (Mac)
   - Check connection string is correct
   - Test with MongoDB Compass

3. **Login fails?**
   - Verify credentials in `.env`
   - Test Saafe API directly with curl
   - Check server logs for error messages

---

**🎯 Minimum .env file for Phase 2 (Authentication):**

```env
MONGODB_URI=mongodb://localhost:27017/saafe_db
SAAFE_API_BASE_URL=https://uat.tsp.api.saafe.tech
SAAFE_LOGIN_EMAIL=your-email@example.com
SAAFE_LOGIN_PASSWORD=your-password
```

That's it! These 4 variables are all you need to start! 🚀

