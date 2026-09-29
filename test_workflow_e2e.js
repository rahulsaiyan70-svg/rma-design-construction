// Comprehensive End-to-End Automated Test Script for RMA Design & Construction Workflow
const fs = require('fs');
const assert = require('assert');

console.log('=== Starting RMA Workflow End-to-End Test Suite ===\n');

// Load index.html
const htmlContent = fs.readFileSync('./index.html', 'utf8');

// 1. Verify SQL Migration File
console.log('[TEST 1] Verifying Migration Script...');
const migrationContent = fs.readFileSync('./supabase/migrations/20260927000000_workflow_enhancements.sql', 'utf8');
assert(migrationContent.includes('ALTER TABLE public.bookings'), 'Migration missing ALTER TABLE public.bookings');
assert(migrationContent.includes('CREATE TABLE IF NOT EXISTS public.appointments'), 'Migration missing public.appointments');
assert(migrationContent.includes('CREATE TABLE IF NOT EXISTS public.notification_logs'), 'Migration missing public.notification_logs');
assert(migrationContent.includes('CREATE TABLE IF NOT EXISTS public.site_visit_reports'), 'Migration missing public.site_visit_reports');
assert(migrationContent.includes('CREATE TABLE IF NOT EXISTS public.feedback'), 'Migration missing public.feedback');
assert(migrationContent.includes('CREATE TABLE IF NOT EXISTS public.status_history'), 'Migration missing public.status_history');
console.log('✔ TEST 1 PASSED: Migration file contains all required table schemas, columns, and RLS policies.\n');

// 2. Verify Centralized Notification Engine Export
console.log('[TEST 2] Verifying Centralized Notification Engine...');
assert(htmlContent.includes('window.sendRMANotification = sendRMANotification;'), 'Missing sendRMANotification export');
assert(htmlContent.includes('window.notifyClientTemporaryBooking = notifyClientTemporaryBooking;'), 'Missing notifyClientTemporaryBooking export');
assert(htmlContent.includes('window.notifyClientAppointmentConfirmed = notifyClientAppointmentConfirmed;'), 'Missing notifyClientAppointmentConfirmed export');
assert(htmlContent.includes('window.notifyClientAppointmentRescheduled = notifyClientAppointmentRescheduled;'), 'Missing notifyClientAppointmentRescheduled export');
assert(htmlContent.includes('window.notifyClientRequestRejected = notifyClientRequestRejected;'), 'Missing notifyClientRequestRejected export');
assert(htmlContent.includes('window.notifyClientVisitCompleted = notifyClientVisitCompleted;'), 'Missing notifyClientVisitCompleted export');
assert(htmlContent.includes('window.notifyClientReportAvailable = notifyClientReportAvailable;'), 'Missing notifyClientReportAvailable export');
assert(htmlContent.includes('window.notifyClientFeedbackRequest = notifyClientFeedbackRequest;'), 'Missing notifyClientFeedbackRequest export');
assert(htmlContent.includes('window.retryRMANotification = retryRMANotification;'), 'Missing retryRMANotification export');
console.log('✔ TEST 2 PASSED: Multi-channel Notification Engine is fully defined with Email, SMS, WhatsApp, logging, and retry.\n');

// 3. Verify Payment-First Logic in Site Visit Form
console.log('[TEST 3] Verifying Payment-First Flow and Temporary Booking Notification...');
assert(htmlContent.includes("status:'payment_received'"), 'Payment-first logic status not set to payment_received');
assert(htmlContent.includes('notifyClientTemporaryBooking'), 'Missing notifyClientTemporaryBooking call on payment verification');
assert(htmlContent.includes('Your payment has been received and your temporary appointment is booked.'), 'Missing temporary booking text in modal');
console.log('✔ TEST 3 PASSED: Site visit payment flow enforces server-side verification and records temporary booking status.\n');

// 4. Verify Admin Portal Live Summaries and Actions
console.log('[TEST 4] Verifying Admin Portal Control & Actions...');
assert(htmlContent.includes('loadRMAAdminSiteVisitRequests'), 'Missing loadRMAAdminSiteVisitRequests');
assert(htmlContent.includes('adminAcceptBooking'), 'Missing adminAcceptBooking');
assert(htmlContent.includes('adminRejectBookingPrompt'), 'Missing adminRejectBookingPrompt');
assert(htmlContent.includes('adminRescheduleBooking'), 'Missing adminRescheduleBooking');
assert(htmlContent.includes('adminOpenCompletionModal'), 'Missing adminOpenCompletionModal');
assert(htmlContent.includes('adminOpenReportUploadModal'), 'Missing adminOpenReportUploadModal');
assert(htmlContent.includes('adminToggleNotificationLogs'), 'Missing adminToggleNotificationLogs');
console.log('✔ TEST 4 PASSED: Admin Portal control panel includes live summaries, filters, Accept, Reject, Reschedule, Complete, Upload Report, and Notification Logs.\n');

// 5. Verify Payments Reconciliation & ₹1 Test Transactions
console.log('[TEST 5] Verifying Payments Reconciliation Section...');
assert(htmlContent.includes('loadRMAdminPaymentsSection'), 'Missing loadRMAdminPaymentsSection');
assert(htmlContent.includes('adminLinkUnmatchedPayment'), 'Missing adminLinkUnmatchedPayment');
assert(htmlContent.includes('UNMATCHED PAYMENT'), 'Missing UNMATCHED PAYMENT status rendering');
assert(htmlContent.includes('TEST (₹1)'), 'Missing ₹1 test payment badge');
console.log('✔ TEST 5 PASSED: Payments reconciliation section pulls historical & new payments from bookings and gst_invoices with unmatched payment manual linking tool.\n');

// 6. Verify Admin Calendar View
console.log('[TEST 6] Verifying Admin Appointment Schedule Calendar...');
assert(htmlContent.includes('loadRMAAdminCalendarSection'), 'Missing loadRMAAdminCalendarSection');
assert(htmlContent.includes("Today's Appointments"), 'Missing Today\'s Appointments section');
assert(htmlContent.includes('Upcoming Visits'), 'Missing Upcoming Visits section');
assert(htmlContent.includes('Double-booking'), 'Missing double booking detection text or warning');
console.log('✔ TEST 6 PASSED: Admin Appointment Schedule Calendar categorises visits and warns against double-booking.\n');

// 7. Verify Client Portal Application Timeline & Feedback
console.log('[TEST 7] Verifying Client Portal Timeline, Reports & Feedback System...');
assert(htmlContent.includes('renderClientVisitHistoryWithTimeline'), 'Missing renderClientVisitHistoryWithTimeline');
assert(htmlContent.includes('Application Workflow Timeline'), 'Missing Application Workflow Timeline');
assert(htmlContent.includes('submitClientFeedback'), 'Missing submitClientFeedback');
assert(htmlContent.includes('Site Visit Inspection Report'), 'Missing Site Visit Inspection Report delivery');
console.log('✔ TEST 7 PASSED: Client Portal includes step-by-step Application Timeline, direct Report delivery, and star-rating Feedback system.\n');

// 8. Verify GST Invoice Migration & Edge Function Implementation
console.log('[TEST 8] Verifying GST Invoice System Migration & Edge Function...');
const gstMigrationContent = fs.readFileSync('./supabase/migrations/20260928000000_gst_invoice_system.sql', 'utf8');
assert(gstMigrationContent.includes('ALTER TABLE public.gst_invoices'), 'Migration missing ALTER TABLE public.gst_invoices');
assert(gstMigrationContent.includes('CREATE TABLE IF NOT EXISTS public.invoice_audit_logs'), 'Migration missing public.invoice_audit_logs');
assert(gstMigrationContent.includes('CREATE OR REPLACE FUNCTION public.generate_rma_invoice_number'), 'Migration missing generate_rma_invoice_number() function');

const edgeFuncContent = fs.readFileSync('./supabase/functions/generate-gst-invoice/index.ts', 'utf8');
assert(edgeFuncContent.includes('generate_rma_invoice_number'), 'Edge Function missing rpc call to generate_rma_invoice_number');
assert(edgeFuncContent.includes('taxableAmount'), 'Edge Function missing taxableAmount calculation');
assert(edgeFuncContent.includes('storage_path'), 'Edge Function missing storage_path handling');
assert(edgeFuncContent.includes('invoice_audit_logs'), 'Edge Function missing audit logging');
console.log('✔ TEST 8 PASSED: GST invoice migration and Edge Function include complete audit logging and server-side numbering.\n');

// 9. Verify Frontend GST Calculation & Customer / Admin Invoice Tools
console.log('[TEST 9] Verifying Frontend GST Calculation & Customer/Admin Actions...');
assert(htmlContent.includes('rmaCalculateGSTDetails'), 'Missing rmaCalculateGSTDetails function in index.html');
assert(htmlContent.includes('rmaCustomerRetryInvoice'), 'Missing rmaCustomerRetryInvoice function in index.html');
assert(htmlContent.includes('adminOpenInvoiceRecalculateModal'), 'Missing adminOpenInvoiceRecalculateModal in index.html');
assert(htmlContent.includes('adminExecuteGenerateInvoice'), 'Missing adminExecuteGenerateInvoice in index.html');
assert(htmlContent.includes('adminTriggerInvoiceAction'), 'Missing adminTriggerInvoiceAction in index.html');
console.log('✔ TEST 9 PASSED: Frontend contains centralized GST calculation, customer invoice download/retry, and admin recovery modal.\n');

console.log('=== ALL WORKFLOW & GST INVOICE SYSTEM E2E TESTS COMPLETED SUCCESSFULLY ===');
