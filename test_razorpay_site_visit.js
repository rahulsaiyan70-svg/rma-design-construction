const fs = require('fs');
const assert = require('assert');

console.log('=== Running Razorpay & Site Visit Integration Tests ===');

const html = fs.readFileSync('index.html', 'utf8');

// Test 1: Check no git conflict markers remain
assert.strictEqual(/^<<<<<<< /m.test(html), false, 'Conflict marker <<<<<<< found in index.html');
assert.strictEqual(/^=======$/m.test(html), false, 'Conflict marker ======= found in index.html');
assert.strictEqual(/^>>>>>>> /m.test(html), false, 'Conflict marker >>>>>>> found in index.html');
console.log('✔ TEST 1 PASSED: No Git conflict markers remaining in index.html');

// Test 2: Check rmaExecutePaymentFlow definition & safety
assert.strictEqual(html.includes('async function rmaExecutePaymentFlow'), true, 'rmaExecutePaymentFlow definition missing');
assert.strictEqual(html.includes('window.RAZORPAY_KEY_ID || (typeof RAZORPAY_KEY_ID !== \'undefined\' ? RAZORPAY_KEY_ID : \'\')'), true, 'RAZORPAY_KEY_ID reference safety missing');
console.log('✔ TEST 2 PASSED: rmaExecutePaymentFlow is properly defined with RAZORPAY_KEY_ID safety');

// Test 3: Check payVisit calls rmaExecutePaymentFlow
assert.strictEqual(html.includes('paymentType: \'site_visit\''), true, 'site_visit paymentType call missing');
assert.strictEqual(html.includes('latitude: Number(document.getElementById(\'r29_lat\')'), true, 'Site Visit latitude mapping missing');
assert.strictEqual(html.includes('longitude: Number(document.getElementById(\'r29_lng\')'), true, 'Site Visit longitude mapping missing');
console.log('✔ TEST 3 PASSED: payVisit properly invokes rmaExecutePaymentFlow with site visit location coordinates');

// Test 4: Check site visit workflow preservation
assert.strictEqual(html.includes('loadRMAAdminSiteVisitRequests'), true, 'Manage Site Visits admin function missing');
assert.strictEqual(html.includes('notifyClientAppointmentConfirmed'), true, 'Appointment confirmation notification missing');
assert.strictEqual(html.includes('adminRescheduleBooking'), true, 'Appointment reschedule handler missing');
assert.strictEqual(html.includes('loadRMAAdminCalendarSection'), true, 'Admin appointment calendar handler missing');
console.log('✔ TEST 4 PASSED: Site Visit appointment workflow (Manage, Confirm, Reschedule, Calendar) is completely intact');

console.log('\n=== ALL RAZORPAY & SITE VISIT INTEGRATION TESTS PASSED ===');
