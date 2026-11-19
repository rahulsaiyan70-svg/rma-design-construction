// Comprehensive test suite for Pathseeker International Schools Site Visit Reports (15 Sep, 5 Oct, 10 Oct 2026) & Photo Array Isolation
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('=== Starting Pathseekers School Site Visit Reports & Photo Array Isolation Test Suite ===\n');

const htmlContent = fs.readFileSync('./index.html', 'utf8');
const visit27Migration = fs.readFileSync('./supabase/migrations/20261119000000_pathseeker_visit_27_unique_ids.sql', 'utf8');
const secureSiteVisitsMigration = fs.readFileSync('./supabase/migrations/20261120000000_secure_site_visits.sql', 'utf8');
const siteVisitFunction = fs.readFileSync('./supabase/functions/pathseeker-site-visit/index.ts', 'utf8');

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

// 7. Verify Completed Visits Count & November Visits Counter
console.log('[TEST 7] Verifying Completed Visit Count (27) & November Counter (1 of 3)...');
assert(htmlContent.includes('1 of 3 completed') && htmlContent.includes('1 / 3'), 'Missing November 1 of 3 completed counter');
assert(htmlContent.includes('TOTAL COMPLETED VISITS</span><strong>27</strong>'), 'Missing dashboard total completed visit count of 27');
assert(htmlContent.includes('Total completed site visits</b><span>27</span>'), 'Missing Site Visits total completed count of 27');
console.log('✔ TEST 7 PASSED: Completed visits count (27) & November counter (1 of 3) verified.\n');

// 7b. Verify Site Visit No. 26 Report Title, Metadata & Content
console.log('[TEST 7b] Verifying Site Visit No. 26 Report & Detailed Sections...');
assert(htmlContent.includes('Site Visit No. 26 – Revised Planning and On-Site Coordination'), 'Missing Site Visit No. 26 Report title');
assert(htmlContent.includes('<b>SITE VISIT NUMBER:</b> 26'), 'Missing report metadata site visit number 26');
assert(htmlContent.includes('<b>DATE:</b> 28th'), 'Missing report metadata date 28th');
assert(htmlContent.includes('<b>TIME:</b> 2:30 PM'), 'Missing report metadata time 2:30 PM');
assert(htmlContent.includes('<b>STATUS:</b> Completed'), 'Missing report metadata status Completed');
assert(htmlContent.includes('<b>VISIT TYPE:</b> Client-requested site visit'), 'Missing report metadata visit type');
assert(htmlContent.includes('A. Revised Plan and New Changes'), 'Missing Section A in Site Visit 26');
assert(htmlContent.includes('B. Staircase Arrangements'), 'Missing Section B in Site Visit 26');
assert(htmlContent.includes('C. Lift Provision'), 'Missing Section C in Site Visit 26');
assert(htmlContent.includes('D. Pillar and Structural Arrangements'), 'Missing Section D in Site Visit 26');
assert(htmlContent.includes('CLIENT AND CONTRACTOR COORDINATION'), 'Missing client and contractor coordination section');
assert(htmlContent.includes('FINAL REPORT / CLIENT-FACING SUMMARY'), 'Missing final report summary section');
assert(htmlContent.includes('psV63DownloadReportOct28'), 'Missing download button for Site Visit No. 26');
assert(!htmlContent.includes('syncPathSeekerSiteVisit26'), 'Site Visit No. 26 must not be auto-written from the browser');
console.log('✔ TEST 7b PASSED: Site Visit No. 26 verified successfully.\n');

// 7c. Verify the 17 November 2026 report and secure persistence path
console.log('[TEST 7c] Verifying 17 November Site Visit No. 27 and secure persistence...');
assert(htmlContent.includes('Site Visit No. 27 — Construction Progress Inspection'), 'Missing Site Visit No. 27 report title');
assert(htmlContent.includes('Tuesday, 17 November 2026'), 'Missing latest visit date');
assert(htmlContent.includes('Shri Nimrandeep Singh Ji — Representative of the School.'), 'Missing school representative');
assert(htmlContent.includes('Rahul Bhatti — Engineer, RMA Design and Construction.'), 'Missing RMA engineer');
assert(htmlContent.includes('Construction work up to a height of 8 feet had already been completed.'), 'Missing 8-foot construction progress observation');
assert(htmlContent.includes('Column filling above the 8-foot level was in progress.'), 'Missing column-filling observation');
assert(htmlContent.includes('everything was satisfactory up to the date of inspection.'), 'Missing engineer remarks');
assert(htmlContent.includes('RMA-SV-PSIS-27'), 'Missing stable request ID for duplicate prevention');
assert(htmlContent.includes('The report is shown here, but Supabase could not confirm the record.'), 'Failed database save must be visible in the report card');
assert(htmlContent.includes('The report is shown here, but no matching saved Supabase record was found.'), 'Missing unsaved report state');
assert(htmlContent.includes('Report verified in the Supabase site visit record.'), 'Report card must distinguish confirmed persistence');
assert(visit27Migration.includes('idx_bookings_psis_sv27_request_id'), 'Missing booking uniqueness index for Site Visit No. 27');
assert(!visit27Migration.includes('site_visit_reports'), 'Visit migration must not reference site_visit_reports');
assert((visit27Migration.match(/WHERE request_id = 'RMA-SV-PSIS-27'/g) || []).length === 1, 'Booking uniqueness index must be scoped to the stable visit 27 ID');
assert(!htmlContent.includes('syncPathSeekerSiteVisit27'), 'Site Visit No. 27 must not be written directly by the browser');
assert(!/\.from\(['"]site_visits['"]\)\s*\.(?:insert|update|upsert)\s*\(/.test(htmlContent), 'The browser must not mutate site_visits directly');
assert(!/\.from\(['"]site_visit_reports['"]\)\s*\.(?:insert|update)\s*\(/.test(htmlContent), 'The browser must not create or modify site visit reports directly');
assert(htmlContent.includes("functions.invoke('pathseeker-site-visit'"), 'Portal must use the authorized Edge Function');
assert(htmlContent.includes("body: {action: 'publish_visit_27'}"), 'Staff publish action is missing');
assert(htmlContent.includes("body: {action: 'read_visit_27'}"), 'Client own-report read action is missing');
assert(htmlContent.includes('rmaEngineerSiteVisitPortal') && htmlContent.includes("role==='engineer'&&profile?.active===true"), 'Active engineers must have a dedicated report workflow');
assert(!htmlContent.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Service-role key must not appear in frontend code');
assert(siteVisitFunction.includes('supabase.auth.getUser(tokenMatch[1])'), 'Edge Function must validate the user token');
assert(siteVisitFunction.includes('profile?.active !== true'), 'Edge Function must reject inactive staff profiles');
assert(siteVisitFunction.includes('role !== "admin" && role !== "engineer"'), 'Edge Function must restrict writes to administrators and engineers');
assert(siteVisitFunction.includes('.eq("client_user_id", authData.user.id)'), 'Client read must be scoped to the authenticated booking owner');
assert(siteVisitFunction.includes('.eq("request_id", REQUEST_ID)'), 'Staff write must target the stable Pathseeker booking');
assert(siteVisitFunction.includes('.from("site_visits")'), 'Edge Function must persist to the existing site_visits table');
assert(siteVisitFunction.includes('action === "save_uploaded_report"'), 'Existing report uploads must use the authorized server workflow');
assert(secureSiteVisitsMigration.includes('AS RESTRICTIVE'), 'Migration must add a restrictive site visit read boundary');
assert(secureSiteVisitsMigration.includes('b.client_user_id = (SELECT auth.uid())'), 'RLS read policy must scope clients to their own booking');
assert(secureSiteVisitsMigration.includes('REVOKE ALL PRIVILEGES ON TABLE public.site_visits FROM PUBLIC, anon, authenticated'), 'Direct ordinary-role access must be revoked');
assert(secureSiteVisitsMigration.includes('REVOKE ALL PRIVILEGES ON TABLE public.site_visit_reports FROM PUBLIC, anon, authenticated'), 'Legacy report table writes must be revoked when that table exists');
assert(secureSiteVisitsMigration.includes('GRANT SELECT, INSERT, UPDATE ON TABLE public.site_visits TO service_role'), 'Server-side role must retain required site visit access');
assert(!/DROP POLICY|DISABLE ROW LEVEL SECURITY/i.test(secureSiteVisitsMigration), 'Migration must not drop policies or disable RLS');
assert(htmlContent.includes('psV63DownloadReportNov17'), 'Missing 17 November report download control');
assert(htmlContent.includes('publishPathSeekerSiteVisit27'), 'Staff portal publish action is missing');
console.log('✔ TEST 7c PASSED: Site Visit No. 27 content and persistence path verified.\n');

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
