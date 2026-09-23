import dotenv from 'dotenv';
dotenv.config();

// Dynamic import so dotenv populates process.env first
const { createUpiCollectRequest, isValidUpiId } = await import('../netlify/functions/lib/famGatewayService.js');

console.log('Testing createUpiCollectRequest backend logic with populated env...');

async function runTest() {
  console.log('Test 1: VPA format validation');
  console.log('isValidUpiId("invalidvpa"):', isValidUpiId('invalidvpa')); // should be false
  console.log('isValidUpiId("test@upi"):', isValidUpiId('test@upi'));       // should be true

  console.log('\nTest 2: Sending collect request to real configured gateway API...');
  try {
    const res = await createUpiCollectRequest({
      orderId: 'ord_test_' + Date.now(),
      upiId: '9876543210@paytm',
      amount: 1,
      name: 'Test Customer',
      mobile: '9876543210'
    });
    console.log('Success result:', res);
  } catch (err) {
    console.log('\nCaught error from real gateway call:');
    console.log('Error Message:', err.message);
  }
}

runTest();
