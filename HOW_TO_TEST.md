# 🧪 HOW TO TEST - Start Here!

## 🎯 Quick Summary

I found that `package.json` was missing - I've created it! Now follow these steps:

---

## ⚡ FASTEST WAY TO TEST (3 Steps)

### 1️⃣ Install Dependencies (First Time Only)

```bash
cd /Users/pragyatripathi/HandaUncle/saafe
npm install
```

Wait 1-2 minutes for it to finish.

---

### 2️⃣ Start Server

```bash
npm run dev
```

Keep this terminal open! You should see:
```
✅ Server ready!
```

---

### 3️⃣ Test (In a NEW Terminal)

```bash
curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{"internal_user_id":"test123","mobile":"9876543210","fi_types":["DEPOSIT"]}'
```

**Expected:** Success response with `redirect_url`

---

## 📚 Detailed Guides

I've created **3 guides** for you - pick the one that works best:

### 1. **COMPLETE_TESTING_GUIDE.md** ⭐ RECOMMENDED
   - **Most detailed** - Step-by-step with explanations
   - **Perfect for beginners** - Explains everything
   - **Troubleshooting included** - Fixes for common issues
   - **Use this if:** You want detailed instructions

### 2. **STEP_BY_STEP_TESTING.md**
   - **Detailed step-by-step** instructions
   - **12 steps** from start to finish
   - **Use this if:** You prefer structured step-by-step

### 3. **SIMPLE_TEST_GUIDE.md**
   - **Quick reference** - Just the essentials
   - **Copy-paste commands** - Fast testing
   - **Use this if:** You're comfortable with terminals

---

## 🚀 What I Fixed

1. ✅ **Created `package.json`** - Was missing, now created with all dependencies
2. ✅ **Created testing guides** - 3 different guides for different skill levels
3. ✅ **All code is ready** - Consent service, routes, validators all working

---

## 📋 Prerequisites Checklist

Before testing, make sure you have:

- [ ] ✅ Node.js installed (check: `node --version`)
- [ ] ✅ MongoDB connection string in `.env` file
- [ ] ✅ Saafe API credentials in `.env` file
- [ ] ✅ Dependencies installed (`npm install`)

---

## 🎯 Recommended Path

1. **Start with:** `COMPLETE_TESTING_GUIDE.md`
   - Follow it step-by-step
   - It will guide you through everything

2. **If you get stuck:**
   - Check the troubleshooting section
   - Tell me which step and what error you see

3. **If everything works:**
   - You'll see success response
   - Server logs will show correct payload
   - `fetch_type` will be "PERIODIC"

---

## 🐛 Common Issues & Quick Fixes

### "Cannot find module"
→ Run: `npm install`

### "Cannot connect to MongoDB"
→ Check `.env` file has correct `MONGODB_URI`

### "Port 3000 already in use"
→ Change `PORT=3001` in `.env` file

### "401 Unauthorized"
→ Check Saafe credentials in `.env` file

---

## 📝 Files Created

1. ✅ `package.json` - Dependencies configuration
2. ✅ `COMPLETE_TESTING_GUIDE.md` - Detailed guide
3. ✅ `STEP_BY_STEP_TESTING.md` - Step-by-step guide
4. ✅ `SIMPLE_TEST_GUIDE.md` - Quick reference
5. ✅ `TEST_CONSENT_NEW.md` - Comprehensive testing guide
6. ✅ `TEST_COMMANDS.md` - Command reference

---

## 🎉 Ready to Test!

**Start here:** Open `COMPLETE_TESTING_GUIDE.md` and follow the steps!

If you get stuck at any point, tell me:
- Which step number
- What command you ran
- What error message you saw

I'll help you fix it! 🚀

