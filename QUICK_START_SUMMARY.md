# ⚡ Quick Start - Get Running in 5 Minutes!

## 🎯 What We're Building

**Phase 2: Authentication Module** - The system that logs into Saafe TSP and manages tokens.

---

## ✅ What You Need

1. **MongoDB** - Database (local or cloud)
2. **Node.js** - Already installed if you're here
3. **Saafe Credentials** - Email/password from Saafe

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env - Add your MongoDB URI and Saafe credentials
# Required:
# - MONGODB_URI=mongodb://localhost:27017/saafe_db
# - SAAFE_LOGIN_EMAIL=your-email@saafe.tech
# - SAAFE_LOGIN_PASSWORD=your-password
```

### Step 3: Start MongoDB & Server
```bash
# Terminal 1: Start MongoDB (if local)
brew services start mongodb-community  # Mac
# OR use MongoDB Atlas (cloud) - just update MONGODB_URI in .env

# Terminal 2: Start server
npm run dev
```

**That's it!** Server should be running on http://localhost:3000

---

## 🧪 Quick Test

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```
Should return: `{"status":"ok",...}`

### Test 2: Login
```bash
curl -X POST http://localhost:3000/api/auth/login
```
Should return: `{"success":true,"message":"Login successful"}`

### Test 3: Check Status
```bash
curl http://localhost:3000/api/auth/status
```
Should show token info if login worked!

---

## 📖 Need More Details?

- **Full Setup Guide:** [SETUP_AND_TESTING.md](./SETUP_AND_TESTING.md)
- **What We Built:** [WHAT_WE_BUILT.md](./WHAT_WE_BUILT.md)
- **Understanding:** [ROADMAP_EXPLAINED.md](./ROADMAP_EXPLAINED.md)

---

## ❓ Troubleshooting

**MongoDB not connecting?**
- Check if MongoDB is running: `brew services list` (Mac)
- Or use MongoDB Atlas (cloud) - easier!

**Login failing?**
- Check `.env` file has correct credentials
- Verify Saafe API URL is correct

**Server not starting?**
- Check port 3000 is not in use
- Check MongoDB is connected (look at server logs)

---

**🚀 Ready to test? Follow the 3 steps above!**

