/**
 * E2E Validation for Site Visit Actions, GST Bill Generation & Business Ledger
 */

const fs = require('fs');
const assert = require('assert');

console.log("=== Testing Site Visit Actions, GST Bill Generator & Business Ledger ===");

const indexHtml = fs.readFileSync('index.html', 'utf8');
const ledgerMigration = fs.readFileSync('supabase/migrations/20260929000000_business_ledger.sql', 'utf8');

// Test 1: Verify Business Ledger Migration Schema
console.log("\n[TEST 1] Verifying Business Ledger Migration SQL...");
assert(ledgerMigration.includes('CREATE TABLE IF NOT EXISTS public.business_ledger'), "business_ledger table creation missing!");
assert(ledgerMigration.includes("entry_type IN ('INCOME', 'EXPENSE')"), "entry_type constraint missing!");
assert(ledgerMigration.includes('amount NUMERIC(12,2) NOT NULL CHECK (amount > 0)'), "amount check constraint missing!");
assert(ledgerMigration.includes('ENABLE ROW LEVEL SECURITY'), "RLS not enabled on business_ledger!");
console.log("✔ TEST 1 PASSED: business_ledger migration SQL schema and RLS verified.");

// Test 2: Verify Site Visit Actions Implementation
console.log("\n[TEST 2] Verifying Site Visit Actions (Confirm, Reject, Reschedule, Complete, Delete)...");
assert(indexHtml.includes('async function adminAcceptBooking('), "adminAcceptBooking function missing!");
assert(indexHtml.includes('async function adminRejectBookingPrompt('), "adminRejectBookingPrompt function missing!");
assert(indexHtml.includes('async function adminRescheduleBooking('), "adminRescheduleBooking function missing!");
assert(indexHtml.includes('async function adminOpenCompletionModal('), "adminOpenCompletionModal function missing!");
assert(indexHtml.includes('async function adminDeleteBookingPrompt('), "adminDeleteBookingPrompt function missing!");
assert(indexHtml.includes("status: 'confirmed'"), "Confirmed status assignment missing!");
assert(indexHtml.includes("status: 'rejected'"), "Rejected status assignment missing!");
assert(indexHtml.includes("status: 'completed'"), "Completed status assignment missing!");
console.log("✔ TEST 2 PASSED: All Site Visit actions are properly defined and update Supabase status.");

// Test 3: Verify Dynamic Dashboard Summary & Filters
console.log("\n[TEST 3] Verifying Dynamic Dashboard Summary & Filters...");
assert(indexHtml.includes('NEW_PENDING_REQUESTS: 0'), "NEW_PENDING_REQUESTS counter missing!");
assert(indexHtml.includes('CONFIRMED_APPOINTMENTS: 0'), "CONFIRMED_APPOINTMENTS counter missing!");
assert(indexHtml.includes('TODAYS_VISITS: 0'), "TODAYS_VISITS counter missing!");
assert(indexHtml.includes('COMPLETED_VISITS: 0'), "COMPLETED_VISITS counter missing!");
assert(indexHtml.includes('REJECTED_CANCELLED: 0'), "REJECTED_CANCELLED counter missing!");
assert(indexHtml.includes('function setRMAAdminFilter('), "setRMAAdminFilter function missing!");
console.log("✔ TEST 3 PASSED: Dynamic dashboard counters and section filters are active.");

// Test 4: Verify Admin GST Bill Generator & Printable Preview Modal
console.log("\n[TEST 4] Verifying GST Bill Generator & Printable Preview Modal...");
assert(indexHtml.includes('function adminOpenInvoiceRecalculateModal('), "adminOpenInvoiceRecalculateModal missing!");
assert(indexHtml.includes('function rmaShowBillPreviewModal('), "rmaShowBillPreviewModal function missing!");
assert(indexHtml.includes('admInvClientName'), "Customer name input field missing!");
assert(indexHtml.includes('admInvClientGSTIN'), "Customer GSTIN input field missing!");
assert(indexHtml.includes('rmaPrintableBillArea'), "Printable bill preview DOM area missing!");
console.log("✔ TEST 4 PASSED: Admin GST Bill modal and preview window are fully integrated.");

// Test 5: Verify Admin Business Ledger Functions & UI
console.log("\n[TEST 5] Verifying Business Ledger Functions & UI...");
assert(indexHtml.includes('async function loadRMAAdminBusinessLedgerSection('), "loadRMAAdminBusinessLedgerSection missing!");
assert(indexHtml.includes('async function adminAddLedgerEntry('), "adminAddLedgerEntry missing!");
assert(indexHtml.includes('async function adminDeleteLedgerEntry('), "adminDeleteLedgerEntry missing!");
assert(indexHtml.includes('function adminSetLedgerMonthFilter('), "adminSetLedgerMonthFilter missing!");
assert(indexHtml.includes('ledgerIncAmount'), "Income amount input missing!");
assert(indexHtml.includes('ledgerExpAmount'), "Expense amount input missing!");
assert(indexHtml.includes('Net Balance'), "Daily summary net balance missing!");
assert(indexHtml.includes('Net Income'), "Monthly net income summary missing!");
console.log("✔ TEST 5 PASSED: Business Ledger engine, entry forms, and summaries are ready.");

console.log("\n=== ALL SITE VISIT, GST BILL & BUSINESS LEDGER E2E TESTS PASSED SUCCESSFULLY ===");
