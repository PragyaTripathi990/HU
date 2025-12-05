/**
 * Debug script to check what payload is actually being sent
 */

require('dotenv').config();
const consentService = require('./services/consent/consentService');

console.log('\n' + '='.repeat(70));
console.log('🔍 DEBUGGING CONSENT PAYLOAD');
console.log('='.repeat(70) + '\n');

// Test input
const input = {
  internal_user_id: 't1',
  mobile: '9876543210',
  fi_types: ['DEPOSIT']
};

console.log('📥 Input:');
console.log(JSON.stringify(input, null, 2));
console.log('\n' + '-'.repeat(70) + '\n');

try {
  // Build payload
  const payload = consentService.buildSaafePayload(input);
  
  console.log('📤 Generated Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n' + '-'.repeat(70) + '\n');
  
  // Check for data_life fields
  const payloadStr = JSON.stringify(payload);
  const hasDataLife = payloadStr.includes('data_life');
  
  console.log('🔍 Checks:');
  console.log(`   Has data_life fields: ${hasDataLife ? '❌ YES (ERROR!)' : '✅ NO (GOOD)'}`);
  
  // Check consent_details structure
  if (payload.consent_details && Array.isArray(payload.consent_details)) {
    const consentDetail = payload.consent_details[0];
    console.log(`   Consent details is array: ✅ YES`);
    console.log(`   Consent detail keys: ${Object.keys(consentDetail).join(', ')}`);
    
    // Check for problematic fields
    const problematicFields = ['data_life_unit', 'data_life_value'];
    const foundProblematic = problematicFields.filter(field => field in consentDetail);
    
    if (foundProblematic.length > 0) {
      console.log(`   ❌ PROBLEMATIC FIELDS FOUND: ${foundProblematic.join(', ')}`);
    } else {
      console.log(`   ✅ No problematic fields found`);
    }
    
    // Check date ranges
    console.log(`\n📅 Date Range Info:`);
    console.log(`   consent_start: ${consentDetail.consent_start}`);
    console.log(`   consent_expiry: ${consentDetail.consent_expiry}`);
    console.log(`   fi_datarange_from: ${consentDetail.fi_datarange_from}`);
    console.log(`   fi_datarange_to: ${consentDetail.fi_datarange_to}`);
    
    // Calculate consent duration
    const start = new Date(consentDetail.consent_start);
    const expiry = new Date(consentDetail.consent_expiry);
    const days = Math.ceil((expiry - start) / (1000 * 60 * 60 * 24));
    console.log(`   Consent duration: ${days} days (${Math.round(days/30)} months)`);
    
    // Calculate data range duration
    const dataStart = new Date(consentDetail.fi_datarange_from);
    const dataEnd = new Date(consentDetail.fi_datarange_to);
    const dataDays = Math.ceil((dataEnd - dataStart) / (1000 * 60 * 60 * 24));
    console.log(`   Data range duration: ${dataDays} days (${Math.round(dataDays/30)} months)`);
  }
  
  console.log('\n' + '='.repeat(70));
  if (hasDataLife) {
    console.log('❌ ERROR: Payload contains data_life fields!');
  } else {
    console.log('✅ Payload looks good - no data_life fields');
  }
  console.log('='.repeat(70) + '\n');
  
} catch (error) {
  console.error('❌ Error generating payload:', error.message);
  console.error(error.stack);
}

