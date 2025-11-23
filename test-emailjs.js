// Quick EmailJS configuration test
// Run with: node test-emailjs.js
//
// ⚠️  IMPORTANT: EmailJS blocks Node.js/server calls by design.
// This test will show 403 error, but EmailJS WILL WORK when called
// from your Expo/React Native app (client-side).
//
// To test EmailJS properly: Run your app with `npm start` and trigger
// an action that sends email (e.g., create a staff member).

require('dotenv').config();

const testEmailJS = async () => {
  console.log('\n=== EmailJS Configuration Test ===\n');
  
  // Check environment variables
  const requiredVars = [
    'EMAILJS_SERVICE_ID',
    'EMAILJS_USER_ID',
    'EMAILJS_PRIVATE_KEY',
    'EMAILJS_STAFF_TEMPLATE_ID',
    'EMAILJS_WELCOME_TEMPLATE_ID',
    'SUPERADMIN_EMAIL'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.log('\nPlease add these to your .env file and try again.\n');
    process.exit(1);
  }
  
  console.log('✓ All required environment variables are set\n');
  console.log('Configuration:');
  console.log(`  Service ID: ${process.env.EMAILJS_SERVICE_ID}`);
  console.log(`  User ID: ${process.env.EMAILJS_USER_ID}`);
  console.log(`  Private Key: ${process.env.EMAILJS_PRIVATE_KEY ? '***set***' : 'missing'}`);
  console.log(`  Staff Template: ${process.env.EMAILJS_STAFF_TEMPLATE_ID}`);
  console.log(`  Welcome Template: ${process.env.EMAILJS_WELCOME_TEMPLATE_ID}`);
  console.log(`  From Email: ${process.env.SUPERADMIN_EMAIL}\n`);
  
  // Test connection with a dry-run style request
  console.log('Testing EmailJS API connection...\n');
  
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_STAFF_TEMPLATE_ID,
        user_id: process.env.EMAILJS_USER_ID,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          from_email: process.env.SUPERADMIN_EMAIL,
          to_email: 'test@example.com',
          to_name: 'Test User',
          staff_email: 'test@example.com',
          staff_password: 'TestPassword123'
        }
      })
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ SUCCESS! EmailJS is working correctly.');
      console.log(`   Response: ${responseText}`);
      console.log('\n⚠️  Note: A test email was sent to test@example.com (this will fail delivery but confirms API access).\n');
    } else {
      console.error('❌ EmailJS API returned an error:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Response: ${responseText}\n`);
      
      if (response.status === 400) {
        console.log('Common 400 errors:');
        console.log('  - Invalid template ID');
        console.log('  - Missing template parameters');
        console.log('  - Service ID mismatch\n');
      } else if (response.status === 401 || response.status === 403) {
        console.log('Authentication issue:');
        console.log('  - Check your EMAILJS_USER_ID (public key)');
        console.log('  - Verify service is active in EmailJS dashboard\n');
      }
    }
  } catch (error) {
    console.error('❌ Network or fetch error:');
    console.error(`   ${error.message}\n`);
    console.log('This might indicate:');
    console.log('  - No internet connection');
    console.log('  - EmailJS API is down');
    console.log('  - Network firewall blocking request\n');
  }
};

testEmailJS();
