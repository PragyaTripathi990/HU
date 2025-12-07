# 🚀 Setup & Testing Guide

## Step-by-Step Setup (From Zero to Running)

### Prerequisites
- Node.js 18+ installed ([Download](https://nodejs.org/))
- MongoDB installed and running ([Download](https://www.mongodb.com/try/download/community))
- A code editor (VS Code recommended)
- Postman (for API testing)

---

## Part 1: MongoDB Setup ⚡

### Option A: Install MongoDB Locally

**Mac (using Homebrew):**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
brew services list
```

**Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer
3. MongoDB will start automatically as a service

**Linux (Ubuntu):**
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option B: Use MongoDB Atlas (Cloud - Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free
3. Create a free cluster
4. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/saafe_db`)

### Verify MongoDB is Running

```bash
# Check MongoDB status (Mac/Linux)
brew services list | grep mongodb

# OR connect to MongoDB shell
mongosh

# In MongoDB shell, type:
show dbs
exit
```

---

## Part 2: Project Setup 📦

### Step 1: Install Dependencies

```bash
cd /Users/pragyatripathi/HandaUncle/saafe

# Install all dependencies
npm install
```

This will install:
- `express` - Web server
- `mongoose` - MongoDB driver
- `axios` - HTTP client for API calls
- `dotenv` - Environment variables
- And other dependencies...

### Step 2: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use VS Code: code .env
```

**Required Settings:**
```env
# MongoDB - Choose one:

# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/saafe_db

# Option B: MongoDB Atlas (cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saafe_db

# Saafe API (You'll get these from Saafe)
SAAFE_API_BASE_URL=https://uat.tsp.api.saafe.tech
SAAFE_LOGIN_EMAIL=your-email@saafe.tech
SAAFE_LOGIN_PASSWORD=your-password

# Server
PORT=3000
NODE_ENV=development
```

**🔑 Getting Saafe Credentials:**
- Check your email from Saafe for sandbox credentials
- Or contact Saafe support for sandbox access
- Look for credentials in the Postman collection they provided

### Step 3: Verify Setup

```bash
# Test if everything is installed
npm list express mongoose axios

# Should show installed packages
```

---

## Part 3: Understanding What We Built 🧠

### What is Authentication Service?

**Simple Explanation:**
Imagine you want to enter a building:
1. You need a key card (access token) to get in
2. The key card expires after 24 hours
3. Before it expires, you automatically get a new one (refresh token)
4. If you lose access, you get a completely new key card (login)

**In Our Code:**
- `tspAuth.login()` - Gets a new key card (token)
- `tspAuth.refreshToken()` - Gets a new key card before old one expires
- `tspAuth.getValidToken()` - Always gives you a valid key card (auto-refreshes if needed)

### What is HTTP Client?

**Simple Explanation:**
It's like a smart assistant that:
- Always adds your key card (token) to every request automatically
- If the key card is rejected (403 error), gets a new one and tries again
- Handles all the boring stuff so you don't have to

**In Our Code:**
- `httpClient.get(url)` - Makes GET request with token
- `httpClient.post(url, data)` - Makes POST request with token
- Automatically handles 403 errors by refreshing token

---

## Part 4: Running the Server 🏃

### Start the Server

```bash
# Development mode (auto-restarts on file changes)
npm run dev

# OR Production mode
npm start
```

**You should see:**
```
✅ MongoDB Connected: localhost:27017
🚀 Server is running!
   📍 Port: 3000
   🌍 Environment: development
   🔗 Health check: http://localhost:3000/health

✅ Server ready!
```

### Test Health Check

Open your browser or use curl:
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "service": "Saafe TSP Integration Service"
}
```

---

## Part 5: Testing Authentication 🔐

### Test 1: Check Authentication Status

```bash
curl http://localhost:3000/api/auth/status
```

**Expected (First time - no token):**
```json
{
  "success": false,
  "authenticated": false,
  "message": "No active token found"
}
```

### Test 2: Login to Saafe

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json"
```

**Expected (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "expires_at": "2025-01-XX..."
}
```

**If it fails:**
- Check your `.env` file has correct credentials
- Verify Saafe API is accessible
- Check MongoDB is running

### Test 3: Check Status Again (After Login)

```bash
curl http://localhost:3000/api/auth/status
```

**Expected:**
```json
{
  "success": true,
  "authenticated": true,
  "token": {
    "fiu_id": "your-fiu-id",
    "expires_at": "2025-01-XX...",
    "is_expired": false,
    "is_expiring_soon": false,
    "minutes_until_expiry": 1440
  }
}
```

### Test 4: Test Token Retrieval

```bash
curl http://localhost:3000/api/auth/test-token
```

**Expected:**
```json
{
  "success": true,
  "message": "Token retrieved successfully",
  "token_length": 150,
  "token_preview": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Test 5: Manual Token Refresh

```bash
curl -X POST http://localhost:3000/api/auth/refresh
```

**Expected:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "expires_at": "2025-01-XX..."
}
```

---

## Part 6: Testing with Postman 📮

### Import Collection

1. Open Postman
2. Import the Saafe Postman collection (if you have it)
3. Set up environment variables in Postman:
   - `base_url`: `http://localhost:3000`
   - `saafe_api_url`: `https://uat.tsp.api.saafe.tech`

### Test Endpoints

1. **Health Check:**
   - GET `{{base_url}}/health`

2. **Login Status:**
   - GET `{{base_url}}/api/auth/status`

3. **Login:**
   - POST `{{base_url}}/api/auth/login`

4. **Test Token:**
   - GET `{{base_url}}/api/auth/test-token`

---

## Part 7: Checking MongoDB 📊

### Using MongoDB Compass (GUI - Recommended)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to: `mongodb://localhost:27017`
3. View database: `saafe_db`
4. Check collection: `aa_tsp_tokens`

**You should see:**
- A document with `access_token`, `refresh_token`, `expires_at`, etc.

### Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use saafe_db

# View tokens
db.aa_tsp_tokens.find().pretty()

# Count tokens
db.aa_tsp_tokens.countDocuments()

# Exit
exit
```

### What You Should See in Database

After successful login:
```javascript
{
  _id: ObjectId("..."),
  access_token: "eyJhbGciOiJIUzI1NiIs...",
  refresh_token: "eyJhbGciOiJIUzI1NiIs...",
  token_type: "bearer",
  fiu_id: "your-fiu-id",
  expires_at: ISODate("2025-01-XX..."),
  is_active: true,
  createdAt: ISODate("2025-01-XX..."),
  updatedAt: ISODate("2025-01-XX...")
}
```

---

## Part 8: Running Automated Tests 🧪

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch
```

### What Tests Do

1. **Login Test** - Tests if login works with your credentials
2. **Token Storage Test** - Verifies token is saved to database
3. **Token Retrieval Test** - Tests getting valid token
4. **Refresh Test** - Tests token refresh functionality
5. **HTTP Client Test** - Tests automatic token injection

### Test Results

**If tests pass:**
```
✅ Authentication Service
  ✅ should login successfully
  ✅ should get valid token
  ✅ should check if token is stored correctly
  ✅ should refresh token successfully
```

**If tests fail:**
- Check your `.env` credentials
- Verify MongoDB is running
- Check Saafe API is accessible

---

## Part 9: Troubleshooting 🔧

### Problem: MongoDB Connection Failed

**Solution:**
```bash
# Check if MongoDB is running
brew services list  # Mac
# OR
sudo systemctl status mongod  # Linux

# Start MongoDB if not running
brew services start mongodb-community  # Mac
# OR
sudo systemctl start mongod  # Linux
```

### Problem: Login Fails

**Check:**
1. `.env` file has correct email/password
2. Saafe API URL is correct: `https://uat.tsp.api.saafe.tech`
3. You have internet connection
4. Saafe sandbox is accessible

**Test manually:**
```bash
curl -X POST https://uat.tsp.api.saafe.tech/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'
```

### Problem: Token Not Stored

**Check:**
1. MongoDB is connected (check server logs)
2. Database name is correct: `saafe_db`
3. No errors in server console

**Verify:**
```bash
# Check MongoDB
mongosh
use saafe_db
db.aa_tsp_tokens.find()
```

### Problem: 403 Forbidden Errors

**This is normal!** It means:
- Token expired or invalid
- System should auto-refresh (check logs)
- If refresh fails, try manual login again

---

## Part 10: Understanding What Happens 🔍

### Flow When You Call Login:

```
1. You call: POST /api/auth/login
   ↓
2. Server calls: tspAuth.login()
   ↓
3. Makes HTTP request: POST https://uat.tsp.api.saafe.tech/api/login
   ↓
4. Saafe responds with: access_token, refresh_token
   ↓
5. Server stores in MongoDB: aa_tsp_tokens collection
   ↓
6. Server responds: "Login successful"
```

### Flow When You Make API Call:

```
1. You call any Saafe API (via httpClient)
   ↓
2. httpClient.getValidToken() checks database
   ↓
3. If token expired/expiring soon → auto-refresh
   ↓
4. Adds token to request: Authorization: Bearer <token>
   ↓
5. Makes API call to Saafe
   ↓
6. If 403 error → refresh token → retry request
```

### Database Changes:

**Before Login:**
- `aa_tsp_tokens` collection is empty

**After Login:**
- One document with `is_active: true`
- Contains `access_token`, `refresh_token`, `expires_at`

**After Refresh:**
- Same document updated with new `access_token`
- `expires_at` updated to 24 hours from now

---

## Part 11: Next Steps 🎯

Once authentication is working:

1. ✅ **Test login** - Works
2. ✅ **Test token storage** - Token in MongoDB
3. ✅ **Test token refresh** - Can refresh
4. ⏭️ **Next Phase**: Consent Generation (Phase 3)

### Verify Everything Works:

```bash
# 1. Start server
npm run dev

# 2. In another terminal, test login
curl -X POST http://localhost:3000/api/auth/login

# 3. Check status
curl http://localhost:3000/api/auth/status

# 4. Check MongoDB
mongosh
use saafe_db
db.aa_tsp_tokens.find().pretty()
```

---

## 🎉 Success Checklist

- [ ] MongoDB installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Server starts without errors
- [ ] Health check returns OK
- [ ] Login works
- [ ] Token stored in MongoDB
- [ ] Token refresh works
- [ ] Tests pass

---

**Questions? Check the logs in your terminal - they'll tell you what's happening!**

**Need Help?** 
- Check server console output
- Check MongoDB logs
- Verify `.env` file settings
- Test Saafe API directly with curl/Postman

