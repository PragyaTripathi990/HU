# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+ (or Python 3.9+)
- PostgreSQL 14+
- Postman (for API testing)
- Git

## Project Structure Recommendation

```
saafe/
├── src/
│   ├── config/          # Configuration files
│   ├── database/        # DB connection, models, migrations
│   ├── services/        # Business logic
│   │   ├── auth/        # Authentication service
│   │   ├── consent/     # Consent service
│   │   ├── webhook/     # Webhook handlers
│   │   ├── report/      # Report retrieval
│   │   └── bsa/         # BSA service
│   ├── api/             # API routes
│   │   ├── internal/    # Internal APIs
│   │   └── webhooks/    # Webhook endpoints
│   ├── jobs/            # Background jobs
│   ├── utils/           # Utilities
│   └── types/           # TypeScript types
├── tests/               # Test files
├── migrations/          # Database migrations
├── .env.example         # Environment variables template
└── README.md
```

## Environment Variables Needed

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/saafe_db

# Saafe TSP API
SAAFE_API_BASE_URL=https://uat.tsp.api.saafe.tech
SAAFE_LOGIN_EMAIL=your-email@example.com
SAAFE_LOGIN_PASSWORD=your-password

# Webhooks
WEBHOOK_SECRET=your-webhook-secret-here
BASE_URL=https://your-domain.com
TXN_CALLBACK_URL=https://your-domain.com/webhooks/aa/txn
CONSENT_CALLBACK_URL=https://your-domain.com/webhooks/aa/consent

# Server
PORT=3000
NODE_ENV=development

# Storage (for XLSX files)
STORAGE_PATH=./storage/reports
# OR use S3:
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_S3_BUCKET=
```

## First Steps

1. **Clone/Initialize Repository**
   ```bash
   cd saafe
   git init
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Choose Your Stack**

   **Option A: Node.js/TypeScript** (Recommended)
   ```bash
   npm init -y
   npm install express axios pg typeorm dotenv winston
   npm install -D typescript @types/node @types/express ts-node nodemon
   ```

   **Option B: Python**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install fastapi sqlalchemy psycopg2-binary requests pydantic python-dotenv
   ```

4. **Set Up Database**
   ```bash
   # Create database
   createdb saafe_db
   
   # Run migrations (once you create them)
   npm run migrate  # or python manage.py migrate
   ```

5. **Start Development**
   ```bash
   npm run dev  # or python app.py
   ```

## Key Files to Create First

1. `src/config/database.ts` - Database connection
2. `src/services/auth/tspAuth.ts` - Authentication service
3. `src/database/migrations/001_initial_schema.sql` - All 7 tables
4. `.env.example` - Template for environment variables

## Testing Strategy

1. **Start with Postman**: Test Saafe APIs directly first
2. **Unit Tests**: Test individual functions
3. **Integration Tests**: Test full flows
4. **Webhook Testing**: Use webhook.site or ngrok for local testing

## Common Issues & Solutions

**Issue**: Webhook not receiving callbacks
- **Solution**: Use ngrok to expose local server, or deploy to a public URL

**Issue**: Token expired errors
- **Solution**: Check token refresh logic, ensure background job is running

**Issue**: Database connection errors
- **Solution**: Verify DATABASE_URL, check PostgreSQL is running

## Next Steps After Setup

1. ✅ Review API documentation thoroughly
2. ✅ Set up database schema
3. ✅ Implement authentication module
4. ✅ Test with Postman collection
5. ✅ Build consent generation
6. ✅ Continue with roadmap phases

---

**Tip**: Start small, test frequently, build incrementally! 🎯

