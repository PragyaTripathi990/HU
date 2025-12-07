const express = require('express');
const router = express.Router();
const consentService = require('../services/consent/consentService');
// CRITICAL: Import model directly (do not rely on mongoose.models)
const ConsentRequest = require('../models/ConsentRequest');

/**
 * POST /internal/aa/consents/initiate
 * Initiate a consent generation request
 */
router.post('/initiate', async (req, res) => {
  try {
    const {
      internal_user_id,
      mobile,
      email,
      dob,
      date_of_birth,
      pan,
      pan_number,
      customer_id,
      delivery_mode,
      fip_id,
      aa_id,
      fi_types,
      consent_start_date,
      consent_expiry_date,
      fi_datarange_unit,
      fi_datarange_value,
      fi_datarange_from,
      fi_datarange_to,
      purpose_code,
      consent_mode,
      consent_types,
      fetch_type,
      data_life_unit,
      data_life_value,
      frequency_unit,
      frequency_value,
      fair_use_id,
      txn_callback_url,
      consent_callback_url
    } = req.body;

    // Validate required fields
    if (!internal_user_id) {
      return res.status(400).json({
        success: false,
        error: 'internal_user_id is required'
      });
    }

    if (!mobile) {
      return res.status(400).json({
        success: false,
        error: 'mobile is required'
      });
    }

    if (!fi_types || !Array.isArray(fi_types) || fi_types.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'fi_types is required and must be a non-empty array'
      });
    }

    // Build input object for consent service
    const input = {
      internal_user_id,
      mobile,
      email,
      dob: dob || date_of_birth,
      pan: pan || pan_number,
      customer_id,
      delivery_mode,
      fip_id,
      aa_id,
      fi_types,
      consent_start_date,
      consent_expiry_date,
      fi_datarange_unit,
      fi_datarange_value,
      fi_datarange_from,
      fi_datarange_to,
      purpose_code,
      consent_mode,
      consent_types,
      fetch_type,
      data_life_unit,
      data_life_value,
      frequency_unit,
      frequency_value,
      fair_use_id,
      txn_callback_url,
      consent_callback_url
    };

    // Generate consent
    const result = await consentService.generateConsent(input);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Consent generated successfully',
        data: {
          consent_id: result.consent_id,
          request_id: result.request_id,
          txn_id: result.txn_id,
          consent_handle: result.consent_handle,
          vua: result.vua,
          redirect_url: result.redirect_url,
          status: 'PENDING'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Error in consent initiation:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

/**
 * GET /internal/aa/consents/request/:request_id
 * Get consent request by request_id
 * NOTE: This route must come before /recent to avoid route conflicts
 */
router.get('/request/:request_id', async (req, res) => {
  try {
    const { request_id } = req.params;
    
    // CRITICAL: Force conversion to Number to match the DB type
    const reqId = Number(req.params.request_id);
    
    // Verify it's a valid number before querying
    if (isNaN(reqId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Request ID"
      });
    }
    
    console.log(`📥 GET /internal/aa/consents/request/${request_id}`);
    console.log(`   Received request_id: "${request_id}" (Type: ${typeof request_id})`);
    console.log(`   Parsed as Number: ${reqId} (Type: ${typeof reqId})`);
    
    // CRITICAL: Log the specific query being made
    console.log(`🔍 Querying DB for:`, { request_id: reqId });

    const consent = await consentService.getConsentByRequestId(reqId);

    if (!consent) {
      console.log(`❌ Consent request not found for request_id: ${reqId}`);
      return res.status(404).json({
        success: false,
        error: 'Consent request not found'
      });
    }

    console.log(`✅ Found consent request: _id=${consent._id}, request_id=${consent.request_id}, status=${consent.status}`);
    
    return res.status(200).json({
      success: true,
      data: consent
    });
  } catch (error) {
    console.error('Error fetching consent by request_id:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /internal/aa/consents/recent
 * Get most recent consent request (for success page)
 * NOTE: Must come before /:id to avoid route conflicts
 */
router.get('/recent', async (req, res) => {
  try {
    const { internal_user_id } = req.query;
    
    console.log(`📥 GET /internal/aa/consents/recent${internal_user_id ? `?internal_user_id=${internal_user_id}` : ''}`);
    
    const consent = await consentService.getMostRecentConsent(internal_user_id);

    if (!consent) {
      return res.status(404).json({
        success: false,
        error: 'No consent request found'
      });
    }

    console.log(`✅ Found recent consent: request_id=${consent.request_id}, status=${consent.status}`);

    return res.status(200).json({
      success: true,
      data: consent
    });
  } catch (error) {
    console.error('Error fetching recent consent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /internal/aa/consents/:id
 * Get consent request by MongoDB ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const consent = await consentService.getConsentById(id);

    if (!consent) {
      return res.status(404).json({
        success: false,
        error: 'Consent request not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: consent
    });
  } catch (error) {
    console.error('Error fetching consent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /internal/aa/consents
 * Get all consent requests (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { status, internal_user_id, limit = 50, skip = 0 } = req.query;

    const { ConsentRequest } = require('../models');

    const query = {};
    if (status) {
      query.status = status;
    }
    if (internal_user_id) {
      query.internal_user_id = internal_user_id;
    }

    const consents = await ConsentRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ConsentRequest.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: consents,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Error fetching consents:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /internal/aa/consents/status-check
 * Check the status of a consent request by calling Saafe status-check API
 */
router.post('/status-check', async (req, res) => {
  try {
    const { request_id } = req.body;

    // Validate required fields
    if (!request_id) {
      return res.status(400).json({
        success: false,
        error: 'request_id is required'
      });
    }

    // Check status
    const result = await consentService.checkStatus(request_id);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Status check completed successfully',
        data: {
          request_id: result.request_id,
          consent_id: result.consent_id,
          consent_handle: result.consent_handle,
          consent_status: result.consent_status,
          report_generated: result.report_generated,
          txn_status: result.txn_status,
          status_history_count: result.status_history?.length || 0
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Error in status check:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

module.exports = router;

