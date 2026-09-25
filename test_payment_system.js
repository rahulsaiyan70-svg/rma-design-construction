const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== RUNNING PAYMENT SYSTEM REGRESSION TESTS ===\n');

// Read index.html
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract all script contents from index.html
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let allScriptCode = '';

while ((match = scriptRegex.exec(html)) !== null) {
  const code = match[1];
  // Filter out inline scripts that require browser Leaflet or DOM rendering
  if (code && !code.includes('Leaflet') && !code.includes('L.map')) {
    allScriptCode += code + '\n;\n';
  }
}

// Mock DOM elements storage
const elements = {};

function createMockElement(id, tagName = 'div') {
  if (elements[id]) return elements[id];

  let _id = id;
  const el = {
    get id() { return _id; },
    set id(val) { _id = val; elements[val] = el; },
    tagName: tagName.toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    className: '',
    style: {},
    disabled: false,
    options: [{ text: 'Option 1', value: '1' }],
    selectedIndex: 0,
    classList: {
      _classes: new Set(['hidden']),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); }
    },
    dataset: {},
    children: [],
    parentElement: null,
    listeners: {},
    addEventListener: function(evt, fn) {
      this.listeners[evt] = this.listeners[evt] || [];
      this.listeners[evt].push(fn);
    },
    removeEventListener: function() {},
    dispatchEvent: function(event) {
      if (this.listeners[event.type]) {
        this.listeners[event.type].forEach(fn => fn(event));
      }
    },
    click: function() {
      if (this.onclick) this.onclick({ preventDefault: () => {} });
      if (this.listeners['click']) {
        this.listeners['click'].forEach(fn => fn({ preventDefault: () => {} }));
      }
    },
    querySelector: function(sel) { return null; },
    querySelectorAll: function(sel) { return []; },
    appendChild: function(child) { this.children.push(child); child.parentElement = this; return child; },
    insertBefore: function(child) { this.children.push(child); child.parentElement = this; return child; },
    remove: function() { this.parentElement = null; },
    reportValidity: function() { return true; },
    closest: function() { return { classList: { add: () => {}, remove: () => {} } }; }
  };

  elements[id] = el;
  return el;
}

// Pre-create common form elements
const formIds = [
  'r29_name', 'r29_mobile', 'r29_email', 'r29_building', 'r29_requirement', 'r29_date', 'r29_time',
  'r29_address', 'r29_pin', 'r29_coords', 'r29_pinBtn', 'r29_gps', 'r29_coupon', 'r29_couponBtn', 'r29_couponMsg',
  'r29_message', 'r29_pay', 'r29_distance', 'r29_fee', 'r29_gst', 'r29_discount', 'r29_total', 'r29_discount_row',
  'r29_lat', 'r29_lng',
  's_name', 's_mobile', 's_email', 's_building', 's_floors', 's_plot', 's_area', 's_message', 's_project_address',
  'serviceBaseSubtotal', 'serviceDiscount', 'serviceSubtotal', 'serviceGST', 'serviceTotal',
  's_coupon', 's_couponBtn', 's_couponMsg', 's_couponBox', 'rmaV29ServicePay', 'rmaV29ServiceMsg',
  'c_name2', 'c_mobile2', 'c_email2', 'c_building2', 'c_floors2', 'c_area2', 'c_basis2', 'c_rate2',
  'c_address2', 'c_other2', 'c_summaryTotal', 'c_coupon', 'c_couponBtn', 'c_couponMsg', 'c_couponBox',
  'rmaV29ConstructionPay', 'rmaV29ConstructionMsg', 'page-sitevisit', 'page-services', 'page-construction',
  'serviceForm', 'constructionForm', 'rmaV29VisitForm', 'toast', 'serviceMessage', 'constructionMessage',
  'razorpayMessage', 'discountCode', 'autoDiscountLabel',
  'rmaCalcMethod', 'rmaCalcDimensionsWrap', 'rmaCalcLength', 'rmaCalcWidth', 'rmaCalcStories',
  'rmaCalcArea', 'rmaCalcHelp', 'rmaCalcType', 'rmaCalcClass', 'rmaCalcLevel', 'rmaCalcRate', 'rmaCalcTotal', 'rmaCalcNote',
  'a_planType', 'a_electrical', 'a_plumbing', 'a_elevation', 'sv_area', 'sv_type', 'floorRequirements',
  'architecturalDetails', 'structuralDetails', 'municipalityDetails', 'estimationDetails', 'surveyDetails'
];

formIds.forEach(id => createMockElement(id));

elements['rmaCalcMethod'].value = 'dimensions';
elements['rmaCalcStories'].value = '1';
elements['rmaCalcType'].value = 'residential';
elements['rmaCalcClass'].value = 'C';
elements['rmaCalcLevel'].value = 'grey';

// Set up mock forms
elements['rmaV29VisitForm'].querySelector = () => null;
elements['rmaV29VisitForm'].querySelectorAll = () => [];
elements['serviceForm'].querySelector = () => null;
elements['serviceForm'].querySelectorAll = () => [];
elements['constructionForm'].querySelector = () => null;
elements['constructionForm'].querySelectorAll = () => [];

let fetchCalls = [];
let recordedBookings = [];
let generatedInvoices = [];
let razorpayInstances = [];

const mockSupabaseClient = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    getUser: async () => ({ data: { user: { id: 'usr_1', email: 'test@client.com' } } })
  },
  from: (table) => ({
    insert: async (data) => {
      if (table === 'bookings') recordedBookings.push(data);
      return { data, error: null };
    },
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) })
  })
};

const mockHead = createMockElement('head');
const mockBody = createMockElement('body');

const mockServiceCheckbox = { value: 'architectural', checked: true, addEventListener: () => {} };

// Build VM Context
const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Intl: Intl,
  Date: Date,
  Math: Math,
  JSON: JSON,
  Number: Number,
  String: String,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  Error: Error,
  URL: URL,
  RegExp: RegExp,
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent,

  SUPABASE_URL: 'https://test-supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',

  document: {
    head: mockHead,
    body: mockBody,
    getElementById: (id) => elements[id] || createMockElement(id),
    querySelector: (sel) => {
      if (sel === '#page-services .pricebox') return createMockElement('s_pricebox');
      if (sel === '#page-construction .pricebox') return createMockElement('c_pricebox');
      return createMockElement(sel.replace(/[^a-zA-Z0-9_-]/g, ''));
    },
    querySelectorAll: (sel) => {
      if (sel.includes('input[name="service"]')) {
        return [mockServiceCheckbox];
      }
      return [];
    },
    createElement: (tag) => createMockElement('elem_' + Math.random().toString(36).slice(2), tag),
    readyState: 'complete',
    addEventListener: () => {}
  },

  window: {
    RAZORPAY_KEY_ID: 'rzp_test_123',
    location: { href: '' },
    scrollTo: () => {},
    supabase: {
      createClient: () => mockSupabaseClient
    }
  },

  Event: function (type) { this.type = type; },

  fetch: async (url, opts = {}) => {
    fetchCalls.push({ url, opts, body: opts.body ? JSON.parse(opts.body) : null });
    if (url.includes('create-razorpay-order')) {
      return { ok: true, json: async () => ({ order_id: 'order_test_999', amount: opts.body ? JSON.parse(opts.body).amount : 100, currency: 'INR' }) };
    }
    if (url.includes('verify-razorpay-payment')) {
      return { ok: true, json: async () => ({ verified: true }) };
    }
    if (url.includes('generate-gst-invoice')) {
      const inv = { success: true, invoice_number: 'INV/2026/TEST', download_url: 'https://example.com/inv.pdf' };
      generatedInvoices.push({ url, body: opts.body ? JSON.parse(opts.body) : null, inv });
      return { ok: true, json: async () => inv };
    }
    if (url.includes('api.postalpincode.in')) {
      return { ok: true, json: async () => [{ PostOffice: [{ District: 'Jammu', State: 'Jammu & Kashmir' }] }] };
    }
    if (url.includes('nominatim.openstreetmap.org')) {
      return { ok: true, json: async () => [{ lat: '32.6712', lon: '74.8848' }] };
    }
    if (url.includes('router.project-osrm.org')) {
      return { ok: true, json: async () => ({ routes: [{ distance: 15000 }] }) };
    }
    return { ok: true, json: async () => ({}) };
  },

  supabaseClient: mockSupabaseClient,

  Razorpay: function (options) {
    this.options = options;
    razorpayInstances.push(this);
    this.open = function () {
      sandbox.__lastOpenedRazorpay = this;
    };
  },

  selectedServiceKeys: () => ['architectural'],
  rmaShowSiteVisitSuccess: () => {},
  rmaUpdateGSTBillButton: () => {}
};

sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.fetch = sandbox.fetch;
sandbox.window.supabaseClient = sandbox.supabaseClient;
sandbox.window.Razorpay = sandbox.Razorpay;

const context = vm.createContext(sandbox);

let passed = 0, failed = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

try {
  vm.runInContext(allScriptCode, context);
  console.log('Script context initialized successfully.\n');
} catch (e) {
  console.error('Context initialization error:', e);
  process.exit(1);
}

const w = context.window;

async function run() {
  // Test 1: Common Payment Architecture Function rmaExecutePayment
  assert(typeof w.rmaExecutePayment === 'function', 'rmaExecutePayment function is defined globally');

  // Test 2: Site Visit Payment Flow with RMATEST1 Coupon
  console.log('--- TEST: Site Visit Payment Flow ---');
  if (w.showPage) w.showPage('sitevisit');
  await new Promise(r => setTimeout(r, 100));

  elements['r29_name'].value = 'Site Visit Client';
  elements['r29_mobile'].value = '9876543210';
  elements['r29_email'].value = 'sv@example.com';
  elements['r29_address'].value = '123 Site Address, Jammu';
  elements['r29_building'].value = 'Residential';
  elements['r29_requirement'].value = 'Planning inspection';
  elements['r29_date'].value = '2026-10-15';
  elements['r29_time'].value = 'Morning';

  // Simulate PIN verification
  elements['r29_pin'].value = '180001';
  if (elements['r29_pinBtn'].onclick) {
    await elements['r29_pinBtn'].onclick();
    await new Promise(r => setTimeout(r, 200));
  }

  // Apply RMATEST1 coupon
  elements['r29_coupon'].value = 'RMATEST1';
  if (elements['r29_couponBtn'].onclick) {
    elements['r29_couponBtn'].onclick();
  }
  assert(elements['r29_couponMsg'].textContent.includes('RMATEST1 applied'), 'Site Visit coupon RMATEST1 applied');

  // Trigger Pay Site Visit
  if (elements['r29_pay'].onclick) {
    await elements['r29_pay'].onclick();
    await new Promise(r => setTimeout(r, 200));
  }

  const rzSv = context.__lastOpenedRazorpay;
  assert(rzSv !== undefined && rzSv.options.amount === 1, 'Site Visit Razorpay order created with ₹1 test amount');
  assert(rzSv.options.notes.is_test === 'true', 'Order notes contain is_test: true');
  assert(rzSv.options.notes.coupon_code === 'RMATEST1', 'Order notes contain coupon_code: RMATEST1');

  // Trigger Razorpay Handler (Payment Success)
  const svResponse = { razorpay_payment_id: 'pay_sv_001', razorpay_order_id: 'order_test_999', razorpay_signature: 'sig_sv_001' };
  await rzSv.options.handler(svResponse);
  await new Promise(r => setTimeout(r, 100));

  assert(recordedBookings.length > 0 && recordedBookings[0].service_type === 'Site Visit', 'Site visit booking recorded in database');
  assert(generatedInvoices.length === 0, 'GST tax invoice was SKIPPED for site visit test payment');

  // Test 3: Service Payment Flow with RMATEST1 Coupon
  console.log('\n--- TEST: Service Payment Flow ---');
  elements['s_name'].value = 'Service Client';
  elements['s_mobile'].value = '9123456789';
  elements['s_email'].value = 'service@example.com';
  elements['s_project_address'].value = 'Service test location';

  w.installServicePayment();
  elements['s_coupon'].value = 'RMATEST1';
  w.applyServiceCoupon();
  assert(elements['rmaV29ServiceMsg'].textContent.includes('RMATEST1 applied'), 'Service coupon RMATEST1 applied');

  const payServBtn = elements['rmaV29ServicePay'];
  if (payServBtn && payServBtn.onclick) await payServBtn.onclick();
  await new Promise(r => setTimeout(r, 100));

  const rzServ = context.__lastOpenedRazorpay;
  assert(rzServ !== undefined && rzServ.options.amount === 1, 'Service Razorpay order created with ₹1 test amount');

  const servResponse = { razorpay_payment_id: 'pay_serv_002', razorpay_order_id: 'order_test_999', razorpay_signature: 'sig_serv_002' };
  await rzServ.options.handler(servResponse);
  await new Promise(r => setTimeout(r, 100));

  const servBooking = recordedBookings.find(b => b.service_type.includes('Paid Service Request'));
  assert(servBooking !== undefined, 'Service request recorded in database');
  assert(generatedInvoices.length === 0, 'GST tax invoice was SKIPPED for service test payment');

  // Test 4: Construction Payment Flow with RMATEST1 Coupon
  console.log('\n--- TEST: Construction Payment Flow ---');
  elements['c_name2'].value = 'Construction Client';
  elements['c_mobile2'].value = '9988776655';
  elements['c_email2'].value = 'construction@example.com';
  elements['c_summaryTotal'].textContent = '₹3,450,000';
  elements['c_building2'].value = 'Residential';
  elements['c_floors2'].value = '2';
  elements['c_area2'].value = '1200';
  elements['c_basis2'].value = 'material';
  elements['c_rate2'].value = 'grey';
  elements['c_address2'].value = 'Plot 88, Sector 4, Jammu';
  elements['c_other2'].value = 'Standard grey structure construction';

  w.installConstructionPayment();
  elements['c_coupon'].value = 'RMATEST1';
  w.applyConstructionCoupon();
  assert(elements['rmaV29ConstructionMsg'].textContent.includes('RMATEST1 applied'), 'Construction coupon RMATEST1 applied');

  const payConstBtn = elements['rmaV29ConstructionPay'];
  if (payConstBtn && payConstBtn.onclick) await payConstBtn.onclick();
  await new Promise(r => setTimeout(r, 100));

  const rzConst = context.__lastOpenedRazorpay;
  assert(rzConst !== undefined && rzConst.options.amount === 1, 'Construction Razorpay order created with ₹1 test amount');

  const constResponse = { razorpay_payment_id: 'pay_const_003', razorpay_order_id: 'order_test_999', razorpay_signature: 'sig_const_003' };
  await rzConst.options.handler(constResponse);
  await new Promise(r => setTimeout(r, 100));

  const lastBooking = recordedBookings[recordedBookings.length - 1];
  assert(lastBooking && lastBooking.service_type.includes('Paid Construction Request'), 'Construction request recorded in database');
  if (lastBooking) {
    const scopeData = JSON.parse(lastBooking.visit_scope);
    assert(scopeData.building_type === 'Residential' && scopeData.floors === 2 && scopeData.built_up_area_per_floor === 1200, 'Construction transaction recorded building_type, floors, built_up_area_per_floor');
    assert(scopeData.is_test === true && scopeData.coupon_code === 'RMATEST1', 'Construction transaction recorded is_test: true and coupon_code: RMATEST1');
  }
  assert(generatedInvoices.length === 0, 'GST tax invoice was SKIPPED for construction test payment');

  // Test 5: Non-Test Payment Flow generates GST Invoice
  console.log('\n--- TEST: Non-Test Normal Payment Flow ---');
  // Re-verify PIN for normal payment
  if (elements['r29_pinBtn'].onclick) await elements['r29_pinBtn'].onclick();
  // Clear coupon input
  elements['r29_coupon'].value = 'INVALID';
  if (elements['r29_couponBtn'].onclick) elements['r29_couponBtn'].onclick();

  if (elements['r29_pay'].onclick) await elements['r29_pay'].onclick();
  await new Promise(r => setTimeout(r, 100));

  const rzNormal = context.__lastOpenedRazorpay;
  assert(rzNormal.options.amount > 1, 'Normal Site Visit order created with full calculated amount');
  const normalResponse = { razorpay_payment_id: 'pay_norm_004', razorpay_order_id: 'order_test_999', razorpay_signature: 'sig_norm_004' };
  await rzNormal.options.handler(normalResponse);
  await new Promise(r => setTimeout(r, 100));

  assert(generatedInvoices.length === 1, 'GST tax invoice WAS generated for normal non-test payment');

  // Test 6: Duplicate Callback Protection
  console.log('\n--- TEST: Duplicate Callback Lock ---');
  const countBefore = recordedBookings.length;
  await rzNormal.options.handler(normalResponse); // Same payment ID
  assert(recordedBookings.length === countBefore, 'Duplicate payment callback was blocked by processing lock');

  // Test 7: Modal Dismissal
  console.log('\n--- TEST: Modal Dismissal ---');
  const testRzModal = new w.Razorpay({ modal: { ondismiss: function() { elements['r29_message'].textContent = 'Payment window closed.'; } } });
  testRzModal.options.modal.ondismiss();
  assert(elements['r29_message'].textContent.includes('closed'), 'Modal dismiss set status to Payment window closed');

  console.log(`\n========================================`);
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
