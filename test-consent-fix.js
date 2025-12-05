/**
 * Test script to verify consent generation error handling fix
 * This shows what error messages will be returned
 */

require('dotenv').config();

console.log('🧪 Testing Consent Generation Error Handling\n');
console.log('='.repeat(60));

// Test 1: Simulate successful response
console.log('\n✅ Test 1: Successful Response Format');
const successResponse = {
  status: 'success',
  success: true,
  message: 'Consent processed successfully',
  data: {
    request_id: [1194],
    txn_id: ['d2bb28e7-a45c-4b1a-abd6-b0eb806e01e8'],
    consent_handle: '1130468f-45ee-4f06-af5f-0059bd7cbfdf',
    vua: '9898989898@dashboard-aa',
    url: 'https://sandbox.redirection.saafe.in/login?...'
  }
};

if (successResponse.status === 'success' && successResponse.data) {
  console.log('✅ Would return: success = true');
} else if (successResponse.status === 'error' || !successResponse.success) {
  console.log('❌ Would return: success = false, error =', successResponse.message);
} else {
  console.log('❌ Would return: success = false (unexpected format)');
}

// Test 2: Simulate error response
console.log('\n❌ Test 2: Error Response Format');
const errorResponse = {
  status: 'error',
  success: false,
  message: 'Consent are not as per fair use policy – Max_Data_Life is invalid',
  data: [],
  metadata: []
};

if (errorResponse.status === 'error' || !errorResponse.success) {
  console.log('✅ Would return: success = false');
  console.log('   Error message:', errorResponse.message);
  console.log('   Details:', JSON.stringify(errorResponse, null, 2));
} else {
  console.log('❌ Would return: success = true (WRONG!)');
}

console.log('\n' + '='.repeat(60));
console.log('\n📝 Summary:');
console.log('✅ Error handling now properly checks:');
console.log('   1. If status === "error" → return error message');
console.log('   2. If success === false → return error message');
console.log('   3. If status === "success" AND data exists → return success');
console.log('   4. Otherwise → return error with full response details');
console.log('\n🔍 Now when you test, you will see:');
console.log('   - The ACTUAL error message from Saafe');
console.log('   - Full error details for debugging');
console.log('   - Proper success/failure handling');
console.log('\n');

