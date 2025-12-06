const express = require('express');
const router = express.Router();
const fiRequestService = require('../services/fi/fiRequestService');

/**
 * POST /internal/aa/fi/fetch
 * Simplified endpoint for dashboard to fetch FI data
 */
router.post('/fetch', async (req, res) => {
  try {
    const { consent_id, request_id } = req.body;

    // Validate consent_id
    if (!consent_id) {
      return res.status(400).json({
        success: false,
        error: 'consent_id is required'
      });
    }

    // Trigger FI request
    const result = await fiRequestService.triggerFIRequest(consent_id, {
      // Use default date range if not provided
      from: req.body.from,
      to: req.body.to,
      txn_callback_url: req.body.txn_callback_url
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'FI request initiated successfully',
        data: {
          txn_id: result.txn_id,
          session_id: result.session_id,
          consent_id: result.consent_id
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        error_category: result.error_category,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Error in FI fetch:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

module.exports = router;

