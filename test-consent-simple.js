/**
 * Simple Consent API Test (Final & Fixed)
 * Run: node test-consent-simple.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const consentService = require('./services/consent/consentService');

// Helper to get today's date
const getToday = () => new Date().toISOString().split('T')[0];
const getFutureDate = (years = 1) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
};

async function runTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING CONSENT API');
  console.log('='.repeat(70) + '\n');

  try {
    // 1. Connect to DB
    console.log('🔌 Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 2. Prepare Input
    const testInput = {
      internal_user_id: 'test-' + Date.now(),
      mobile: '9876543210', 
      email: 'user@email.com',
      date_of_birth: '1990-01-01',
      pan_number: 'ABCDE1234F',
      aa_id: ['dashboard-aa-preprod'],
      fi_types: ['DEPOSIT'],
      consent_start_date: getToday(),
      consent_expiry_date: getFutureDate(1),
      purpose_code: '102',
      consent_mode: 'STORE',
      consent_types: ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
      fetch_type: 'PERIODIC',
      frequency_unit: 'MONTH',
      frequency_value: 1
    };

    console.log('STEP 1: Calling Saafe Consent API...');
    console.log('⏳ Authenticating & Generating Consent...\n');

    // 3. Call API
    const result = await consentService.generateConsent(testInput);

    console.log('\n' + '='.repeat(70));
    console.log('📥 API RESPONSE');
    console.log('='.repeat(70) + '\n');
    
    // 4. Safely Handle Response
    if (result.success) {
      // Logic to find the URL regardless of where it is nested
      const redirectUrl = result.data?.redirect_url || result.data?.url || result.data?.data?.url;
      const requestId = result.data?.request_id || result.request_id;
      const consentHandle = result.data?.consent_handle || result.consent_handle;

      console.log('✅ SUCCESS! Consent generated successfully!\n');
      console.log('🔗 REDIRECT URL (Click to Approve):');
      console.log('\x1b[36m%s\x1b[0m', redirectUrl); 
      console.log('\n');
      console.log(`🆔 Request ID: ${requestId}`);
      console.log(`🆔 Consent Handle: ${consentHandle}`);
    } else {
      console.log('❌ ERROR: Consent generation failed!');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
    process.exit(0);
  }
}

runTest();