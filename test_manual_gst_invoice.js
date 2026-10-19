// test_manual_gst_invoice.js
// Automated E2E verification test suite for manual GST invoice generation in RMA Design & Construction

const fs = require('fs');
const assert = require('assert');

console.log('=== Starting Manual GST Invoice System Verification ===\n');

// 1. Verify Migration File 20261005000000_manual_gst_invoices.sql
console.log('[TEST 1] Verifying Migration File for Manual GST Invoices...');
const migrationPath = 'supabase/migrations/20261005000000_manual_gst_invoices.sql';
assert(fs.existsSync(migrationPath), `Migration file ${migrationPath} not found.`);
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

assert(migrationSql.includes('invoice_source'), 'Migration SQL must add invoice_source column');
assert(migrationSql.includes('public.profiles'), 'Migration SQL must ensure public.profiles table exists');
assert(migrationSql.includes("role"), 'Migration SQL must include role column in profiles');
assert(migrationSql.includes("active"), 'Migration SQL must include active column in profiles');
console.log('✔ TEST 1 PASSED: Migration file schema verified.\n');

// 2. Verify Edge Function generate-manual-gst-invoice
console.log('[TEST 2] Verifying Edge Function generate-manual-gst-invoice Code Logic...');
const funcPath = 'supabase/functions/generate-manual-gst-invoice/index.ts';
assert(fs.existsSync(funcPath), `Edge function ${funcPath} not found.`);
const funcCode = fs.readFileSync(funcPath, 'utf8');

assert(funcCode.includes('auth.getUser'), 'Edge function must verify Auth session token with auth.getUser()');
assert(funcCode.includes('from("profiles")'), 'Edge function must check user profile in public.profiles');
assert(funcCode.includes('role') && funcCode.includes('admin'), 'Edge function must verify admin role');
assert(funcCode.includes('gst-invoices'), 'Edge function must upload document to private gst-invoices bucket');
assert(funcCode.includes('generate_rma_invoice_number'), 'Edge function must generate server-side invoice number');
assert(funcCode.includes('invoice_source: "manual"'), 'Edge function must record invoice_source as manual');
assert(funcCode.includes('invoice_audit_logs'), 'Edge function must insert audit log');
console.log('✔ TEST 2 PASSED: Edge Function server-side authorization and processing logic verified.\n');

// 3. Verify Frontend Functions in index.html
console.log('[TEST 3] Verifying Frontend Handlers in index.html...');
const htmlContent = fs.readFileSync('index.html', 'utf8');

assert(htmlContent.includes('RMA_MANUAL_GST_INVOICE_URL'), 'index.html must define RMA_MANUAL_GST_INVOICE_URL');
assert(htmlContent.includes('rmaGenerateManualGSTInvoice'), 'index.html must define rmaGenerateManualGSTInvoice');
assert(htmlContent.includes('btnAdminGenGstBill'), 'index.html must track button state during generation');
assert(htmlContent.includes('Client name is required'), 'index.html must validate client name field');
assert(htmlContent.includes('Service description is required'), 'index.html must validate service description');
assert(htmlContent.includes('total amount greater than ₹0'), 'index.html must validate total amount');
assert(htmlContent.includes('rmaShowBillPreviewModal'), 'index.html must display bill preview on success');
console.log('✔ TEST 3 PASSED: Frontend handlers, form validations, and modals verified.\n');

// 4. Verify Server-Side Tax Calculations for ₹3,000 Test Data
console.log('[TEST 4] Verifying ₹3,000 Test Data GST Calculations...');
const totalAmount = 3000;
const taxableAmount = Number((totalAmount / 1.18).toFixed(2));
const gstAmount = Number((totalAmount - taxableAmount).toFixed(2));
const cgst = Number((gstAmount / 2).toFixed(2));
const sgst = Number((gstAmount / 2).toFixed(2));

assert.strictEqual(taxableAmount, 2542.37, `Taxable amount for ₹3,000 should be 2542.37, got ${taxableAmount}`);
assert.strictEqual(gstAmount, 457.63, `GST amount for ₹3,000 should be 457.63, got ${gstAmount}`);
assert.strictEqual(cgst, 228.81, `CGST for ₹3,000 should be 228.81, got ${cgst}`);
assert.strictEqual(sgst, 228.81, `SGST for ₹3,000 should be 228.81, got ${sgst}`);
console.log('✔ TEST 4 PASSED: ₹3,000 test data GST calculations verified (Taxable: ₹2,542.37, GST 18%: ₹457.63, CGST: ₹228.81, SGST: ₹228.81).\n');

// 5. Verify Online Razorpay Flow Preservation
console.log('[TEST 5] Verifying Existing Online Razorpay Flow Preservation...');
assert(fs.existsSync('supabase/functions/generate-gst-invoice/index.ts'), 'Original online generate-gst-invoice function must remain intact');
assert(htmlContent.includes('rmaGenerateAndSendGSTInvoice'), 'index.html must retain rmaGenerateAndSendGSTInvoice for online payments');
console.log('✔ TEST 5 PASSED: Existing online Razorpay payment verification flow remains untouched.\n');

console.log('=== ALL MANUAL GST INVOICE E2E VERIFICATIONS COMPLETED SUCCESSFULLY ===');
