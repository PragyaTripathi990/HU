const express = require('express');
const router = express.Router();
const fiRequestService = require('../services/fi/fiRequestService');

/**
 * POST /internal/aa/transactions/:txn_id/fi-request
 * Trigger FI data request for a consent using txn_id
 */
router.post('/:txn_id/fi-request', async (req, res) => {
  try {
    const { txn_id } = req.params;
    const { from, to, txn_callback_url } = req.body;

    // Validate txn_id
    if (!txn_id) {
      return res.status(400).json({
        success: false,
        error: 'txn_id is required in URL path'
      });
    }

    // Trigger FI request
    const result = await fiRequestService.triggerFIRequestByTxnId(txn_id, {
      from,
      to,
      txn_callback_url
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'FI request initiated successfully',
        data: {
          session_id: result.session_id,
          txn_id: result.txn_id,
          consent_id: result.consent_id,
          ver: result.ver,
          timestamp: result.timestamp,
          response: result.response
        }
      });
    } else {
      // Determine HTTP status based on error category
      const statusCode = result.error_category === 'INPUT_VALIDATION' 
        ? 400 
        : result.error_category === 'CONSENT_ISSUES'
        ? 400
        : result.error_category === 'INFRA_NETWORK'
        ? 503
        : 400;

      return res.status(statusCode).json({
        success: false,
        error: result.error,
        error_category: result.error_category,
        retry_recommended: result.retry_recommended || false,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Error in FI request:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

/**
 * POST /internal/aa/transactions/fi-request
 * Trigger FI data request for a consent using consent_id
 */
router.post('/fi-request', async (req, res) => {
  try {
    const { consent_id, from, to, txn_callback_url } = req.body;

    // Validate consent_id
    if (!consent_id) {
      return res.status(400).json({
        success: false,
        error: 'consent_id is required'
      });
    }

    // Trigger FI request
    const result = await fiRequestService.triggerFIRequest(consent_id, {
      from,
      to,
      txn_callback_url
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'FI request initiated successfully',
        data: {
          session_id: result.session_id,
          txn_id: result.txn_id,
          consent_id: result.consent_id,
          ver: result.ver,
          timestamp: result.timestamp,
          response: result.response
        }
      });
    } else {
      // Determine HTTP status based on error category
      const statusCode = result.error_category === 'INPUT_VALIDATION' 
        ? 400 
        : result.error_category === 'CONSENT_ISSUES'
        ? 400
        : result.error_category === 'INFRA_NETWORK'
        ? 503
        : 400;

      return res.status(statusCode).json({
        success: false,
        error: result.error,
        error_category: result.error_category,
        retry_recommended: result.retry_recommended || false,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Error in FI request:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

module.exports = router;

