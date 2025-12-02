const mongoose = require('mongoose');

/**
 * TSP Token Schema
 * Stores access and refresh tokens for Saafe TSP API authentication
 * Only one active token set should exist at a time
 */
const tspTokenSchema = new mongoose.Schema({
  access_token: {
    type: String,
    required: true,
    index: true
  },
  refresh_token: {
    type: String,
    required: true
  },
  token_type: {
    type: String,
    default: 'bearer',
    enum: ['bearer']
  },
  fiu_id: {
    type: String,
    required: true,
    index: true
  },
  expires_at: {
    type: Date,
    required: true,
    index: true // Index for quick expiry checks
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'aa_tsp_tokens'
});

// Index for finding active tokens quickly
tspTokenSchema.index({ is_active: 1, expires_at: 1 });

// Method to check if token is expired
tspTokenSchema.methods.isExpired = function() {
  return new Date() >= this.expires_at;
};

// Method to check if token is about to expire (within 5 minutes)
tspTokenSchema.methods.isExpiringSoon = function(minutes = 5) {
  const expiryTime = new Date(this.expires_at);
  const threshold = new Date(Date.now() + minutes * 60 * 1000);
  return expiryTime <= threshold;
};

// Static method to get active token
tspTokenSchema.statics.getActiveToken = async function() {
  return await this.findOne({ is_active: true }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('TSPToken', tspTokenSchema);

