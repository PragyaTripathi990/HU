const mongoose = require('mongoose');

/**
 * Report Schema
 * Stores financial reports retrieved from Saafe TSP
 */
const reportSchema = new mongoose.Schema({
  txn_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  internal_user_id: {
    type: String,
    index: true
  },
  request_id: {
    type: mongoose.Schema.Types.Mixed,
    index: true
  },
  consent_id: {
    type: String,
    index: true
  },
  report_type: {
    type: String,
    required: true,
    enum: ['JSON', 'XLSX'],
    index: true
  },
  json_data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
    // Stores full JSON report when report_type is JSON
  },
  report_data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
    // Alias for json_data for compatibility
  },
  file_path: {
    type: String,
    default: null
    // Local file path for XLSX files
  },
  file_url: {
    type: String,
    default: null
    // Cloud storage URL (S3, etc.) for XLSX files
  },
  file_size: {
    type: Number,
    default: null // Size in bytes
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  source_report_url: {
    type: String,
    default: null
    // Original URL from Saafe TSP
  },
  retrieved_at: {
    type: Date,
    default: null
  },
  error_message: {
    type: String,
    default: null
  },
  metadata: {
    start_date: String,
    end_date: String,
    duration_in_month: Number,
    report_fetch_time: String,
    report_fetch_type: String,
    source_of_data: String,
    statement_start_date: String,
    statement_end_date: String,
    multiple_accounts_found: String,
    fi_details: [mongoose.Schema.Types.Mixed]
  }
}, {
  timestamps: true,
  collection: 'aa_reports'
});

// Index for querying reports by status
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);

