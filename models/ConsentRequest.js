const mongoose = require('mongoose');

/**
 * Consent Request Schema
 * Tracks all consent requests generated for customers
 */
const consentRequestSchema = new mongoose.Schema({
  internal_user_id: {
    type: String,
    required: true,
    index: true
  },
  request_id: {
    type: mongoose.Schema.Types.Mixed, // Can be number or string
    required: true,
    unique: true,
    index: true
  },
  txn_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  consent_handle: {
    type: String,
    required: true,
    index: true
  },
  consent_id: {
    type: String,
    default: null,
    index: true // Will be set when consent becomes ACTIVE
  },
  vua: {
    type: String, // Virtual User Account
    required: true
  },
  status: {
    type: String,
    required: true,
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
      'READY',
      'IN_PROGRESS'
    ],
    default: 'PENDING',
    index: true
  },
  report_generated: {
    type: Boolean,
    default: false,
    index: true
  },
  report_status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  report_type: {
    type: String,
    enum: ['JSON', 'XLSX'],
    default: null
  },
  report_stored_at: {
    type: Date,
    default: null
  },
  redirect_url: {
    type: String,
    required: true
  },
  customer_details: {
    type: mongoose.Schema.Types.Mixed, // JSONB equivalent
    required: true
  },
  consent_details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  raw_request: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  raw_response: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  last_webhook_received_at: {
    type: Date,
    default: null
  },
  fi_request_initiated: {
    type: Boolean,
    default: false
  },
  fi_request_initiated_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'aa_consent_requests'
});

// Compound indexes for common queries
consentRequestSchema.index({ status: 1, last_webhook_received_at: 1 }); // For polling job
consentRequestSchema.index({ internal_user_id: 1, createdAt: -1 }); // User's consent history
consentRequestSchema.index({ status: 1, report_generated: 1 }); // For report retrieval

// Virtual for checking if consent is ready for FI request
consentRequestSchema.virtual('isReadyForFIRequest').get(function() {
  return this.status === 'ACTIVE' && !this.fi_request_initiated;
});

// Virtual for checking if report can be retrieved
consentRequestSchema.virtual('isReadyForReport').get(function() {
  return this.status === 'READY' && this.report_generated === true;
});

module.exports = mongoose.model('ConsentRequest', consentRequestSchema);

