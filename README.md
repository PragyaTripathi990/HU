# Saafe TSP Integration Service

A fully automated backend service for integrating with Saafe TSP (Transaction Service Provider) sandbox for Account Aggregator (AA) flows.

## 📚 Documentation

- **[PROJECT_EXPLANATION.md](./PROJECT_EXPLANATION.md)** - Detailed explanation of what needs to be built
- **[ROADMAP.md](./ROADMAP.md)** - Step-by-step implementation roadmap (14-day plan)
- **[ROADMAP_EXPLAINED.md](./ROADMAP_EXPLAINED.md)** - 🎓 **Roadmap explained from 0 to Pro level!** (Perfect for beginners)
- **[QUICK_START.md](./QUICK_START.md)** - Quick setup guide and project structure
- **[SCHEMA_DOCUMENTATION.md](./SCHEMA_DOCUMENTATION.md)** - Complete database schema documentation (MongoDB/Mongoose)
- **[FLOW_DIAGRAM.md](./FLOW_DIAGRAM.md)** - Visual flow diagrams for all processes

## 🎯 Project Overview

This service automates the Account Aggregator flow by:

1. **Authenticating** with Saafe TSP APIs using token-based auth
2. **Generating consents** for customers to share financial data
3. **Processing webhooks** for real-time status updates
4. **Requesting financial data** from banks/FIPs
5. **Retrieving and storing reports** (JSON/XLSX)
6. **Analyzing bank statements** (BSA) via PDF upload

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌──────────────┐
│   Your System   │────────▶│ This Service │────────▶│ Saafe TSP    │
│                 │◀────────│              │◀────────│ APIs         │
└─────────────────┘         └──────────────┘         └──────────────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │   MongoDB    │
                            │   Database   │
                            └──────────────┘
```

## 🔑 Key Components

### Core Services
- **Authentication Service** - Token management & auto-refresh
- **Consent Service** - Consent generation & tracking
- **Webhook Service** - Real-time status updates
- **Report Service** - Financial data retrieval
- **BSA Service** - Bank statement analysis

### Database Models (MongoDB/Mongoose)
1. **TSPToken** (`aa_tsp_tokens`) - Authentication tokens
2. **ConsentRequest** (`aa_consent_requests`) - Consent tracking
3. **WebhookEvent** (`aa_webhook_events`) - Webhook logs
4. **TxnStatusHistory** (`aa_txn_status_history`) - Status history
5. **Report** (`aa_reports`) - Financial reports
6. **BSARun** (`aa_bsa_runs`) - BSA processing
7. **Error** (`aa_errors`) - Error logging

📖 **See [SCHEMA_DOCUMENTATION.md](./SCHEMA_DOCUMENTATION.md) for complete schema details**

### Internal APIs
- `POST /internal/aa/consents/initiate` - Start consent flow
- `GET /internal/aa/consents/:id` - View consent details
- `POST /internal/aa/transactions/:txn_id/retrieve-report` - Get report
- `POST /internal/aa/bsa/initiate` - Upload PDF for analysis
- `GET /internal/aa/bsa/status/:tracking_id` - Check BSA status

### Webhook Endpoints
- `POST /webhooks/aa/txn` - Transaction status updates
- `POST /webhooks/aa/consent` - Consent status updates

## 🚀 Getting Started

1. **Read the documentation**:
   - Start with [PROJECT_EXPLANATION.md](./PROJECT_EXPLANATION.md) to understand what to build
   - Follow [ROADMAP.md](./ROADMAP.md) for step-by-step implementation
   - Use [QUICK_START.md](./QUICK_START.md) for setup

2. **Set up your environment**:
   ```bash
   # Install dependencies
   npm install  # or pip install -r requirements.txt
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Initialize database**:
   ```bash
   # Create database
   createdb saafe_db
   
   # Run migrations
   npm run migrate
   ```

4. **Start development**:
   ```bash
   npm run dev
   ```

## 📋 Implementation Checklist

- [ ] Phase 0: Project Setup
- [ ] Phase 1: Database Setup
- [ ] Phase 2: Authentication Module
- [ ] Phase 3: Consent Generation
- [ ] Phase 4: Webhook Handlers
- [ ] Phase 5: Status Polling
- [ ] Phase 6: FI Data Request
- [ ] Phase 7: Report Retrieval
- [ ] Phase 8: BSA Implementation
- [ ] Phase 9: Internal APIs
- [ ] Phase 10: Error Handling
- [ ] Phase 11: Background Jobs
- [ ] Phase 12: Integration Testing
- [ ] Phase 13: Documentation

## 🔧 Tech Stack (MERN)

- **Backend**: Node.js + Express
- **Database**: MongoDB
- **ODM**: Mongoose
- **HTTP Client**: Axios
- **Jobs**: node-cron
- **Logging**: Winston
- **Validation**: express-validator
- **File Upload**: Multer

## 📖 API Documentation

The service integrates with Saafe TSP APIs documented in:
- `Saafe TSP_API_Documentation_11112025.pdf`
- `Saafe360 APIs.postman_collection.json`

Key Saafe APIs used:
- `POST /api/login` - Authentication
- `POST /api/generate/consent` - Consent generation
- `POST /api/status-check` - Status polling
- `POST /api/data/request` - FI data request
- `POST /api/retrievereport` - Report retrieval
- `POST /api/bsa/statement` - BSA upload
- `GET /api/bsa/status` - BSA status

## 🎓 Learning Resources

- Review the Saafe API documentation thoroughly
- Test APIs using Postman collection first
- Understand Account Aggregator flow from India's ReBIT standards
- Study webhook patterns and idempotency

## 📝 Notes

- This is a **backend-only** service (no UI)
- All APIs point to **sandbox environment**
- Tokens expire in **24 hours** - auto-refresh needed
- Webhooks require **public URL** (use ngrok for local dev)
- Comprehensive **error handling** and **logging** required

## 🤝 Support

For questions about:
- **Requirements**: See PROJECT_EXPLANATION.md
- **Implementation**: See ROADMAP.md
- **Setup**: See QUICK_START.md
- **API Details**: See Saafe API documentation PDF

---

**Status**: 🚧 Ready for Implementation

**Estimated Timeline**: 13-14 days (full-time)

**Priority**: Start with Authentication → Consent → Webhooks → Reports

