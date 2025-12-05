const { ConsentRequest, WebhookEvent } = require('../../models');

/**
 * Webhook Service
 * Handles webhook notifications from Saafe TSP
 * Updates consent request status based on webhook payloads
 */
class WebhookService {
  /**
   * Map Saafe consent status to our internal status
   */
  mapConsentStatus(saafeStatus) {
    const statusMap = {
      'ACTIVE': 'ACTIVE',
      'REJECTED': 'REJECTED',
      'REVOKED': 'REVOKED',
      'PAUSED': 'PAUSED',
      'EXPIRED': 'EXPIRED',
      'DENIED': 'DENIED',
      'TIMEOUT': 'TIMEOUT',
      'READY': 'READY',
      'TxnProcessing': 'IN_PROGRESS',
      'ReportGenerated': 'READY'
    };
    
    return statusMap[saafeStatus] || null;
  }

  /**
   * Handle transaction webhook (POST /webhooks/aa/txn)
   * Updates consent request status based on webhook payload
   */
  async handleTxnWebhook(payload) {
    try {
      console.log('📥 Received transaction webhook');
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));

      // Extract identifiers for idempotency check
      const txnId = payload.txn_id || payload.data?.txn_id;
      const data = payload.data || payload;
      const consentStatus = data.consent_status || data.status || payload.status;

      // Check for duplicate webhook (idempotency)
      if (txnId && consentStatus) {
        const isDuplicate = await WebhookEvent.isDuplicate(txnId, consentStatus);
        if (isDuplicate) {
          console.log('⚠️ Duplicate webhook detected, skipping processing');
          return {
            success: true,
            message: 'Webhook already processed (idempotent)',
            duplicate: true
          };
        }
      }

      // Log webhook event
      await WebhookEvent.create({
        event_type: 'TXN_STATUS',
        txn_id: txnId || null,
        request_id: payload.request_id || payload.data?.request_id || null,
        consent_handle: payload.consent_handle || payload.data?.consent_handle || null,
        payload: payload,
        processed: false
      });

      // Extract identifiers from payload (already extracted above for idempotency)
      const consentHandle = payload.consent_handle || payload.data?.consent_handle;
      const requestId = payload.request_id || payload.data?.request_id;

      if (!txnId && !consentHandle && !requestId) {
        throw new Error('Missing required identifiers: txn_id, consent_handle, or request_id');
      }

      // Find consent request by txn_id, consent_handle, or request_id
      let consentRequest = null;
      
      if (txnId) {
        consentRequest = await ConsentRequest.findOne({ txn_id: txnId });
      }
      
      if (!consentRequest && consentHandle) {
        consentRequest = await ConsentRequest.findOne({ consent_handle: consentHandle });
      }
      
      if (!consentRequest && requestId) {
        consentRequest = await ConsentRequest.findOne({ request_id: requestId });
      }

      if (!consentRequest) {
        console.warn('⚠️ Consent request not found for webhook:', { txnId, consentHandle, requestId });
        return {
          success: false,
          error: 'Consent request not found',
          details: { txnId, consentHandle, requestId }
        };
      }

      console.log(`✅ Found consent request: ${consentRequest._id}`);

      // Extract status information (consentStatus already extracted above)
      const consentId = data.consent_id;
      const reportGenerated = data.report_generated === true || data.report_generated === 'true';

      // Map status
      const mappedStatus = this.mapConsentStatus(consentStatus);
      
      if (!mappedStatus && consentStatus) {
        console.warn(`⚠️ Unknown consent status: ${consentStatus}`);
      }

      // Prepare update data
      const updateData = {
        last_webhook_received_at: new Date()
      };

      // Update status if mapped
      if (mappedStatus && consentRequest.status !== mappedStatus) {
        updateData.status = mappedStatus;
        console.log(`🔄 Updating status: ${consentRequest.status} → ${mappedStatus}`);
      }

      // Update consent_id if ACTIVE and consent_id is provided
      if (mappedStatus === 'ACTIVE' && consentId && !consentRequest.consent_id) {
        updateData.consent_id = consentId;
        console.log(`✅ Setting consent_id: ${consentId}`);
      }

      // Update report_generated flag
      if (reportGenerated && !consentRequest.report_generated) {
        updateData.report_generated = true;
        updateData.report_status = 'COMPLETED';
        console.log('📊 Report generated flag set to true');
      }

      // Update consent request
      if (Object.keys(updateData).length > 1) { // More than just last_webhook_received_at
        await ConsentRequest.findByIdAndUpdate(
          consentRequest._id,
          { $set: updateData },
          { new: true }
        );
        console.log('💾 Consent request updated in database');
      }

      // Mark webhook as processed
      await WebhookEvent.updateOne(
        { txn_id: txnId || consentRequest.txn_id },
        { 
          $set: { 
            processed: true, 
            processed_at: new Date() 
          } 
        },
        { sort: { createdAt: -1 } } // Update most recent
      );

      return {
        success: true,
        consent_id: consentRequest._id,
        status: mappedStatus || consentRequest.status,
        consent_id_set: !!updateData.consent_id,
        message: 'Webhook processed successfully'
      };

    } catch (error) {
      console.error('❌ Error processing transaction webhook:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Log error in webhook event if we have txn_id
      try {
        const txnId = payload.txn_id || payload.data?.txn_id;
        if (txnId) {
          await WebhookEvent.updateOne(
            { txn_id: txnId },
            { 
              $set: { 
                processed: true,
                processed_at: new Date(),
                processing_error: error.message
              } 
            },
            { sort: { createdAt: -1 } }
          );
        }
      } catch (logError) {
        console.error('❌ Failed to log webhook error:', logError.message);
      }

      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }

  /**
   * Handle consent webhook (POST /webhooks/aa/consent)
   * Handles consent-specific status updates (PAUSED, REVOKED, etc.)
   */
  async handleConsentWebhook(payload) {
    try {
      console.log('📥 Received consent webhook');
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));

      // Extract identifiers for idempotency check
      const txnId = payload.txn_id || payload.data?.txn_id;
      const data = payload.data || payload;
      const consentStatus = data.consent_status || data.status || payload.status;

      // Check for duplicate webhook (idempotency)
      if (txnId && consentStatus) {
        const isDuplicate = await WebhookEvent.isDuplicate(txnId, consentStatus);
        if (isDuplicate) {
          console.log('⚠️ Duplicate webhook detected, skipping processing');
          return {
            success: true,
            message: 'Webhook already processed (idempotent)',
            duplicate: true
          };
        }
      }

      // Log webhook event
      await WebhookEvent.create({
        event_type: 'CONSENT_STATUS',
        txn_id: txnId || null,
        request_id: payload.request_id || payload.data?.request_id || null,
        consent_handle: payload.consent_handle || payload.data?.consent_handle || null,
        payload: payload,
        processed: false
      });

      // Extract identifiers
      const consentHandle = payload.consent_handle || payload.data?.consent_handle;
      const requestId = payload.request_id || payload.data?.request_id;

      if (!txnId && !consentHandle && !requestId) {
        throw new Error('Missing required identifiers: txn_id, consent_handle, or request_id');
      }

      // Find consent request
      let consentRequest = null;
      
      if (txnId) {
        consentRequest = await ConsentRequest.findOne({ txn_id: txnId });
      }
      
      if (!consentRequest && consentHandle) {
        consentRequest = await ConsentRequest.findOne({ consent_handle: consentHandle });
      }
      
      if (!consentRequest && requestId) {
        consentRequest = await ConsentRequest.findOne({ request_id: requestId });
      }

      if (!consentRequest) {
        console.warn('⚠️ Consent request not found for webhook:', { txnId, consentHandle, requestId });
        return {
          success: false,
          error: 'Consent request not found',
          details: { txnId, consentHandle, requestId }
        };
      }

      // Extract status (consentStatus already extracted above for idempotency check)
      const mappedStatus = this.mapConsentStatus(consentStatus);

      if (!mappedStatus && consentStatus) {
        console.warn(`⚠️ Unknown consent status: ${consentStatus}`);
      }

      // Update consent request
      const updateData = {
        last_webhook_received_at: new Date()
      };

      if (mappedStatus && consentRequest.status !== mappedStatus) {
        updateData.status = mappedStatus;
        console.log(`🔄 Updating status: ${consentRequest.status} → ${mappedStatus}`);
      }

      if (Object.keys(updateData).length > 1) {
        await ConsentRequest.findByIdAndUpdate(
          consentRequest._id,
          { $set: updateData },
          { new: true }
        );
        console.log('💾 Consent request updated in database');
      }

      // Mark webhook as processed
      await WebhookEvent.updateOne(
        { txn_id: txnId || consentRequest.txn_id },
        { 
          $set: { 
            processed: true, 
            processed_at: new Date() 
          } 
        },
        { sort: { createdAt: -1 } }
      );

      return {
        success: true,
        consent_id: consentRequest._id,
        status: mappedStatus || consentRequest.status,
        message: 'Consent webhook processed successfully'
      };

    } catch (error) {
      console.error('❌ Error processing consent webhook:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }
}

// Export singleton instance
module.exports = new WebhookService();

