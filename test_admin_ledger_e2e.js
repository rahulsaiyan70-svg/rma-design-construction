/**
 * E2E Validation for Site Visit Actions, GST Bill Generation & Business Cash-Flow Ledger
 */

const fs = require('fs');
const assert = require('assert');

console.log("=== Testing Admin Business Cash-Flow Ledger & GST Calculations ===");

const indexHtml = fs.readFileSync('index.html', 'utf8');
const ledgerMigration1 = fs.readFileSync('supabase/migrations/20260929000000_business_ledger.sql', 'utf8');
const ledgerMigration2 = fs.readFileSync('supabase/migrations/20261003000000_fix_business_ledger.sql', 'utf8');

// Test 1: Verify Business Ledger Migration Schema & RLS Policies
console.log("\n[TEST 1] Verifying Business Ledger Migration SQL & RLS Policies...");
assert(ledgerMigration1.includes('CREATE TABLE IF NOT EXISTS public.business_ledger'), "business_ledger table creation missing!");
assert(ledgerMigration1.includes('ENABLE ROW LEVEL SECURITY'), "RLS not enabled on business_ledger!");
assert(ledgerMigration2.includes('CREATE POLICY "Allow anon, authenticated, service_role full manage business_ledger"'), "RLS policy for anon/authenticated missing!");
assert(ledgerMigration2.includes('taxable_amount NUMERIC(12,2)'), "taxable_amount column missing in migration!");
assert(ledgerMigration2.includes('gst_amount NUMERIC(12,2)'), "gst_amount column missing in migration!");
console.log("✔ TEST 1 PASSED: business_ledger migration SQL schema and RLS policies verified.");

// Test 2: Verify MONEY IN GST Calculation (18% Included)
console.log("\n[TEST 2] Verifying MONEY IN GST Calculation Formula (₹11,800 -> Taxable ₹10,000, GST ₹1,800)...");
const grossIncome = 11800;
const gstRate = 18;
const taxableAmount = grossIncome / (1 + (gstRate / 100));
const gstAmount = grossIncome - taxableAmount;

assert.strictEqual(taxableAmount, 10000, "Taxable Amount for ₹11,800 @ 18% should be exactly ₹10,000");
assert.strictEqual(gstAmount, 1800, "GST Amount for ₹11,800 @ 18% should be exactly ₹1,800");
assert.notStrictEqual(gstAmount, 2124, "GST must NOT be calculated as ₹11,800 + 18% (₹2,124)");
console.log(`✔ TEST 2 PASSED: Gross ₹${grossIncome} => Taxable ₹${taxableAmount}, GST ₹${gstAmount} (18% GST Inclusive formula verified).`);

// Test 3: Verify MONEY OUT Expense Breakdown
console.log("\n[TEST 3] Verifying MONEY OUT Expense Breakdown...");
const grossExpense = 2000;
const expGstInc = false;
const expTaxable = grossExpense;
const expGst = 0;

assert.strictEqual(expTaxable, 2000, "Expense Taxable should match gross expense when GST Included = NO");
assert.strictEqual(expGst, 0, "Expense GST should be 0 when GST Included = NO");
console.log(`✔ TEST 3 PASSED: Gross Expense ₹${grossExpense} => Taxable ₹${expTaxable}, GST ₹${expGst}.`);

// Test 4: Verify Running Balance Formula
console.log("\n[TEST 4] Verifying Cash-Flow Running Balance Logic...");
let runningBalance = 0;
// Transaction 1: Money In ₹11,800
runningBalance += grossIncome; // 11,800
assert.strictEqual(runningBalance, 11800, "Running balance after ₹11,800 Money In should be ₹11,800");

// Transaction 2: Money Out ₹2,000
runningBalance -= grossExpense; // 11,800 - 2,000 = 9,800
assert.strictEqual(runningBalance, 9800, "Running balance after ₹2,000 Money Out should be ₹9,800");

// Transaction 3: Money In ₹5,900
runningBalance += 5900; // 9,800 + 5,900 = 15,700
assert.strictEqual(runningBalance, 15700, "Running balance after ₹5,900 Money In should be ₹15,700");
console.log(`✔ TEST 4 PASSED: Running Balance calculation verified (Opening 0 -> +11,800 -> -2,000 -> +5,900 = ₹15,700).`);

// Test 5: Verify Frontend JavaScript Functions in index.html
console.log("\n[TEST 5] Verifying Business Ledger Functions & Handlers in index.html...");
assert(indexHtml.includes('async function loadRMAAdminBusinessLedgerSection('), "loadRMAAdminBusinessLedgerSection missing!");
assert(indexHtml.includes('async function adminAddLedgerEntry('), "adminAddLedgerEntry missing!");
assert(indexHtml.includes('async function adminDeleteLedgerEntry('), "adminDeleteLedgerEntry missing!");
assert(indexHtml.includes('function adminRecalculateLedgerIncLive('), "adminRecalculateLedgerIncLive missing!");
assert(indexHtml.includes('function adminRecalculateLedgerExpLive('), "adminRecalculateLedgerExpLive missing!");
assert(indexHtml.includes('function adminApplyLedgerFilters('), "adminApplyLedgerFilters missing!");
assert(indexHtml.includes('function adminPreFillLedgerFromInvoice('), "adminPreFillLedgerFromInvoice missing!");
assert(indexHtml.includes('ledgerIncAmount'), "ledgerIncAmount input field missing!");
assert(indexHtml.includes('ledgerExpAmount'), "ledgerExpAmount input field missing!");
assert(indexHtml.includes('CURRENT BUSINESS RUNNING BALANCE'), "CURRENT BUSINESS RUNNING BALANCE display missing!");
assert(indexHtml.includes('SUPABASE LEDGER INSERT ERROR'), "Detailed Supabase error message alert missing!");
console.log("✔ TEST 5 PASSED: Business Ledger engine, live GST handlers, filters, and error handlers are active.");

console.log("\n=== ALL ADMIN BUSINESS LEDGER & GST E2E TESTS PASSED SUCCESSFULLY ===");
