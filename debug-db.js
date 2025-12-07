/**
 * Database Inspector
 * debug-db.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function inspectDB() {
  console.log('\n🕵️  STARTING DATABASE INSPECTION...');
  
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing in .env');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    const collection = db.collection('aa_consent_requests');

    // 1. Count total records
    const count = await collection.countDocuments();
    console.log(`📊 Total Consent Requests in DB: ${count}`);

    // 2. Fetch last 5 records
    const recentRecords = await collection.find({})
      .sort({ _id: -1 }) // Sort by newest first
      .limit(5)
      .toArray();

    console.log('\n📝  MOST RECENT 5 RECORDS:');
    console.log('--------------------------------------------------');
    
    recentRecords.forEach(rec => {
      const reqId = rec.request_id;
      const type = typeof reqId;
      console.log(`ID: ${rec._id} | Request ID: ${reqId} (${type}) | Status: ${rec.status}`);
      console.log(`   Internal User: ${rec.internal_user_id}`);
    });
    console.log('--------------------------------------------------');

    // 3. Specifically look for 5748 (The failed one)
    console.log('\n🔍  HUNTING FOR MISSING REQUEST 5748...');
    
    const stringMatch = await collection.findOne({ request_id: "5748" });
    const numberMatch = await collection.findOne({ request_id: 5748 });

    if (numberMatch) {
      console.log('✅ Found 5748 as a NUMBER! (The backend should find this if parseInt is used)');
    } else if (stringMatch) {
      console.log('⚠️ Found 5748 as a STRING! (Backend schema might be expecting Number)');
    } else {
      console.log('❌ Request 5748 DOES NOT EXIST in the database.');
      console.log('   (This means the save operation failed silently or was never awaited)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

inspectDB();