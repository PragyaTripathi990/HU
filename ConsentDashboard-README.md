# 🎨 Consent Dashboard Component

## Quick Start

1. **Copy files to your React project:**
   - `ConsentDashboard.jsx` → `src/components/ConsentDashboard.jsx`
   - `ConsentDashboard.css` → `src/components/ConsentDashboard.css`

2. **Import in App.js:**
   ```jsx
   import ConsentDashboard from './components/ConsentDashboard';
   
   function App() {
     return <ConsentDashboard />;
   }
   ```

3. **Start backend** (port 3000):
   ```bash
   npm run dev
   ```

4. **Start React app** (port 3001 or 3000):
   ```bash
   npm start
   ```

## ✅ Features Implemented

- ✅ Step 1: Initiate consent form
- ✅ Step 2: Authorization with redirect URL
- ✅ Step 3: Success display with consent_id
- ✅ Auto-polling every 5 seconds
- ✅ Glassmorphism design
- ✅ Stepper indicator
- ✅ Error handling with CORS hints
- ✅ Responsive design

## 🔗 API Endpoints

- `POST /internal/aa/consents/initiate` - Initiate consent
- `GET /internal/aa/consents/request/:request_id` - Check status

## 🎨 Design

- **Glassmorphism**: Frosted glass effect with backdrop blur
- **Gradient Background**: Purple gradient (667eea → 764ba2)
- **Smooth Animations**: Hover effects, transitions
- **Professional**: Ready for stakeholder demo

## ⚠️ CORS Note

CORS is already enabled in `server.js`. If you get CORS errors:
- Check backend is running
- Verify React app URL matches CORS origin
- Check browser console for specific errors


