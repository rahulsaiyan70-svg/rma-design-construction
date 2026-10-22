// Test suite for Pathseeker International Schools 10 October 2026 Site Visit Report & Photos
const fs = require('fs');
const assert = require('assert');

console.log('=== Starting Pathseekers School 10 October 2026 Site Visit Report Test Suite ===\n');

const htmlContent = fs.readFileSync('./index.html', 'utf8');

// 1. Verify Title & Metadata Update
console.log('[TEST 1] Verifying Site Visit Report Title & Metadata...');
assert(htmlContent.includes('10 October 2026 · Site Visit Report'), 'Missing updated report title "10 October 2026 · Site Visit Report"');
assert(htmlContent.includes('<b>DATE:</b> 10 October 2026'), 'Missing report metadata date "10 October 2026"');
assert(htmlContent.includes('<b>PROJECT:</b> Pathseeker International Schools'), 'Missing report metadata project name');
assert(htmlContent.includes('<b>CONSULTANT:</b> RMA Design & Construction'), 'Missing report metadata consultant');
assert(htmlContent.includes('<b>VISIT PURPOSE:</b> Review of architectural drawings and discussion of proposed staircase modifications.'), 'Missing report metadata visit purpose');
console.log('✔ TEST 1 PASSED: Report title and metadata correctly updated.\n');

// 2. Verify Section A: Discussion Regarding Staircase Modifications
console.log('[TEST 2] Verifying Section A: Discussion Regarding Staircase Modifications...');
assert(htmlContent.includes('A. Discussion Regarding Staircase Modifications'), 'Missing Section A header');
assert(htmlContent.includes('eliminate the staircase from the central portion of the building'), 'Missing central staircase elimination text');
assert(htmlContent.includes('constructing staircases outside the building was found to be unsuitable'), 'Missing unsuitability of external staircases text');
assert(htmlContent.includes('two staircases at the two opposite side corners of the building: one at the right corner and one at the left corner'), 'Missing opposite corner staircases text');
console.log('✔ TEST 2 PASSED: Section A content verified successfully.\n');

// 3. Verify Section B: Architectural Adjustments Required
console.log('[TEST 3] Verifying Section B: Architectural Adjustments Required...');
assert(htmlContent.includes('B. Architectural Adjustments Required'), 'Missing Section B header');
assert(htmlContent.includes('medical room and the staff-room washroom will need to be reconsidered'), 'Missing room layout reconsideration text');
assert(htmlContent.includes('revised architectural drawing is to be prepared incorporating the agreed changes'), 'Missing revised architectural drawing requirement');
assert(htmlContent.includes('Treat these changes as the agreed design direction from the site discussion'), 'Missing design direction status disclaimer');
console.log('✔ TEST 3 PASSED: Section B content verified successfully.\n');

// 4. Verify Section C: Site Progress Observed
console.log('[TEST 4] Verifying Section C: Site Progress Observed...');
assert(htmlContent.includes('C. Site Progress Observed'), 'Missing Section C header');
assert(htmlContent.includes('carrying out filling work in the plinth/tie beam area'), 'Missing site progress filling work text');
console.log('✔ TEST 4 PASSED: Section C content verified successfully.\n');

// 5. Verify Site Photographs Gallery & Lightbox Integration on 5 October Report
console.log('[TEST 5] Verifying Site Photographs Gallery & Lightbox on 5 October Report...');
assert(htmlContent.includes('SITE PHOTOGRAPHS – 5 OCTOBER 2026'), 'Missing SITE PHOTOGRAPHS section title');
assert(htmlContent.includes('psOctPhotosGrid'), 'Missing photo gallery container ID');
assert(htmlContent.includes('site-visit-photos'), 'Missing Supabase storage bucket reference');
assert(htmlContent.includes('openRMAPhotoLightbox'), 'Missing Lightbox modal function');
console.log('✔ TEST 5 PASSED: Site photographs gallery attached to 5 October report and Lightbox modal correctly configured.\n');

// 6. Verify Preserved Reports & Downloadable October Reports
console.log('[TEST 6] Verifying All 3 Preserved Site Visit Reports (15 Sep, 5 Oct, 10 Oct)...');
assert(htmlContent.includes('15 September 2026 · Site Visit Report'), 'Missing 15 September 2026 report');
assert(htmlContent.includes('5 October 2026 · Monthly Periodic Site Inspection'), 'Missing 5 October 2026 report');
assert(htmlContent.includes('10 October 2026 · Site Visit Report'), 'Missing 10 October 2026 report');
assert(htmlContent.includes('psV63DownloadReportOct10'), 'Missing Download 10 October Report button ID');
assert(htmlContent.includes('psV63DownloadReportOct5'), 'Missing Download 5 October Report button ID');
assert(htmlContent.includes('RMA-Path-Seeker-Site-Visit-Report-2026-10-10.txt'), 'Missing 10 October report filename');
assert(htmlContent.includes('RMA-Path-Seeker-Site-Visit-Report-2026-10-05.txt'), 'Missing 5 October report filename');
console.log('✔ TEST 6 PASSED: All 3 site visit reports preserved with individual download buttons.\n');

// 7. Verify Completed Visits Counter Status (25 Completed Visits, 2 of 3 used in October)
console.log('[TEST 7] Verifying Completed Visits & Monthly Counter Status...');
assert(htmlContent.includes('<strong>25</strong>'), 'Missing 25 total completed visits counter');
assert(htmlContent.includes('2 / 3'), 'Missing 2 / 3 monthly visits counter status');
console.log('✔ TEST 7 PASSED: Completed visits counter verified as 25 total visits and 2 / 3 used for October.\n');

console.log('=== ALL PATHSEEKERS 10 OCTOBER 2026 REPORT TESTS PASSED SUCCESSFULLY ===');
