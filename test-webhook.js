/**
 * Test Webhook Endpoints
 * Simulates webhook payloads from Saafe
 * Run: node test-webhook.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test payloads
const testPayloads = {
  // ACTIVE status webhook
  active: {
    txn_id: "test-txn-id-123",
    status: "success",
    data: {
      consent_handle: "test-consent-handle-123",
      consent_id: "VALID_CONSENT_ID_HERE",
      consent_status: "ACTIVE"
    }
  },

  // REJECTED status webhook
  rejected: {
    txn_id: "test-txn-id-123",
    status: "error",
    data: {
      consent_handle: "test-consent-handle-123",
      consent_status: "REJECTED"
    }
  },

  // REVOKED status webhook
  revoked: {
    txn_id: "test-txn-id-123",
    status: "success",
    data: {
      consent_handle: "test-consent-handle-123",
      consent_status: "REVOKED"
    }
  },

  // READY status (report generated)
  ready: {
    txn_id: "test-txn-id-123",
    status: "success",
    data: {
      consent_handle: "test-consent-handle-123",
      consent_status: "READY",
      report_generated: true
    }
  }
};

async function testWebhook(type, payload) {
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 Testing ${type.toUpperCase()} Webhook`);
    console.log('='.repeat(70));
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));
    console.log('\n📤 Sending to:', `${BASE_URL}/webhooks/aa/txn`);

    const response = await axios.post(
      `${BASE_URL}/webhooks/aa/txn`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('\n✅ Response:', JSON.stringify(response.data, null, 2));
    console.log('='.repeat(70));

    return response.data;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('='.repeat(70));
    return null;
  }
}

async function runTests() {
  console.log('\n🚀 Starting Webhook Tests');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // Test ACTIVE webhook
  await testWebhook('ACTIVE', testPayloads.active);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

  // Test REJECTED webhook
  await testWebhook('REJECTED', testPayloads.rejected);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test REVOKED webhook
  await testWebhook('REVOKED', testPayloads.revoked);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test READY webhook
  await testWebhook('READY', testPayloads.ready);

  console.log('\n✅ All webhook tests completed!\n');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

