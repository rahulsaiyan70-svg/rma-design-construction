-- Limit atomic duplicate prevention to the stable ID for Pathseeker visit 27.
-- Existing records and all other request IDs remain unchanged.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_psis_sv27_request_id
  ON public.bookings (request_id)
  WHERE request_id = 'RMA-SV-PSIS-27';

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_visit_reports_psis_sv27_request_id
  ON public.site_visit_reports (request_id)
  WHERE request_id = 'RMA-SV-PSIS-27';
