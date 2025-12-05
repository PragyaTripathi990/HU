const express = require('express');
const router = express.Router();
const webhookService = require('../services/webhook/webhookService');

/**
 * POST /webhooks/aa/txn
 * Transaction status webhook from Saafe
 * Handles consent status updates (ACTIVE, REJECTED, REVOKED, etc.)
 */
router.post('/aa/txn', async (req, res) => {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('📥 Transaction Webhook Received');
    console.log('='.repeat(70));

    const payload = req.body;

    // Validate payload
    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing webhook payload'
      });
    }

    // Process webhook
    const result = await webhookService.handleTxnWebhook(payload);

    if (result.success) {
      console.log('✅ Webhook processed successfully');
      console.log(`   Status: ${result.status}`);
      console.log(`   Consent ID set: ${result.consent_id_set || false}`);
      console.log('='.repeat(70) + '\n');

      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        data: {
          consent_id: result.consent_id,
          status: result.status,
          consent_id_set: result.consent_id_set
        }
      });
    } else {
      console.error('❌ Webhook processing failed:', result.error);
      console.log('='.repeat(70) + '\n');

      // Still return 200 to Saafe (webhook received)
      // But log the error for investigation
      return res.status(200).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('❌ Error in transaction webhook handler:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.log('='.repeat(70) + '\n');

    // Return 200 to Saafe (webhook received, but log error)
    return res.status(200).json({
      success: false,
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

/**
 * POST /webhooks/aa/consent
 * Consent status webhook from Saafe
 * Handles consent-specific updates (PAUSED, REVOKED, etc.)
 */
router.post('/aa/consent', async (req, res) => {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('📥 Consent Webhook Received');
    console.log('='.repeat(70));

    const payload = req.body;

    // Validate payload
    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing webhook payload'
      });
    }

    // Process webhook
    const result = await webhookService.handleConsentWebhook(payload);

    if (result.success) {
      console.log('✅ Webhook processed successfully');
      console.log(`   Status: ${result.status}`);
      console.log('='.repeat(70) + '\n');

      return res.status(200).json({
        success: true,
        message: 'Consent webhook processed successfully',
        data: {
          consent_id: result.consent_id,
          status: result.status
        }
      });
    } else {
      console.error('❌ Webhook processing failed:', result.error);
      console.log('='.repeat(70) + '\n');

      // Still return 200 to Saafe (webhook received)
      return res.status(200).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('❌ Error in consent webhook handler:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.log('='.repeat(70) + '\n');

    // Return 200 to Saafe (webhook received, but log error)
    return res.status(200).json({
      success: false,
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

module.exports = router;

