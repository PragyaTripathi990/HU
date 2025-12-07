# ⚡ Quick Start Guide

## 🚀 Get Dashboard Running in 3 Steps

### Step 1: Install Dependencies

```bash
cd dashboard
npm install
```

### Step 2: Create Environment File

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 3: Start Dashboard

```bash
npm run dev
```

**Dashboard will be available at:** `http://localhost:3001`

## ✅ Prerequisites

1. **Backend must be running** on `http://localhost:3000`
   ```bash
   # In project root
   npm run dev
   ```

2. **MongoDB must be running** (for backend)

## 🎯 Testing the Dashboard

1. Open `http://localhost:3001` in browser
2. Enter User ID and Mobile (default: 9898989898)
3. Click "Initiate Consent"
4. Watch the live logs on the right side
5. Copy/Open the authorization URL
6. Approve on Saafe
7. Status will auto-update to ACTIVE (polling every 3s)
8. Click "Fetch Data" to trigger FI request

## 🎨 Features

- **Matrix/Cyberpunk Theme**: Dark slate background with emerald accents
- **Live Logging**: See all API calls and webhooks in real-time
- **Auto-Polling**: Status updates every 3 seconds
- **Two-Column Layout**: Interactions + Live Server Logs

## 🐛 Troubleshooting

### CORS Errors
- ✅ Backend already has CORS enabled
- Check backend is running on port 3000
- Check browser console for specific errors

### Port Already in Use
- Next.js defaults to port 3000
- If backend is on 3000, Next.js will use 3001 automatically
- Or set custom port: `PORT=3001 npm run dev`

### API Connection Failed
- Verify backend is running: `curl http://localhost:3000/health`
- Check `.env.local` has correct API URL
- Check browser network tab for failed requests

---

**Ready to demo! 🎉**


