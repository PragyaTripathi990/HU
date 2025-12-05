/**
 * Test Consent API with AA ID: dashboard-aa-preprod
 * Run: node test-consent-with-aa-id.js
 */

require('dotenv').config();
const consentService = require('./services/consent/consentService');

console.log('\n' + '='.repeat(70));
console.log('🧪 TESTING CONSENT API WITH AA ID');
console.log('='.repeat(70) + '\n');

// Test Input with AA ID
const testInput = {
  internal_user_id: 'test-' + Date.now(),
  mobile: '9876543210',
  email: 'user@email.com',
  date_of_birth: '1990-01-01',
  pan_number: 'ABCDE1234F',
  aa_id: ['dashboard-aa-preprod'],  // ← AA ID from Saafe
  fi_types: ['DEPOSIT'],
  consent_start_date: '2025-11-05',  // Past date
  consent_expiry_date: '2026-05-05', // 6 months
  fi_datarange_from: '2025-08-05',  // 3 months back
  fi_datarange_to: '2025-11-05',    // Past date
  purpose_code: '102',
  consent_mode: 'STORE',
  consent_types: ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
  fetch_type: 'PERIODIC',
  frequency_unit: 'MONTH',
  frequency_value: 1
};

console.log('📝 Test Input:');
console.log(JSON.stringify(testInput, null, 2));
console.log('\n' + '-'.repeat(70) + '\n');

// Step 1: Build payload to verify structure
console.log('STEP 1: Building Payload...');
console.log('-'.repeat(70));

try {
  const payload = consentService.buildSaafePayload(testInput);
  
  console.log('✅ Payload Generated!\n');
  console.log('📋 Generated Payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  console.log('\n✅ Payload Validation:');
  console.log(`   - aa_id included: ${!!payload.aa_id ? '✅ YES' : '❌ NO'}`);
  if (payload.aa_id) {
    console.log(`   - aa_id value: ${JSON.stringify(payload.aa_id)}`);
  }
  console.log(`   - customer_details present: ${!!payload.customer_details}`);
  console.log(`   - consent_details present: ${!!payload.consent_details}`);
  
  if (payload.consent_details && payload.consent_details[0]) {
    const consent = payload.consent_details[0];
    console.log(`\n📝 Consent Details:`);
    console.log(`   - consent_start: ${consent.consent_start}`);
    console.log(`   - consent_expiry: ${consent.consent_expiry}`);
    console.log(`   - fi_datarange_from: ${consent.fi_datarange_from}`);
    console.log(`   - fi_datarange_to: ${consent.fi_datarange_to}`);
    console.log(`   - data_life_unit: ${consent.data_life_unit || 'NOT INCLUDED'}`);
    console.log(`   - data_life_value: ${consent.data_life_value !== undefined ? consent.data_life_value : 'NOT INCLUDED'}`);
  }
  
} catch (error) {
  console.error('❌ Payload Generation Failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('\n' + '-'.repeat(70) + '\n');

// Step 2: Call the actual API
console.log('STEP 2: Calling Saafe Consent API...');
console.log('-'.repeat(70));
console.log('⏳ This may take a few seconds...\n');

consentService.generateConsent(testInput)
  .then(result => {
    console.log('\n' + '='.repeat(70));
    console.log('📥 API RESPONSE');
    console.log('='.repeat(70) + '\n');
    
    if (result.success) {
      console.log('✅ SUCCESS! Consent generated successfully!\n');
      console.log('📋 Response Data:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('\n✅ Key Information:');
      console.log(`   - Request ID: ${result.request_id}`);
      console.log(`   - Transaction ID: ${result.txn_id}`);
      console.log(`   - Consent Handle: ${result.consent_handle}`);
      console.log(`   - VUA: ${result.vua}`);
      console.log(`   - Redirect URL: ${result.redirect_url}`);
      
    } else {
      console.log('❌ ERROR: Consent generation failed!\n');
      console.log('📋 Error Details:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.error) {
        console.log(`\n❌ Error Message: ${result.error}`);
      }
      
      if (result.details) {
        console.log('\n📋 Full Error Response:');
        console.log(JSON.stringify(result.details, null, 2));
      }
    }
    
    console.log('\n' + '='.repeat(70));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ UNEXPECTED ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  });

