require('dotenv').config();
const axios = require('axios');

async function testAlloy() {
  try {
    const auth = Buffer.from(`${process.env.ALLOY_WORKFLOW_TOKEN}:${process.env.ALLOY_WORKFLOW_SECRET}`).toString('base64');
    
    const response = await axios.get('https://sandbox.alloy.co/v1/workflows', {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    console.log('✅ Connection successful! Available workflows:');
    console.log(response.data);
  } catch (err) {
    console.error('❌ Error connecting to Alloy:');
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err.message);
    }
  }
}

testAlloy();
