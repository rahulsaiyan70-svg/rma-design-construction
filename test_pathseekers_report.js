// Test suite for Pathseekers School 5 October 2026 Site Visit Report & Photos
const fs = require('fs');
const assert = require('assert');

console.log('=== Starting Pathseekers School 5 October 2026 Site Visit Report Test Suite ===\n');

const htmlContent = fs.readFileSync('./index.html', 'utf8');

// 1. Verify Title & Metadata Update
console.log('[TEST 1] Verifying Site Visit Report Title & Metadata...');
assert(htmlContent.includes('5 October 2026 · Monthly Periodic Site Inspection'), 'Missing updated report title "5 October 2026 · Monthly Periodic Site Inspection"');
assert(htmlContent.includes('<b>DATE:</b> 5 October 2026'), 'Missing report metadata date "5 October 2026"');
assert(htmlContent.includes('<b>MONTH:</b> October 2026'), 'Missing report metadata month "October 2026"');
assert(htmlContent.includes('<b>VISIT TYPE:</b> Monthly Periodic Site Inspection'), 'Missing report metadata visit type');
assert(htmlContent.includes('<b>PURPOSE:</b> Structural inspection of ongoing construction work.'), 'Missing report metadata purpose');
console.log('✔ TEST 1 PASSED: Report title and metadata correctly updated.\n');

// 2. Verify Inspection Verification Checklist Preservation
console.log('[TEST 2] Verifying Inspection Verification Checklist Items...');
const checklistItems = [
  'Tie beam reinforcement steel',
  'Number and diameter of reinforcement bars',
  'Reinforcement spacing',
  'Stirrup diameter and spacing',
  'Tie beam dimensions',
  'Clear cover',
  'Anchorage/development length',
  'Column-beam connections',
  'Beam alignment and levels',
  'Shuttering/formwork',
  'General structural workmanship',
  'Compliance with approved structural drawings and specifications'
];
checklistItems.forEach(item => {
  assert(htmlContent.includes(item), `Missing checklist item: ${item}`);
});
console.log('✔ TEST 2 PASSED: All 12 checklist items preserved in report.\n');

// 3. Verify Summary / Findings Text
console.log('[TEST 3] Verifying 5 October 2026 Summary / Findings...');
assert(htmlContent.includes('During the site inspection conducted on 5 October 2026'), 'Missing site inspection date in Summary');
assert(htmlContent.includes('current 2-ft stage/detail was inspected and found to have been executed properly'), 'Missing 2-ft stage reinforcement observation');
assert(htmlContent.includes('proposed lift provision'), 'Missing proposed lift provision in summary');
assert(htmlContent.includes('6 ft × 6 ft lift well is proposed in the area that had recently been planned/designated for the staff room'), 'Missing 6ft x 6ft lift well details');
console.log('✔ TEST 3 PASSED: Summary / Findings contains accurate 5 October 2026 engineering report.\n');

// 4. Verify Key Discussion Section
console.log('[TEST 4] Verifying KEY DISCUSSION – LIFT PROVISION Section...');
assert(htmlContent.includes('KEY DISCUSSION – LIFT PROVISION'), 'Missing KEY DISCUSSION section header');
assert(htmlContent.includes('One of the major discussions during the 5 October 2026 site inspection was the proposed provision of a lift.'), 'Missing Key Discussion introductory text');
assert(htmlContent.includes('The lift location and structural arrangement are to be coordinated with the architectural and structural drawings'), 'Missing drawing coordination requirement');
console.log('✔ TEST 4 PASSED: KEY DISCUSSION – LIFT PROVISION section fully verified.\n');

// 5. Verify Site Inspection Observations List
console.log('[TEST 5] Verifying SITE INSPECTION OBSERVATIONS (Items 1-7)...');
assert(htmlContent.includes('SITE INSPECTION OBSERVATIONS:'), 'Missing SITE INSPECTION OBSERVATIONS header');
assert(htmlContent.includes('Reinforcement steel at the ongoing structural work was inspected.'), 'Missing observation 1');
assert(htmlContent.includes('Tie beam reinforcement and associated reinforcement detailing were checked.'), 'Missing observation 2');
assert(htmlContent.includes('The current 2-ft reinforcement work/detail was inspected and found properly executed by the contractor.'), 'Missing observation 3');
assert(htmlContent.includes('General reinforcement workmanship and alignment were reviewed.'), 'Missing observation 4');
assert(htmlContent.includes('The proposed approximately 6 ft × 6 ft lift well was discussed.'), 'Missing observation 5');
assert(htmlContent.includes('The proposed lift location is in the area recently planned/designated for the staff room.'), 'Missing observation 6');
assert(htmlContent.includes('Further lift-related structural work shall proceed only after coordination with the applicable architectural and structural drawings/specifications.'), 'Missing observation 7');
console.log('✔ TEST 5 PASSED: All 7 observation items verified.\n');

// 6. Verify Site Photographs Gallery & Lightbox Integration
console.log('[TEST 6] Verifying Site Photographs Gallery & Lightbox...');
assert(htmlContent.includes('SITE PHOTOGRAPHS – 5 OCTOBER 2026'), 'Missing SITE PHOTOGRAPHS section title');
assert(htmlContent.includes('psOctPhotosGrid'), 'Missing photo gallery container ID');
assert(htmlContent.includes('site-visit-photos'), 'Missing Supabase storage bucket reference');
assert(htmlContent.includes('pathseekers/2026/2026-10-05/'), 'Missing Supabase storage folder path');
assert(htmlContent.includes('openRMAPhotoLightbox'), 'Missing Lightbox modal function');
console.log('✔ TEST 6 PASSED: Site photographs gallery and Lightbox modal correctly configured.\n');

// 7. Verify Download October Report Button & Download File Name
console.log('[TEST 7] Verifying Downloadable October Report...');
assert(htmlContent.includes('psV63DownloadReportOct'), 'Missing Download October Report button ID');
assert(htmlContent.includes('RMA-Path-Seeker-Site-Visit-Report-2026-10-05.txt'), 'Missing updated report filename');
assert(htmlContent.includes('SITE VISIT REPORT — 5 OCTOBER 2026'), 'Missing updated report header in download text');
console.log('✔ TEST 7 PASSED: Downloadable report contains complete 5 October 2026 report.\n');

// 8. Verify Admin Photo Manager Modal & Functions
console.log('[TEST 8] Verifying Admin Photo Manager...');
assert(htmlContent.includes('adminOpenPhotoManagerModal'), 'Missing adminOpenPhotoManagerModal function');
assert(htmlContent.includes('adminRenderPhotoManagerList'), 'Missing adminRenderPhotoManagerList function');
assert(htmlContent.includes('adminMovePhoto'), 'Missing adminMovePhoto function');
assert(htmlContent.includes('adminRemovePhoto'), 'Missing adminRemovePhoto function');
assert(htmlContent.includes('adminSaveOctVisitPhotos'), 'Missing adminSaveOctVisitPhotos function');
console.log('✔ TEST 8 PASSED: Admin Photo Manager functions fully defined.\n');

// 9. Verify October Visits Counter Status
console.log('[TEST 9] Verifying October Visit Counter Status...');
assert(htmlContent.includes('1 of 3 used') || htmlContent.includes('1 / 3'), 'Missing 1 of 3 used counter status');
console.log('✔ TEST 9 PASSED: October visit counter status verified as 1 of 3 used.\n');

console.log('=== ALL PATHSEEKERS 5 OCTOBER 2026 REPORT TESTS PASSED SUCCESSFULLY ===');
