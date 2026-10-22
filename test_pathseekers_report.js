// Test suite for Pathseeker International Schools Reports (15 Sep, 5 Oct, 10 Oct 2026) & Stats
const fs = require('fs');
const assert = require('assert');

console.log('=== Starting Pathseeker International Schools Site Visit Reports Test Suite ===\n');

const htmlContent = fs.readFileSync('./index.html', 'utf8');

// 1. Verify 10 October 2026 Report
console.log('[TEST 1] Verifying 10 October 2026 Site Visit Report & Metadata...');
assert(htmlContent.includes('10 October 2026 · Site Visit Report'), 'Missing 10 October 2026 report title');
assert(htmlContent.includes('<b>DATE:</b> 10 October 2026'), 'Missing 10 October 2026 metadata date');
assert(htmlContent.includes('A. Discussion Regarding Staircase Modifications'), 'Missing Section A in 10 October report');
assert(htmlContent.includes('B. Architectural Adjustments Required'), 'Missing Section B in 10 October report');
assert(htmlContent.includes('C. Site Progress Observed'), 'Missing Section C in 10 October report');
assert(htmlContent.includes('SITE PHOTOGRAPHS – 10 OCTOBER 2026'), 'Missing 10 October site photos title');
assert(htmlContent.includes('ps10OctPhotosGrid'), 'Missing ps10OctPhotosGrid container ID');
assert(htmlContent.includes('psV63DownloadReportOct10'), 'Missing 10 October download button ID');
assert(htmlContent.includes('RMA-Path-Seeker-Site-Visit-Report-2026-10-10.txt'), 'Missing 10 October report download filename');
console.log('✔ TEST 1 PASSED: 10 October 2026 report verified.\n');

// 2. Verify 5 October 2026 Report Restoration
console.log('[TEST 2] Verifying 5 October 2026 Monthly Periodic Site Inspection Report...');
assert(htmlContent.includes('5 October 2026 · Monthly Periodic Site Inspection'), 'Missing restored 5 October 2026 report title');
assert(htmlContent.includes('<b>DATE:</b> 5 October 2026'), 'Missing 5 October 2026 metadata date');
assert(htmlContent.includes('INSPECTION VERIFICATION CHECKLIST:'), 'Missing 5 October inspection checklist');
assert(htmlContent.includes('SUMMARY / FINDINGS:'), 'Missing 5 October summary / findings');
assert(htmlContent.includes('KEY DISCUSSION – LIFT PROVISION:'), 'Missing 5 October key discussion section');
assert(htmlContent.includes('SITE INSPECTION OBSERVATIONS:'), 'Missing 5 October site inspection observations');
assert(htmlContent.includes('SITE PHOTOGRAPHS – 5 OCTOBER 2026'), 'Missing 5 October site photos title');
assert(htmlContent.includes('ps5OctPhotosGrid'), 'Missing ps5OctPhotosGrid container ID');
assert(htmlContent.includes('psV63DownloadReportOct5'), 'Missing 5 October download button ID');
assert(htmlContent.includes('RMA-Path-Seeker-Site-Visit-Report-2026-10-05.txt'), 'Missing 5 October report download filename');
console.log('✔ TEST 2 PASSED: 5 October 2026 report restored and verified.\n');

// 3. Verify 15 September 2026 Report
console.log('[TEST 3] Verifying 15 September 2026 Site Visit Report...');
assert(htmlContent.includes('15 September 2026 · Site Visit Report'), 'Missing 15 September 2026 report title');
assert(htmlContent.includes('After a two-month rainy-season break, work resumed'), 'Missing 15 September 2026 report body text');
assert(htmlContent.includes('psV63DownloadReport'), 'Missing 15 September download button ID');
assert(htmlContent.includes('RMA-Path-Seeker-Site-Visit-Report-2026-09-15.txt'), 'Missing 15 September report download filename');
console.log('✔ TEST 3 PASSED: 15 September 2026 report verified.\n');

// 4. Verify Photo Datasets & Renderers Separation
console.log('[TEST 4] Verifying Photo Datasets Separation & Gallery Functions...');
assert(htmlContent.includes('window.ps10Oct2026Photos'), 'Missing window.ps10Oct2026Photos');
assert(htmlContent.includes('window.ps5Oct2026Photos'), 'Missing window.ps5Oct2026Photos');
assert(htmlContent.includes('window.renderPathseeker10Oct2026Photos'), 'Missing window.renderPathseeker10Oct2026Photos');
assert(htmlContent.includes('window.renderPathseeker5Oct2026Photos'), 'Missing window.renderPathseeker5Oct2026Photos');
assert(htmlContent.includes('pathseekers/2026/2026-10-10/'), 'Missing 10 October storage path');
assert(htmlContent.includes('pathseekers/2026/2026-10-05/'), 'Missing 5 October storage path');
console.log('✔ TEST 4 PASSED: Separate photo datasets and gallery renderers verified.\n');

// 5. Verify Completed Visit Count & Monthly Counter
console.log('[TEST 5] Verifying Completed Visit Count (25) & Monthly Counter (2 of 3 used)...');
assert(htmlContent.includes('TOTAL COMPLETED VISITS</span><strong>25</strong>'), 'Missing TOTAL COMPLETED VISITS stat 25');
assert(htmlContent.includes('Total completed site visits</b><span>25</span>'), 'Missing Total completed site visits summary 25');
assert(htmlContent.includes('2 of 3 used'), 'Missing 2 of 3 used counter text');
assert(htmlContent.includes('2 / 3'), 'Missing 2 / 3 counter text');
console.log('✔ TEST 5 PASSED: Completed visit count (25) and October counter (2 of 3 used) verified.\n');

console.log('=== ALL PATHSEEKER SITE VISIT REPORT & COUNTER TESTS PASSED SUCCESSFULLY ===');
