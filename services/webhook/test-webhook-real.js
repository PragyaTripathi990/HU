/**
 * Test Webhook with REAL Data from Database
 * Run: node test-webhook-real.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

async function runRealTest() {
  console.log('\n==================================================');
  console.log('🧪 TESTING WEBHOOK WITH REAL DATA');
  console.log('==================================================\n');

  let dbConnection;
  
  try {
    // 1. Connect to DB to find a REAL record
    console.log('🔌 Connecting to MongoDB...');
    dbConnection = await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    // 2. Find the successful request you made earlier (ID 5689)
    console.log('🔍 Looking for Request ID 5689...');
    const record = await db.collection('aa_consent_requests').findOne({ request_id: 5689 });

    if (!record) {
      throw new Error('❌ Could not find Request 5689. Please run the consent generation test again.');
    }

    console.log(`✅ Found Record!`);
    console.log(`   Txn ID: ${record.txn_id}`);
    console.log(`   Handle: ${record.consent_handle}`);
    console.log(`   Current Status: ${record.status}\n`);

    // 3. Prepare the Webhook Payload using REAL IDs
    const payload = {
      txn_id: record.txn_id,
      status: "success",
      data: {
        consent_handle: record.consent_handle,
        consent_id: "bd03d1c5-e3aa-4bea-b990-545284b39689", // Using a valid handle format as ID
        consent_status: "ACTIVE"
      }
    };

    // 4. Send Webhook to your Server
    const webhookUrl = 'http://localhost:3000/webhooks/aa/txn';
    console.log(`🚀 Sending Webhook to: ${webhookUrl}`);
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(webhookUrl, payload);

    console.log('\n==================================================');
    console.log('📥 CORRECT RESPONSE RECEIVED');
    console.log('==================================================\n');
    
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✅ SUCCESS: Webhook processed correctly!');
    } else {
      console.log('\n❌ FAILED: Server returned an error.');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('API Error Data:', error.response.data);
    }
  } finally {
    if (dbConnection) await mongoose.disconnect();
    console.log('\n🔌 Database connection closed.');
  }
}

runRealTest();