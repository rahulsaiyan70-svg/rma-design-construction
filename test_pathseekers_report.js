// Comprehensive test suite for Pathseeker International Schools Site Visit Reports (15 Sep, 5 Oct, 10 Oct 2026) & Photo Array Isolation
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('=== Starting Pathseekers School Site Visit Reports & Photo Array Isolation Test Suite ===\n');

const htmlContent = fs.readFileSync('./index.html', 'utf8');

// 1. Verify 10 October Report Title & Metadata
console.log('[TEST 1] Verifying 10 October 2026 Site Visit Report...');
assert(htmlContent.includes('10 October 2026 · Site Visit Report'), 'Missing updated report title "10 October 2026 · Site Visit Report"');
assert(htmlContent.includes('<b>DATE:</b> 10 October 2026'), 'Missing report metadata date "10 October 2026"');
assert(htmlContent.includes('<b>PROJECT:</b> Pathseeker International Schools'), 'Missing report metadata project name');
assert(htmlContent.includes('<b>CONSULTANT:</b> RMA Design & Construction'), 'Missing report metadata consultant');
assert(htmlContent.includes('<b>VISIT PURPOSE:</b> Review of architectural drawings and discussion of proposed staircase modifications.'), 'Missing report metadata visit purpose');
assert(htmlContent.includes('A. Discussion Regarding Staircase Modifications'), 'Missing Section A header in 10 Oct report');
assert(htmlContent.includes('eliminate the staircase from the central portion of the building'), 'Missing central staircase elimination text');
assert(htmlContent.includes('two staircases at the two opposite side corners of the building: one at the right corner and one at the left corner'), 'Missing opposite corner staircases text');
assert(htmlContent.includes('B. Architectural Adjustments Required'), 'Missing Section B header in 10 Oct report');
assert(htmlContent.includes('C. Site Progress Observed'), 'Missing Section C header in 10 Oct report');
console.log('✔ TEST 1 PASSED: 10 October 2026 report verified successfully.\n');

// 2. Verify 5 October Report Restoration
console.log('[TEST 2] Verifying 5 October 2026 Site Visit Report Restoration...');
assert(htmlContent.includes('5 October 2026 · Monthly Periodic Site Inspection'), 'Missing restored report title "5 October 2026 · Monthly Periodic Site Inspection"');
assert(htmlContent.includes('Inspection Verification Checklist:'), 'Missing inspection checklist heading');
assert(htmlContent.includes('Tie beam reinforcement steel'), 'Missing tie beam item');
assert(htmlContent.includes('KEY DISCUSSION – LIFT PROVISION'), 'Missing key discussion lift provision section');
assert(htmlContent.includes('6 ft × 6 ft lift well is proposed in the area that had recently been planned/designated for the staff room'), 'Missing 6ft x 6ft lift well text');
assert(htmlContent.includes('SITE PHOTOGRAPHS – 5 OCTOBER 2026'), 'Missing 5 Oct photographs section header');
console.log('✔ TEST 2 PASSED: 5 October 2026 report restored and verified.\n');

// 3. Verify 15 September Report
console.log('[TEST 3] Verifying 15 September 2026 Site Visit Report...');
assert(htmlContent.includes('15 September 2026 · Site Visit Report'), 'Missing 15 September report title');
assert(htmlContent.includes('combined footing'), 'Missing combined footing text');
assert(htmlContent.includes('proposal to make the beam 2 ft was accepted'), 'Missing 2 ft beam text');
assert(htmlContent.includes('RMA-Path-Seeker-Site-Visit-Report-2026-09-15.txt'), 'Missing September report download filename');
console.log('✔ TEST 3 PASSED: 15 September 2026 report verified.\n');

// 4. Verify Photo Arrays Separation & Lightbox
console.log('[TEST 4] Verifying Photo Arrays Separation & Lightbox...');
assert(htmlContent.includes('SITE PHOTOGRAPHS – 10 OCTOBER 2026'), 'Missing 10 OCT SITE PHOTOGRAPHS section title');
assert(htmlContent.includes('psOctPhotosGrid'), 'Missing 10 Oct photo gallery container ID');
assert(htmlContent.includes('ps5OctPhotosGrid'), 'Missing 5 Oct photo gallery container ID');
assert(htmlContent.includes('ps10Oct2026Photos'), 'Missing ps10Oct2026Photos array');
assert(htmlContent.includes('ps5Oct2026Photos'), 'Missing ps5Oct2026Photos array');
assert(!htmlContent.includes('window.ps5Oct2026Photos = window.ps10Oct2026Photos;'), 'Error: ps5Oct2026Photos must not equal ps10Oct2026Photos');
assert(!htmlContent.includes('window.ps10Oct2026Photos = window.ps5Oct2026Photos;'), 'Error: ps10Oct2026Photos must not equal ps5Oct2026Photos');
assert(htmlContent.includes('renderPathseeker10Oct2026Photos'), 'Missing 10 Oct render function');
assert(htmlContent.includes('renderPathseeker5Oct2026Photos'), 'Missing 5 Oct render function');
assert(htmlContent.includes('openRMAPhotoLightbox'), 'Missing Lightbox modal function');
console.log('✔ TEST 4 PASSED: Photo galleries and separate arrays verified successfully.\n');

// 5. Verify Download Reports
console.log('[TEST 5] Verifying Downloadable October Reports...');
assert(htmlContent.includes('psV63DownloadReportOct'), 'Missing Download October Report button ID');
assert(htmlContent.includes('psV63DownloadReportOct5'), 'Missing Download 5 October Report button ID');
assert(htmlContent.includes('RMA-Path-Seeker-Site-Visit-Report-2026-10-10.txt'), 'Missing 10 Oct report filename');
assert(htmlContent.includes('RMA-Path-Seeker-Site-Visit-Report-2026-10-05.txt'), 'Missing 5 Oct report filename');
console.log('✔ TEST 5 PASSED: Downloadable reports verified.\n');

// 6. Verify Admin Photo Manager
console.log('[TEST 6] Verifying Admin Photo Manager...');
assert(htmlContent.includes('Pathseekers School — 10 October 2026 Photos & Report Manager'), 'Missing Admin Photo Manager title');
assert(htmlContent.includes('adminOpenPhotoManagerModal'), 'Missing adminOpenPhotoManagerModal function');
assert(htmlContent.includes('adminRenderPhotoManagerList'), 'Missing adminRenderPhotoManagerList function');
assert(htmlContent.includes('adminMovePhoto'), 'Missing adminMovePhoto function');
assert(htmlContent.includes('adminRemovePhoto'), 'Missing adminRemovePhoto function');
assert(htmlContent.includes('adminSaveOctVisitPhotos'), 'Missing adminSaveOctVisitPhotos function');
console.log('✔ TEST 6 PASSED: Admin Photo Manager functions verified.\n');

// 7. Verify Completed Visits Count & October Visits Counter
console.log('[TEST 7] Verifying Completed Visit Count (25) & October Counter (2 of 3)...');
assert(htmlContent.includes('2 of 3 used') || htmlContent.includes('2 / 3'), 'Missing 2 of 3 used counter status');
assert(htmlContent.includes('25'), 'Missing total completed visit count of 25');
console.log('✔ TEST 7 PASSED: Completed visits count (25) & October counter (2 of 3) verified.\n');

// 8. Regression Test: Verify JS Photo Array Isolation Logic
console.log('[TEST 8] Verifying Photo Array Isolation via Code Execution...');
const scriptCode = htmlContent.substring(
  htmlContent.indexOf('<script id="rma-v66-site-visit-photos">') + '<script id="rma-v66-site-visit-photos">'.length,
  htmlContent.indexOf('</script>', htmlContent.indexOf('<script id="rma-v66-site-visit-photos">'))
);

const sandbox = {
  window: {},
  document: { getElementById: () => null, body: { appendChild: () => {} } },
  supabaseClient: {},
  console: console
};
vm.createContext(sandbox);
vm.runInContext(scriptCode, sandbox);

assert(Array.isArray(sandbox.window.ps5Oct2026Photos), 'ps5Oct2026Photos should be an array');
assert(Array.isArray(sandbox.window.ps10Oct2026Photos), 'ps10Oct2026Photos should be an array');
assert(sandbox.window.ps5Oct2026Photos !== sandbox.window.ps10Oct2026Photos, 'ps5Oct2026Photos and ps10Oct2026Photos must be distinct array instances');

const initial5OctLen = sandbox.window.ps5Oct2026Photos.length;
const initial10OctLen = sandbox.window.ps10Oct2026Photos.length;

// Mutate 10 Oct photos (e.g. remove one photo)
sandbox.window.ps10Oct2026Photos.pop();

assert.strictEqual(sandbox.window.ps5Oct2026Photos.length, initial5OctLen, 'Modifying 10 Oct photo array must not alter 5 Oct photo array length');
assert.strictEqual(sandbox.window.ps10Oct2026Photos.length, initial10OctLen - 1, '10 Oct photo array length correctly decremented');

console.log('✔ TEST 8 PASSED: Code execution regression test confirmed photo array isolation.\n');

console.log('=== ALL PATHSEEKERS SITE VISIT REPORT & REGRESSION TESTS PASSED SUCCESSFULLY ===');
