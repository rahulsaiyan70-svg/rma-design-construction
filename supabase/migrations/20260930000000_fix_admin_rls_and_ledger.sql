-- Migration: Fix Admin RLS Policies for Bookings, Appointments, Status History, Invoices & Ledger
-- Ensures service_role, authenticated, and anon roles can perform Admin Operations without RLS policy rejection.

-- 1. Ensure public.business_ledger table and RLS policies
CREATE TABLE IF NOT EXISTS public.business_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('INCOME', 'EXPENSE')),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    client_vendor_name TEXT,
    category TEXT NOT NULL,
    description TEXT,
    invoice_number TEXT,
    payment_method TEXT DEFAULT 'CASH',
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    created_by TEXT DEFAULT 'RMA Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_ledger_entry_date ON public.business_ledger(entry_date);
CREATE INDEX IF NOT EXISTS idx_business_ledger_entry_type ON public.business_ledger(entry_type);

ALTER TABLE public.business_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service_role and authenticated full manage business_ledger" ON public.business_ledger;
DROP POLICY IF EXISTS "Allow full manage business_ledger" ON public.business_ledger;

CREATE POLICY "Allow full manage business_ledger"
    ON public.business_ledger FOR ALL
    TO service_role, authenticated, anon
    USING (true)
    WITH CHECK (true);

-- 2. Ensure public.bookings RLS policy allows Admin updates/deletes
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full manage bookings" ON public.bookings;
CREATE POLICY "Allow full manage bookings"
    ON public.bookings FOR ALL
    TO service_role, authenticated, anon
    USING (true)
    WITH CHECK (true);

-- 3. Ensure public.appointments RLS policy
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service_role full manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow full manage appointments" ON public.appointments;
CREATE POLICY "Allow full manage appointments"
    ON public.appointments FOR ALL
    TO service_role, authenticated, anon
    USING (true)
    WITH CHECK (true);

-- 4. Ensure public.status_history RLS policy
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service_role full manage status_history" ON public.status_history;
DROP POLICY IF EXISTS "Allow full manage status_history" ON public.status_history;
CREATE POLICY "Allow full manage status_history"
    ON public.status_history FOR ALL
    TO service_role, authenticated, anon
    USING (true)
    WITH CHECK (true);

-- 5. Ensure public.notification_logs RLS policy
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service_role full manage notification_logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Allow full manage notification_logs" ON public.notification_logs;
CREATE POLICY "Allow full manage notification_logs"
    ON public.notification_logs FOR ALL
    TO service_role, authenticated, anon
    USING (true)
    WITH CHECK (true);

-- 6. Ensure public.gst_invoices & public.invoice_audit_logs RLS policy
ALTER TABLE public.gst_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full manage gst_invoices" ON public.gst_invoices;
CREATE POLICY "Allow full manage gst_invoices"
    ON public.gst_invoices FOR ALL
    TO service_role, authenticated, anon
    USING (true)
    WITH CHECK (true);

ALTER TABLE public.invoice_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full manage invoice_audit_logs" ON public.invoice_audit_logs;
CREATE POLICY "Allow full manage invoice_audit_logs"
    ON public.invoice_audit_logs FOR ALL
    TO service_role, authenticated, anon
    USING (true)
    WITH CHECK (true);
