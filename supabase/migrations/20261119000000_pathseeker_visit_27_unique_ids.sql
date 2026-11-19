-- Limit atomic booking de-duplication to Pathseeker visit 27.
-- site_visits.booking_id already has a unique constraint in production.
-- Existing records and all other request IDs remain unchanged.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_psis_sv27_request_id
  ON public.bookings (request_id)
  WHERE request_id = 'RMA-SV-PSIS-27';
