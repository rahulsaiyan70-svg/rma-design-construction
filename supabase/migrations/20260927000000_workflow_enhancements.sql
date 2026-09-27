-- Migration for RMA Design & Construction Workflow Enhancements
-- Adds columns to public.bookings and creates appointments, notification_logs, site_visit_reports, feedback, status_history tables with strict RLS policies.

-- 1. Extend public.bookings table with workflow tracking columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS application_id TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_date TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_time TEXT,
  ADD COLUMN IF NOT EXISTS admin_remarks TEXT,
  ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_by TEXT,
  ADD COLUMN IF NOT EXISTS engineer_name TEXT,
  ADD COLUMN IF NOT EXISTS site_observations TEXT,
  ADD COLUMN IF NOT EXISTS report_url TEXT,
  ADD COLUMN IF NOT EXISTS report_path TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejection_date TIMESTAMPTZ;

-- Create index on application_id and request_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_bookings_application_id ON public.bookings(application_id);
CREATE INDEX IF NOT EXISTS idx_bookings_request_id ON public.bookings(request_id);

-- 2. Create public.appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    request_id TEXT,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_mobile TEXT,
    confirmed_date DATE,
    confirmed_time TEXT,
    engineer_name TEXT,
    status TEXT DEFAULT 'CONFIRMED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Clients can only read their own appointments
CREATE POLICY "Allow authenticated read own appointments"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (client_email = auth.jwt()->>'email' OR auth.uid() IN (
      SELECT client_user_id FROM public.bookings WHERE id = booking_id
    ));

-- Service role and admin can manage all appointments
CREATE POLICY "Allow service_role full manage appointments"
    ON public.appointments FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Create public.notification_logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID,
    request_id TEXT,
    client_name TEXT,
    recipient TEXT NOT NULL,
    channel TEXT NOT NULL, -- EMAIL, SMS, WHATSAPP
    notification_type TEXT NOT NULL,
    message_body TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- SENT, FAILED, PENDING
    provider_id TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Clients can read notification logs sent to them
CREATE POLICY "Allow authenticated read own notification logs"
    ON public.notification_logs FOR SELECT
    TO authenticated
    USING (recipient = auth.jwt()->>'email');

-- Service role can read and insert notification logs
CREATE POLICY "Allow service_role full manage notification_logs"
    ON public.notification_logs FOR ALL
    TO service_role, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Create public.site_visit_reports table
CREATE TABLE IF NOT EXISTS public.site_visit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    request_id TEXT,
    client_user_id UUID,
    title TEXT,
    engineer_name TEXT,
    observations TEXT,
    file_path TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_visit_reports ENABLE ROW LEVEL SECURITY;

-- Clients can only read site visit reports belonging to their client_user_id
CREATE POLICY "Allow authenticated read own site visit reports"
    ON public.site_visit_reports FOR SELECT
    TO authenticated
    USING (client_user_id = auth.uid() OR auth.uid() IN (
      SELECT client_user_id FROM public.bookings WHERE id = booking_id
    ));

CREATE POLICY "Allow service_role full manage site_visit_reports"
    ON public.site_visit_reports FOR ALL
    TO service_role, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Create public.feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    request_id TEXT,
    client_user_id UUID,
    client_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read own feedback"
    ON public.feedback FOR SELECT
    TO authenticated
    USING (client_user_id = auth.uid());

CREATE POLICY "Allow authenticated insert own feedback"
    ON public.feedback FOR INSERT
    TO authenticated, anon, service_role
    WITH CHECK (true);

-- 6. Create public.status_history table
CREATE TABLE IF NOT EXISTS public.status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    request_id TEXT,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read own status history"
    ON public.status_history FOR SELECT
    TO authenticated
    USING (auth.uid() IN (
      SELECT client_user_id FROM public.bookings WHERE id = booking_id
    ));

CREATE POLICY "Allow service_role full manage status_history"
    ON public.status_history FOR ALL
    TO service_role, authenticated
    USING (true)
    WITH CHECK (true);
