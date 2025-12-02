# 📊 Database Schema Documentation

## Overview

This project uses **MongoDB** with **Mongoose** ODM for the MERN stack. All schemas are designed to match the requirements while leveraging MongoDB's flexible document structure.

## 📁 Models Structure

```
models/
├── index.js              # Central export
├── TSPToken.js           # Authentication tokens
├── ConsentRequest.js     # Consent tracking
├── WebhookEvent.js       # Webhook logs
├── TxnStatusHistory.js   # Status history
├── Report.js             # Financial reports
├── BSARun.js             # BSA analysis
└── Error.js              # Error logging
```

## 🔑 Model Details

### 1. TSPToken (`aa_tsp_tokens`)

**Purpose**: Store authentication tokens for Saafe TSP API

**Key Fields**:
- `access_token` (String, indexed) - JWT access token
- `refresh_token` (String) - Token for refreshing access
- `token_type` (String) - Always "bearer"
- `fiu_id` (String, indexed) - Financial Information User ID
- `expires_at` (Date, indexed) - Token expiration time
- `is_active` (Boolean, indexed) - Active token flag

**Indexes**:
- `access_token`
- `is_active + expires_at` (compound)
- `fiu_id`

**Methods**:
- `isExpired()` - Check if token is expired
- `isExpiringSoon(minutes)` - Check if expiring within N minutes
- `getActiveToken()` (static) - Get currently active token

**Usage**:
```javascript
const { TSPToken } = require('./models');

// Get active token
const token = await TSPToken.getActiveToken();

// Check if expiring soon
if (token && token.isExpiringSoon(5)) {
  // Refresh token
}
```

---

### 2. ConsentRequest (`aa_consent_requests`)

**Purpose**: Track all consent requests and their lifecycle

**Key Fields**:
- `internal_user_id` (String, indexed) - Your system's user ID
- `request_id` (Mixed, unique, indexed) - Saafe's request ID
- `txn_id` (String, unique, indexed) - Transaction ID
- `consent_handle` (String, indexed) - Consent handle from Saafe
- `consent_id` (String, indexed, nullable) - Set when ACTIVE
- `vua` (String) - Virtual User Account
- `status` (String, enum, indexed) - Current status
- `report_generated` (Boolean, indexed) - Report ready flag
- `redirect_url` (String) - URL for customer consent

**Status Values**:
```
PENDING, ACTIVE, REJECTED, REVOKED, PAUSED, FAILED, 
EXPIRED, DENIED, TIMEOUT, READY, IN_PROGRESS
```

**Indexes**:
- `request_id` (unique)
- `txn_id` (unique)
- `status + last_webhook_received_at` (compound) - For polling
- `internal_user_id + createdAt` (compound) - User history
- `status + report_generated` (compound) - For report retrieval

**Virtual Fields**:
- `isReadyForFIRequest` - Check if ready to request FI data
- `isReadyForReport` - Check if report can be retrieved

**Usage**:
```javascript
const { ConsentRequest } = require('./models');

// Find consents needing polling
const pending = await ConsentRequest.find({
  status: { $in: ['PENDING', 'IN_PROGRESS'] },
  last_webhook_received_at: { 
    $lt: new Date(Date.now() - 15 * 60 * 1000) 
  }
});
```

---

### 3. WebhookEvent (`aa_webhook_events`)

**Purpose**: Log all webhook events for audit and idempotency

**Key Fields**:
- `event_type` (String, enum, indexed) - Type of webhook
- `txn_id` (String, indexed) - Transaction ID
- `request_id` (Mixed, indexed) - Request ID
- `payload` (Mixed) - Full webhook payload
- `processed` (Boolean, indexed) - Processing status
- `idempotency_key` (String, indexed, sparse) - Duplicate prevention

**Event Types**:
```
CONSENT_STATUS, TXN_STATUS, BSA_STATUS
```

**Indexes**:
- `processed + createdAt` (compound) - Unprocessed events
- `txn_id + event_type + createdAt` (compound) - History
- `idempotency_key` (sparse)

**Methods**:
- `isDuplicate(txnId, consentStatus)` (static) - Check for duplicates

**Usage**:
```javascript
const { WebhookEvent } = require('./models');

// Check idempotency
const isDup = await WebhookEvent.isDuplicate(txnId, consentStatus);
if (!isDup) {
  // Process webhook
}
```

---

### 4. TxnStatusHistory (`aa_txn_status_history`)

**Purpose**: Track all status changes for audit trail

**Key Fields**:
- `txn_id` (String, indexed) - Transaction ID
- `status_code` (String, indexed) - Status code from API
- `status_message` (String) - Human-readable message
- `consent_status` (String, enum, indexed) - Normalized status
- `source` (String, enum) - WEBHOOK or POLL
- `raw_payload` (Mixed) - Original response

**Status Codes** (examples):
```
TxnProcessing, ReportGenerated, ConsentRejected, 
ConsentRevoked, ConsentPaused
```

**Indexes**:
- `txn_id + createdAt` (compound) - Transaction history
- `request_id + createdAt` (compound) - Request history

**Usage**:
```javascript
const { TxnStatusHistory } = require('./models');

// Get status history for transaction
const history = await TxnStatusHistory.find({ txn_id })
  .sort({ createdAt: -1 });
```

---

### 5. Report (`aa_reports`)

**Purpose**: Store retrieved financial reports

**Key Fields**:
- `txn_id` (String, unique, indexed) - Transaction ID
- `report_type` (String, enum, indexed) - JSON or XLSX
- `json_data` (Mixed, nullable) - JSON report data
- `file_path` (String, nullable) - Local file path (XLSX)
- `file_url` (String, nullable) - Cloud storage URL (XLSX)
- `status` (String, enum, indexed) - Report status
- `source_report_url` (String) - Original Saafe URL

**Indexes**:
- `txn_id` (unique)
- `status + createdAt` (compound)

**Usage**:
```javascript
const { Report } = require('./models');

// Store JSON report
await Report.create({
  txn_id: '...',
  report_type: 'JSON',
  json_data: { /* report data */ },
  status: 'COMPLETED'
});
```

---

### 6. BSARun (`aa_bsa_runs`)

**Purpose**: Track Bank Statement Analysis processing

**Key Fields**:
- `tracking_id` (String, unique, indexed) - UUID for tracking
- `status` (String, enum, indexed) - Current status
- `xlsx_docs_url` (String, nullable) - Download URL
- `json_docs_url` (String, nullable) - Download URL
- `xlsx_file_path` (String, nullable) - Local storage
- `json_file_path` (String, nullable) - Local storage

**Status Values**:
```
INITIATED, COMPLETED, FAILED, ERRORED, FETCH_ERRORED, 
PURGED, INITIATION_FAILED, IN_PROGRESS
```

**Indexes**:
- `tracking_id` (unique)
- `status + updatedAt` (compound) - For polling
- `status + initiated_at` (compound)

**Virtual Fields**:
- `isTerminal` - Check if in final state

**Usage**:
```javascript
const { BSARun } = require('./models');

// Find in-progress BSA runs for polling
const inProgress = await BSARun.find({
  status: { $in: ['INITIATED', 'IN_PROGRESS'] }
});
```

---

### 7. Error (`aa_errors`)

**Purpose**: Centralized error logging and categorization

**Key Fields**:
- `context` (String, enum, indexed) - Where error occurred
- `txn_id` (String, indexed, sparse) - Related transaction
- `error_category` (String, enum, indexed) - Error type
- `error_message` (String) - Error description
- `is_retryable` (Boolean, indexed) - Can retry?
- `retry_count` (Number) - Number of retries
- `raw_response` (Mixed) - Original error response

**Error Categories**:
```
INPUT_VALIDATION, AA_RESPONSE_VALIDATION, CONSENT_ISSUES,
INFRA_NETWORK, AUTHENTICATION, TIMEOUT, UNKNOWN
```

**Indexes**:
- `context + createdAt` (compound)
- `error_category + resolved + createdAt` (compound)
- `is_retryable + resolved + createdAt` (compound) - For retry jobs

**Usage**:
```javascript
const { Error } = require('./models');

// Log error
await Error.create({
  context: 'FI_REQUEST',
  txn_id: '...',
  error_category: 'INFRA_NETWORK',
  error_message: 'Connection timeout',
  is_retryable: true
});
```

---

## 🔗 Relationships

### Implicit Relationships (via IDs)

```
ConsentRequest
  ├──→ TxnStatusHistory (via txn_id)
  ├──→ WebhookEvent (via txn_id)
  ├──→ Report (via txn_id)
  └──→ Error (via txn_id)

BSARun
  └──→ Error (via tracking_id)

TSPToken
  └──→ (Standalone, only one active at a time)
```

**Note**: MongoDB doesn't enforce foreign keys. Maintain referential integrity in your application logic.

---

## 📝 Index Strategy

### Why These Indexes?

1. **Query Performance**: Indexes on frequently queried fields
2. **Unique Constraints**: Prevent duplicates (request_id, txn_id, tracking_id)
3. **Compound Indexes**: Optimize complex queries (status + timestamp)
4. **Sparse Indexes**: Index only non-null values (idempotency_key)

### Index Maintenance

- MongoDB automatically maintains indexes
- Monitor index usage with `explain()` queries
- Consider adding indexes based on query patterns

---

## 🚀 Usage Examples

### 1. Initialize Database

```javascript
// config/database.js
const connectDB = require('./config/database');
await connectDB();
```

### 2. Create Consent Request

```javascript
const { ConsentRequest } = require('./models');

const consent = await ConsentRequest.create({
  internal_user_id: 'user123',
  request_id: 1194,
  txn_id: 'd2bb28e7-...',
  consent_handle: '1130468f-...',
  vua: '9898989898@dashboard-aa',
  status: 'PENDING',
  customer_details: { /* ... */ },
  consent_details: [ /* ... */ ],
  raw_request: { /* ... */ },
  raw_response: { /* ... */ },
  redirect_url: 'https://...'
});
```

### 3. Update Consent Status

```javascript
await ConsentRequest.findOneAndUpdate(
  { txn_id: 'd2bb28e7-...' },
  {
    status: 'ACTIVE',
    consent_id: 'consent_id_12345',
    last_webhook_received_at: new Date()
  },
  { new: true }
);
```

### 4. Query Pending Consents for Polling

```javascript
const pendingConsents = await ConsentRequest.find({
  status: { $in: ['PENDING', 'IN_PROGRESS'] },
  $or: [
    { last_webhook_received_at: null },
    { last_webhook_received_at: { 
        $lt: new Date(Date.now() - 15 * 60 * 1000) 
      }
    }
  ]
});
```

### 5. Store Webhook Event

```javascript
const { WebhookEvent } = require('./models');

const webhook = await WebhookEvent.create({
  event_type: 'TXN_STATUS',
  txn_id: 'd2bb28e7-...',
  request_id: 1194,
  payload: { /* webhook payload */ },
  processed: false
});

// Generate idempotency key (auto in pre-save hook)
```

---

## 🔒 Data Validation

All schemas include:
- **Required fields** - Enforced by Mongoose
- **Enum validation** - Restricted values
- **Type validation** - Automatic type checking
- **Indexes** - Performance and uniqueness

---

## 📦 Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/saafe_db
# OR
DATABASE_URL=mongodb://localhost:27017/saafe_db
```

---

## 🧪 Testing Schemas

```javascript
// Example test structure
const { ConsentRequest } = require('./models');

describe('ConsentRequest Model', () => {
  it('should create consent request', async () => {
    const consent = await ConsentRequest.create({
      // ... test data
    });
    expect(consent._id).toBeDefined();
  });
});
```

---

## 📚 Additional Resources

- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Indexes](https://docs.mongodb.com/manual/indexes/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)

---

**Last Updated**: Schema v1.0 for MERN Stack

