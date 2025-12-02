const mongoose = require('mongoose');

/**
 * Error Schema
 * Centralized error logging and categorization
 */
const errorSchema = new mongoose.Schema({
  context: {
    type: String,
    required: true,
    enum: ['LOGIN', 'CONSENT', 'FI_REQUEST', 'RETRIEVE_REPORT', 'BSA', 'REFRESH_TOKEN', 'STATUS_CHECK'],
    index: true
  },
  txn_id: {
    type: String,
    index: true,
    sparse: true
  },
  request_id: {
    type: mongoose.Schema.Types.Mixed,
    index: true,
    sparse: true
  },
  tracking_id: {
    type: String,
    index: true,
    sparse: true
  },
  error_category: {
    type: String,
    required: true,
    enum: [
      'INPUT_VALIDATION',
      'AA_RESPONSE_VALIDATION',
      'CONSENT_ISSUES',
      'INFRA_NETWORK',
      'AUTHENTICATION',
      'TIMEOUT',
      'UNKNOWN'
    ],
    index: true
  },
  error_message: {
    type: String,
    required: true
  },
  error_code: {
    type: String,
    default: null
  },
  http_status_code: {
    type: Number,
    default: null
  },
  raw_response: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  raw_request: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  retry_count: {
    type: Number,
    default: 0
  },
  is_retryable: {
    type: Boolean,
    default: false,
    index: true
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolved_at: {
    type: Date,
    default: null
  },
  stack_trace: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'aa_errors'
});

// Compound indexes for common error queries
errorSchema.index({ context: 1, createdAt: -1 });
errorSchema.index({ error_category: 1, resolved: 1, createdAt: -1 });
errorSchema.index({ txn_id: 1, createdAt: -1 });
errorSchema.index({ is_retryable: 1, resolved: 1, createdAt: -1 }); // For retry jobs

module.exports = mongoose.model('Error', errorSchema);

