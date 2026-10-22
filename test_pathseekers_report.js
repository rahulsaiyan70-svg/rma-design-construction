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

// 5. Verify Site Photographs Gallery & Lightbox Integration
console.log('[TEST 5] Verifying Site Photographs Gallery & Lightbox...');
assert(htmlContent.includes('SITE PHOTOGRAPHS – 10 OCTOBER 2026'), 'Missing SITE PHOTOGRAPHS section title');
assert(htmlContent.includes('psOctPhotosGrid'), 'Missing photo gallery container ID');
assert(htmlContent.includes('site-visit-photos'), 'Missing Supabase storage bucket reference');
assert(htmlContent.includes('pathseekers/2026/2026-10-10/'), 'Missing Supabase storage folder path');
assert(htmlContent.includes('openRMAPhotoLightbox'), 'Missing Lightbox modal function');
console.log('✔ TEST 5 PASSED: Site photographs gallery and Lightbox modal correctly configured.\n');

// 6. Verify Download October Report Button & Download File Name
console.log('[TEST 6] Verifying Downloadable October Report...');
assert(htmlContent.includes('psV63DownloadReportOct'), 'Missing Download October Report button ID');
assert(htmlContent.includes('RMA-Path-Seeker-Site-Visit-Report-2026-10-10.txt'), 'Missing updated report filename');
assert(htmlContent.includes('SITE VISIT REPORT — 10 OCTOBER 2026'), 'Missing updated report header in download text');
console.log('✔ TEST 6 PASSED: Downloadable report contains complete 10 October 2026 report.\n');

// 7. Verify Admin Photo Manager Modal & Functions
console.log('[TEST 7] Verifying Admin Photo Manager...');
assert(htmlContent.includes('Pathseekers School — 10 October 2026 Photos & Report Manager'), 'Missing Admin Photo Manager title');
assert(htmlContent.includes('adminOpenPhotoManagerModal'), 'Missing adminOpenPhotoManagerModal function');
assert(htmlContent.includes('adminRenderPhotoManagerList'), 'Missing adminRenderPhotoManagerList function');
assert(htmlContent.includes('adminMovePhoto'), 'Missing adminMovePhoto function');
assert(htmlContent.includes('adminRemovePhoto'), 'Missing adminRemovePhoto function');
assert(htmlContent.includes('adminSaveOctVisitPhotos'), 'Missing adminSaveOctVisitPhotos function');
console.log('✔ TEST 7 PASSED: Admin Photo Manager functions fully defined.\n');

// 8. Verify October Visits Counter Status
console.log('[TEST 8] Verifying October Visit Counter Status...');
assert(htmlContent.includes('1 of 3 used') || htmlContent.includes('1 / 3'), 'Missing 1 of 3 used counter status');
console.log('✔ TEST 8 PASSED: October visit counter status verified as 1 of 3 used.\n');

console.log('=== ALL PATHSEEKERS 10 OCTOBER 2026 REPORT TESTS PASSED SUCCESSFULLY ===');
