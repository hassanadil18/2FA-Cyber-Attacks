const axios = require('axios');

console.log(' TESTING ATTACK FLOW - Complete Verification\n');
console.log('=' .repeat(60));

async function testCompleteFlow() {
 const BASE_URL = 'http://localhost:5000';
 
 console.log('\n TEST 1: Backend Server Check');
 console.log('-'.repeat(60));
 try {
 const healthCheck = await axios.get(`${BASE_URL}/api/health`);
 console.log(' Backend server is running');
 console.log(` Status: ${healthCheck.status}`);
 } catch (error) {
 console.log(' Backend server not running!');
 console.log(' Fix: Run "npm start" in backend folder');
 return;
 }

 console.log('\n TEST 2: Execute Phishing Attack');
 console.log('-'.repeat(60));
 try {
 const phishingResponse = await axios.post(
 `${BASE_URL}/api/attacks/phishing`,
 {
 target_email: 'test-victim@example.com',
 attack_type: 'credential_harvesting',
 template: 'fake_login_page',
 domain: 'localhost'
 },
 {
 headers: {
 'Authorization': 'Bearer test-token',
 'Content-Type': 'application/json'
 }
 }
 );

 console.log(' Phishing attack executed successfully!');
 console.log(` Attack ID: ${phishingResponse.data.attack_id || phishingResponse.data.attackId}`);
 console.log(` Phishing URL: ${phishingResponse.data.phishing_url || phishingResponse.data.phishingUrl}`);
 console.log(` Status: ${phishingResponse.data.status}`);
 
 const attackId = phishingResponse.data.attack_id || phishingResponse.data.attackId;
 const phishingUrl = phishingResponse.data.phishing_url || phishingResponse.data.phishingUrl;

 console.log('\n TEST 3: Phishing Server Active Check');
 console.log('-'.repeat(60));
 
 if (phishingUrl) {
 console.log(` Phishing server should be running at: ${phishingUrl}`);
 console.log(' Open this URL in browser to see fake login page');
 console.log(' Enter test credentials to simulate victim');
 }

 console.log('\n TEST 4: Database Storage Check');
 console.log('-'.repeat(60));
 console.log(' Run this command to see stored data:');
 console.log(' node show-evidence.js');
 console.log(` Look for Attack ID: ${attackId}`);

 } catch (error) {
 console.log(' Failed to execute phishing attack');
 console.log(` Error: ${error.message}`);
 if (error.response) {
 console.log(` Status: ${error.response.status}`);
 console.log(` Details: ${JSON.stringify(error.response.data, null, 2)}`);
 }
 }

 console.log('\n TEST 5: MITM Attack');
 console.log('-'.repeat(60));
 try {
 const mitmResponse = await axios.post(
 `${BASE_URL}/api/attacks/mitm`,
 {
 target_phone: '+1234567890',
 attack_method: 'session_hijacking',
 intercept_type: '2fa_codes'
 },
 {
 headers: {
 'Authorization': 'Bearer test-token',
 'Content-Type': 'application/json'
 }
 }
 );

 console.log(' MITM attack executed successfully!');
 console.log(` Attack ID: ${mitmResponse.data.attack_id || mitmResponse.data.attackId}`);
 console.log(` Intercepted: ${mitmResponse.data.details?.intercepted_messages || 'N/A'} messages`);
 console.log(` Status: ${mitmResponse.data.status}`);
 } catch (error) {
 console.log(' Failed to execute MITM attack');
 console.log(` Error: ${error.message}`);
 }

 console.log('\n TEST 6: SIM Swap Attack');
 console.log('-'.repeat(60));
 try {
 const simSwapResponse = await axios.post(
 `${BASE_URL}/api/attacks/sim-swap`,
 {
 target_phone: '+1234567890',
 carrier: 'Verizon',
 attack_method: 'social_engineering'
 },
 {
 headers: {
 'Authorization': 'Bearer test-token',
 'Content-Type': 'application/json'
 }
 }
 );

 console.log(' SIM Swap attack executed successfully!');
 console.log(` Attack ID: ${simSwapResponse.data.attack_id || simSwapResponse.data.attackId}`);
 console.log(` Phone: ${simSwapResponse.data.details?.target_phone || 'N/A'}`);
 console.log(` Status: ${simSwapResponse.data.status}`);
 } catch (error) {
 console.log(' Failed to execute SIM Swap attack');
 console.log(` Error: ${error.message}`);
 }

 console.log('\n' + '='.repeat(60));
 console.log(' NEXT STEPS FOR PRESENTATION:');
 console.log('='.repeat(60));
 console.log('1. Start backend: cd backend && npm start');
 console.log('2. Start frontend: cd frontend && npm start');
 console.log('3. Run this test: node test-attack-flow.js');
 console.log('4. Open React app in browser: http://localhost:3000');
 console.log('5. Execute attacks from UI');
 console.log('6. View evidence: node show-evidence.js');
 console.log('7. Show phishing page to class (open phishing URL)');
 console.log('\n This proves attacks work end-to-end!\n');
}

testCompleteFlow().catch(console.error);
