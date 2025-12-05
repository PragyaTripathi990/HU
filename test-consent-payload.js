/**
 * Test script to verify consent payload structure
 * Run: node test-consent-payload.js
 */

require('dotenv').config();
const consentService = require('./services/consent/consentService');

// Test input matching your request
const testInput = {
  internal_user_id: 'test123',
  mobile: '9876543210',
  fi_types: ['DEPOSIT']
};

console.log('🧪 Testing Consent Payload Generation\n');
console.log('='.repeat(60));

// Build payload
const payload = consentService.buildSaafePayload(testInput);

console.log('\n📋 Generated Payload:');
console.log(JSON.stringify(payload, null, 2));

console.log('\n' + '='.repeat(60));
console.log('\n✅ Payload Structure Check:');
console.log(`- customer_details present: ${!!payload.customer_details}`);
console.log(`- consent_details present: ${!!payload.consent_details}`);
console.log(`- consent_details is array: ${Array.isArray(payload.consent_details)}`);
console.log(`- consent_details length: ${payload.consent_details?.length || 0}`);

if (payload.consent_details && payload.consent_details[0]) {
  const consent = payload.consent_details[0];
  console.log(`\n📝 Consent Details Fields:`);
  console.log(`- consent_start: ${consent.consent_start}`);
  console.log(`- consent_expiry: ${consent.consent_expiry}`);
  console.log(`- fetch_type: ${consent.fetch_type}`);
  console.log(`- fi_types: ${JSON.stringify(consent.fi_types)}`);
  console.log(`- data_life_unit: ${consent.data_life_unit || 'NOT INCLUDED ✅'}`);
  console.log(`- data_life_value: ${consent.data_life_value !== undefined ? consent.data_life_value : 'NOT INCLUDED ✅'}`);
  console.log(`- frequency_unit: ${consent.frequency_unit}`);
  console.log(`- frequency_value: ${consent.frequency_value}`);
}

console.log('\n' + '='.repeat(60));
console.log('\n🔍 Key Checks:');
console.log(`✅ data_life fields removed: ${!(payload.consent_details?.[0]?.data_life_unit || payload.consent_details?.[0]?.data_life_value)}`);
console.log(`✅ fetch_type is PERIODIC: ${payload.consent_details?.[0]?.fetch_type === 'PERIODIC'}`);
console.log(`✅ frequency fields present: ${!!(payload.consent_details?.[0]?.frequency_unit && payload.consent_details?.[0]?.frequency_value)}`);

console.log('\n');

