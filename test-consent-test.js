const axios = require('axios');

    // Config
    const BASE_URL = 'http://localhost:3000';
    const USER_ID = `terminal_test_${Date.now()}`;

    async function runTest() {
      console.log('🚀 Starting Backend Persistence Test...');
      console.log('-----------------------------------');

      try {
        // 1. Initiate Consent
        console.log(`\n1️⃣  Calling POST /internal/aa/consents/initiate...`);
        const initResponse = await axios.post(`${BASE_URL}/internal/aa/consents/initiate`, {
          internal_user_id: USER_ID,
          mobile: '9898989898',
          fi_types: ['DEPOSIT']
        });

        if (!initResponse.data.success) {
          throw new Error('Initiation failed: ' + JSON.stringify(initResponse.data));
        }

        // Extract Request ID
        const data = initResponse.data.data || initResponse.data;
        const requestId = data.request_id || data.data?.request_id;

        console.log(`✅ Success! Request ID: ${requestId}`);

        // 2. Check Status Immediately (The step that was failing)
        console.log(`\n2️⃣  Immediately polling GET /internal/aa/consents/request/${requestId}...`);
        
        const statusResponse = await axios.get(`${BASE_URL}/internal/aa/consents/request/${requestId}`);
        
        if (statusResponse.data.success) {
          console.log(`✅ Success! Record found in DB.`);
          console.log(`   Current Status: ${statusResponse.data.data.status}`);
          console.log(`\n🎉 TEST PASSED: The backend is correctly saving before returning.`);
        } else {
          console.error(`❌ FAILED: Backend returned 404/Error.`);
          console.error(statusResponse.data);
        }

      } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Data:`, error.response.data);
        } else {
          console.error(`   Error: ${error.message}`);
        }
      }
    }

    runTest();