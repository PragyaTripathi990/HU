const mongoose = require('mongoose');

/**
 * Webhook Event Schema
 * Logs all webhook events received from Saafe TSP
 */
const webhookEventSchema = new mongoose.Schema({
  event_type: {
    type: String,
    required: true,
    enum: ['CONSENT_STATUS', 'TXN_STATUS', 'BSA_STATUS'],
    index: true
  },
  txn_id: {
    type: String,
    required: true,
    index: true
  },
  request_id: {
    type: mongoose.Schema.Types.Mixed,
    index: true
  },
  consent_handle: {
    type: String,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  processed_at: {
    type: Date,
    default: null
  },
  processing_error: {
    type: String,
    default: null
  },
  // Idempotency key: combination of txn_id and consent_status
  idempotency_key: {
    type: String,
    index: true,
    sparse: true // Allows null values but indexes non-null
  }
}, {
  timestamps: true,
  collection: 'aa_webhook_events'
});

// Compound index for finding unprocessed webhooks
webhookEventSchema.index({ processed: 1, createdAt: -1 });
webhookEventSchema.index({ txn_id: 1, event_type: 1, createdAt: -1 }); // For history

// Pre-save hook to generate idempotency key
webhookEventSchema.pre('save', function(next) {
  if (this.payload && this.payload.data) {
    const consentStatus = this.payload.data.consent_status;
    if (consentStatus && this.txn_id) {
      this.idempotency_key = `${this.txn_id}_${consentStatus}`;
    }
  }
  next();
});

// Static method to check if webhook already processed (idempotency)
webhookEventSchema.statics.isDuplicate = async function(txnId, consentStatus) {
  if (!consentStatus) return false;
  const idempotencyKey = `${txnId}_${consentStatus}`;
  const existing = await this.findOne({ 
    idempotency_key: idempotencyKey,
    processed: true
  });
  return !!existing;
};

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);

