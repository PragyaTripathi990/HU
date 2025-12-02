const mongoose = require('mongoose');

/**
 * Transaction Status History Schema
 * Tracks all status changes for consent requests
 */
const txnStatusHistorySchema = new mongoose.Schema({
  txn_id: {
    type: String,
    required: true,
    index: true
  },
  request_id: {
    type: mongoose.Schema.Types.Mixed,
    index: true
  },
  consent_id: {
    type: String,
    default: null,
    index: true
  },
  status_code: {
    type: String,
    required: true,
    index: true
    // Examples: 'TxnProcessing', 'ReportGenerated', 'ConsentRejected', etc.
  },
  status_message: {
    type: String,
    required: true
  },
  consent_status: {
    type: String,
    enum: [
      'PENDING',
      'ACTIVE',
      'REJECTED',
      'REVOKED',
      'PAUSED',
      'FAILED',
      'EXPIRED',
      'DENIED',
      'TIMEOUT',
      'READY'
    ],
    default: null,
    index: true
  },
  source: {
    type: String,
    required: true,
    enum: ['WEBHOOK', 'POLL'],
    index: true
  },
  raw_payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'aa_txn_status_history'
});

// Compound index for querying status history by transaction
txnStatusHistorySchema.index({ txn_id: 1, createdAt: -1 });
txnStatusHistorySchema.index({ request_id: 1, createdAt: -1 });

module.exports = mongoose.model('TxnStatusHistory', txnStatusHistorySchema);

