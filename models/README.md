# Models Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install mongoose dotenv
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and configure:

```env
MONGODB_URI=mongodb://localhost:27017/saafe_db
```

### 3. Connect to Database

```javascript
// server.js or app.js
require('dotenv').config();
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();
```

### 4. Use Models

```javascript
const { 
  TSPToken, 
  ConsentRequest, 
  WebhookEvent,
  TxnStatusHistory,
  Report,
  BSARun,
  Error
} = require('./models');

// Example: Create a consent request
const consent = await ConsentRequest.create({
  internal_user_id: 'user123',
  request_id: 1194,
  // ... other fields
});
```

## Model Relationships

```
TSPToken (1 active token at a time)
    ↓
    Used by all API calls

ConsentRequest
    ├──→ Has many TxnStatusHistory (via txn_id)
    ├──→ Has many WebhookEvent (via txn_id)
    ├──→ Has one Report (via txn_id)
    └──→ Can have many Error (via txn_id)

BSARun
    └──→ Can have many Error (via tracking_id)
```

## Common Queries

### Get Active Token
```javascript
const token = await TSPToken.getActiveToken();
```

### Find Pending Consents
```javascript
const pending = await ConsentRequest.find({
  status: 'PENDING'
});
```

### Find Consents Needing Polling
```javascript
const needsPolling = await ConsentRequest.find({
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

### Check Webhook Idempotency
```javascript
const isDuplicate = await WebhookEvent.isDuplicate(
  txnId, 
  consentStatus
);
```

### Get Status History
```javascript
const history = await TxnStatusHistory.find({ txn_id })
  .sort({ createdAt: -1 })
  .limit(50);
```

## Indexes

All models include optimized indexes for:
- Fast lookups by IDs
- Query performance on status fields
- Compound indexes for complex queries

See `SCHEMA_DOCUMENTATION.md` for detailed index information.

## Validation

Models include:
- ✅ Required field validation
- ✅ Enum validation for status fields
- ✅ Type validation
- ✅ Unique constraints where needed
- ✅ Custom validation methods

## Tips

1. **Always use transactions** for critical operations (if using replica sets)
2. **Use indexes** for frequently queried fields
3. **Handle null values** - Many fields are nullable
4. **Use virtual fields** - Like `isReadyForFIRequest` on ConsentRequest
5. **Check idempotency** - Before processing webhooks

## Testing

```javascript
// Example test
const { ConsentRequest } = require('./models');

describe('ConsentRequest', () => {
  beforeEach(async () => {
    // Clear test data
    await ConsentRequest.deleteMany({});
  });

  it('should create consent request', async () => {
    const consent = await ConsentRequest.create({
      // test data
    });
    expect(consent._id).toBeDefined();
  });
});
```

## Troubleshooting

**Connection Error**:
- Check MongoDB is running
- Verify MONGODB_URI in .env
- Check network/firewall settings

**Validation Error**:
- Check required fields
- Verify enum values match allowed options
- Ensure correct data types

**Index Error**:
- Drop and recreate indexes if needed
- Use `mongoose.connection.db.collection('collectionName').createIndex()`

