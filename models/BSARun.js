const mongoose = require('mongoose');

/**
 * BSA (Bank Statement Analysis) Run Schema
 * Tracks BSA analysis requests and their status
 */
const bsaRunSchema = new mongoose.Schema({
  tracking_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: [
      'INITIATED',
      'COMPLETED',
      'FAILED',
      'ERRORED',
      'FETCH_ERRORED',
      'PURGED',
      'INITIATION_FAILED',
      'IN_PROGRESS'
    ],
    default: 'INITIATED',
    index: true
  },
  xlsx_docs_url: {
    type: String,
    default: null
  },
  json_docs_url: {
    type: String,
    default: null
  },
  // Store downloaded files locally
  xlsx_file_path: {
    type: String,
    default: null
  },
  json_file_path: {
    type: String,
    default: null
  },
  webhook_url: {
    type: String,
    required: true
  },
  file_count: {
    type: Number,
    default: 1 // Number of PDFs uploaded
  },
  raw_last_response: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  initiated_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date,
    default: null
  },
  error_message: {
    type: String,
    default: null
  },
  // Store original request details
  request_metadata: {
    consent_flag: Boolean,
    file_names: [String],
    has_password: Boolean
  }
}, {
  timestamps: true,
  collection: 'aa_bsa_runs'
});

// Index for polling job to find in-progress BSA runs
bsaRunSchema.index({ status: 1, updatedAt: 1 });
bsaRunSchema.index({ status: 1, initiated_at: 1 });

// Virtual to check if BSA is in terminal state
bsaRunSchema.virtual('isTerminal').get(function() {
  return ['COMPLETED', 'FAILED', 'ERRORED', 'FETCH_ERRORED', 'PURGED', 'INITIATION_FAILED'].includes(this.status);
});

module.exports = mongoose.model('BSARun', bsaRunSchema);

