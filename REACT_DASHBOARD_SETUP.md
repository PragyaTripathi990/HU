# 🎨 React Consent Dashboard Setup Guide

## 📦 Files Created

1. **ConsentDashboard.jsx** - Main React component
2. **ConsentDashboard.css** - Glassmorphism styling

## 🚀 Setup Instructions

### 1. Install React (if not already installed)

```bash
# Create new React app (if starting fresh)
npx create-react-app saafe-dashboard
cd saafe-dashboard

# Or add to existing React project
```

### 2. Copy Files

Copy the following files to your React project:
- `ConsentDashboard.jsx` → `src/components/ConsentDashboard.jsx`
- `ConsentDashboard.css` → `src/components/ConsentDashboard.css`

### 3. Import in Your App

```jsx
// src/App.js
import React from 'react';
import ConsentDashboard from './components/ConsentDashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <ConsentDashboard />
    </div>
  );
}

export default App;
```

### 4. Backend Setup

✅ **CORS is already enabled** in `server.js`:
```javascript
app.use(cors()); // Enable CORS
```

If you need to configure CORS for specific origins:
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3001', // Your React app URL
  credentials: true
}));
```

### 5. Backend Route Added

✅ Added new route: `GET /internal/aa/consents/request/:request_id`

This allows fetching consent by `request_id` (which is what the component uses).

## 🎯 Features

### Step 1: Initiate Consent
- Mobile number input (default: 9898989898)
- Auto-generated Internal User ID
- "Connect Bank Account" button
- Calls `POST /internal/aa/consents/initiate`

### Step 2: Authorization
- Shows redirect URL
- "Authorize on Saafe" button (opens in new tab)
- "Check Status" button
- Auto-polls every 5 seconds
- Shows current status (PENDING, ACTIVE, etc.)

### Step 3: Success
- Success card with checkmark animation
- Displays consent_id
- Shows request_id and status
- "Fetch Data" button (placeholder for next phase)
- "Start New Connection" button

## 🎨 Design Features

- **Glassmorphism Effect**: Frosted glass cards with backdrop blur
- **Stepper Indicator**: Visual progress (1 → 2 → 3)
- **Responsive Design**: Works on mobile and desktop
- **Smooth Animations**: Hover effects, transitions, loading spinners
- **Professional Look**: Gradient background, clean typography

## 🔧 Configuration

### Change API URL

In `ConsentDashboard.jsx`, update:
```jsx
const API_BASE_URL = 'http://localhost:3000'; // Change if needed
```

### Customize Default Mobile

In `ConsentDashboard.jsx`, update:
```jsx
const [mobile, setMobile] = useState('9898989898'); // Change default
```

## 🧪 Testing

1. **Start Backend**:
   ```bash
   npm run dev
   ```

2. **Start React App**:
   ```bash
   npm start
   ```

3. **Test Flow**:
   - Enter mobile number
   - Click "Connect Bank Account"
   - Click "Authorize on Saafe" (opens Saafe UI)
   - Approve consent on Saafe
   - Status should automatically update to ACTIVE
   - Success card appears with consent_id

## 📋 API Endpoints Used

1. `POST /internal/aa/consents/initiate` - Initiate consent
2. `GET /internal/aa/consents/request/:request_id` - Check status

## ⚠️ Troubleshooting

### CORS Errors
- ✅ CORS is already enabled in backend
- If still getting errors, check browser console
- Ensure backend is running on `http://localhost:3000`

### Status Not Updating
- Check if webhook is being received
- Verify `request_id` is correct
- Check backend logs for errors

### Authorization URL Not Opening
- Check if `redirect_url` is returned from API
- Verify URL is valid
- Check browser popup blocker

## 🎯 Next Steps

1. **Phase 5**: Implement "Fetch Data" functionality
2. **Enhancements**:
   - Add error retry logic
   - Add loading skeletons
   - Add success animations
   - Add data visualization

---

**Dashboard is ready for stakeholder demo! 🎉**


