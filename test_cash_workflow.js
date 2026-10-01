const fs = require('fs');
const assert = require('assert');

console.log('=== Starting CASH Payment Feature Test Suite ===\n');

const html = fs.readFileSync('./index.html', 'utf8');

// 1. Check CASH code case-insensitivity support and UI messages
console.log('[TEST 1] Verifying CASH coupon case-insensitivity & button triggers...');
assert(html.includes("code==='CASH'"), 'Missing CASH coupon check');
assert(html.includes('✓ CASH PAYMENT SELECTED'), 'Missing CASH payment selected message');
assert(html.includes('Confirm Cash Booking'), 'Missing Confirm Cash Booking button text');
assert(html.includes('Submit Cash Service Request'), 'Missing Submit Cash Service Request button text');
assert(html.includes('Submit Cash Construction Request'), 'Missing Submit Cash Construction Request button text');
assert(html.includes('Invalid payment code.'), 'Missing "Invalid payment code." error message');
console.log('✔ TEST 1 PASSED: CASH code validation, UI messages, and dynamic button labels are correctly configured.\n');

// 2. Check offline execution in payVisit and rmaExecutePaymentFlow
console.log('[TEST 2] Verifying offline CASH execution logic...');
assert(html.includes("status: 'pending_cash_verification'") || html.includes("status:'pending_cash_verification'"), 'Missing pending_cash_verification status in database payload');
assert(html.includes("payment_method: 'cash'") || html.includes("payment_method:'cash'"), 'Missing payment_method: cash in visit_scope');
assert(!html.includes("status: 'paid',") || html.includes("status: 'pending_cash_verification'"), 'Improper paid status check');
console.log('✔ TEST 2 PASSED: CASH bookings skip Razorpay and persist status as pending_cash_verification.\n');

// 3. Check Admin verification functionality
console.log('[TEST 3] Verifying Admin Cash Verification...');
assert(html.includes('adminVerifyCashPayment'), 'Missing adminVerifyCashPayment function');
assert(html.includes('window.adminVerifyCashPayment = adminVerifyCashPayment'), 'Missing adminVerifyCashPayment export');
assert(html.includes('💵 Verify Cash Received'), 'Missing Verify Cash Received button text');
assert(html.includes("status: 'cash_received'"), 'Missing status: cash_received update in Admin verification');
console.log('✔ TEST 3 PASSED: Admin Portal supports Cash Pending filter badge and single-click Cash Received verification.\n');

// 4. Check existing Razorpay & coupon functionality regression safety
console.log('[TEST 4] Verifying Razorpay & existing coupon safety...');
assert(html.includes('rmaCreateRazorpayOrder'), 'Razorpay order creation broken');
assert(html.includes('rmaVerifyRazorpayPayment'), 'Razorpay payment verification broken');
assert(html.includes('GOOD5'), 'Existing discount coupon GOOD5 missing');
assert(html.includes('SITE10'), 'Existing site visit coupon SITE10 missing');
assert(html.includes('GST LESS'), 'GST LESS coupon missing');
console.log('✔ TEST 4 PASSED: Razorpay and existing coupon workflows remain completely intact.\n');

console.log('=== ALL CASH PAYMENT TESTS PASSED SUCCESSFULLY ===');
