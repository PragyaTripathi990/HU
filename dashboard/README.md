# 🎨 Account Aggregator Dashboard

Production-ready Next.js dashboard with Matrix/Cyberpunk theme for Account Aggregator demo.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Configure Environment

Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Open in Browser

```
http://localhost:3001
```

## 📋 Features

- ✅ **Step 1**: Initiate consent form (User ID + Mobile)
- ✅ **Step 2**: Authorization URL with auto-polling (every 3s)
- ✅ **Step 3**: Success display + Fetch Data button
- ✅ **Live Logger**: Real-time API call and webhook logging
- ✅ **Matrix Theme**: Dark mode with emerald accents
- ✅ **Two-Column Layout**: Interactions + Live Logs

## 🎨 Design

- **Background**: Slate-950 (dark)
- **Accents**: Emerald-500 (green)
- **Font**: JetBrains Mono
- **Theme**: Matrix/Cyberpunk aesthetic

## 🔗 API Endpoints

- `POST /internal/aa/consents/initiate` - Initiate consent
- `GET /internal/aa/consents/request/:request_id` - Check status
- `POST /internal/aa/fi/fetch` - Fetch financial data

## 📝 Log Colors

- **Purple** 📡 - API calls
- **Green** ✅ - Success responses
- **Orange** 🔔 - Webhook events
- **Red** ❌ - Errors

## 🏗️ Project Structure

```
dashboard/
├── app/
│   ├── layout.jsx
│   ├── page.jsx
│   └── globals.css
├── components/
│   ├── ConsentDashboard.jsx
│   └── LogTerminal.jsx
├── tailwind.config.js
├── next.config.js
└── package.json
```

## 🎯 Usage Flow

1. Enter User ID and Mobile → Click "Initiate Consent"
2. Copy/Open Authorization URL → Approve on Saafe
3. Status auto-updates to ACTIVE (polling every 3s)
4. Click "Fetch Data" → See transaction ID in logs

---

**Ready for stakeholder demo! 🎉**


