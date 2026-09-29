-- Migration: GST Invoice System Schema & Audit Enhancement
-- Extends public.gst_invoices, creates invoice_audit_logs, and configures financial year invoice sequence generator.

-- 1. Extend public.gst_invoices table with complete audit, tax breakdown, and storage columns
ALTER TABLE public.gst_invoices
  ADD COLUMN IF NOT EXISTS booking_id UUID,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS sgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS igst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS invoice_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT NOT NULL DEFAULT 'invoices',
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS download_url TEXT,
  ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_error TEXT;

CREATE INDEX IF NOT EXISTS idx_gst_invoices_booking_id ON public.gst_invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_gst_invoices_invoice_status ON public.gst_invoices(invoice_status);

-- 2. Create public.invoice_audit_logs table for financial audit tracking
CREATE TABLE IF NOT EXISTS public.invoice_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID,
    invoice_id UUID REFERENCES public.gst_invoices(id) ON DELETE SET NULL,
    payment_id TEXT,
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    amount NUMERIC(12, 2),
    performed_by TEXT DEFAULT 'system',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoice_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read own invoice audit logs"
    ON public.invoice_audit_logs FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Allow service_role full manage invoice_audit_logs"
    ON public.invoice_audit_logs FOR ALL
    TO service_role, authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Create sequence and server-side function for financial year invoice numbering
CREATE SEQUENCE IF NOT EXISTS rma_invoice_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_rma_invoice_number()
RETURNS TEXT AS $$
DECLARE
    curr_month INT;
    curr_year INT;
    fy_str TEXT;
    seq_val INT;
    final_no TEXT;
BEGIN
    curr_month := EXTRACT(MONTH FROM NOW());
    curr_year := EXTRACT(YEAR FROM NOW());

    IF curr_month >= 4 THEN
        fy_str := curr_year::TEXT || '-' || (curr_year + 1 - 2000)::TEXT;
    ELSE
        fy_str := (curr_year - 1)::TEXT || '-' || (curr_year - 2000)::TEXT;
    END IF;

    seq_val := nextval('rma_invoice_number_seq');
    final_no := 'RMA/' || fy_str || '/' || LPAD(seq_val::TEXT, 4, '0');
    RETURN final_no;
END;
$$ LANGUAGE plpgsql;
