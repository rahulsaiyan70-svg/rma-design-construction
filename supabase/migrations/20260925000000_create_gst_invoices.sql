-- Migration to create the public.gst_invoices table for RMA Design & Construction
-- Enables GST tax invoice generation, retrieval, and PDF document tracking.

CREATE TABLE IF NOT EXISTS public.gst_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    payment_id TEXT NOT NULL UNIQUE,
    order_id TEXT,
    receipt TEXT,
    invoice_type TEXT NOT NULL DEFAULT 'service',

    -- Customer Info
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_mobile TEXT,
    customer_address TEXT,
    customer_state TEXT DEFAULT 'Jammu and Kashmir',

    -- Financial Details
    description TEXT,
    taxable_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,

    -- Metadata and File links
    notes JSONB DEFAULT '{}'::jsonb,
    pdf_url TEXT,
    storage_path TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.gst_invoices ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon and authenticated) for retrieving/downloading invoices
CREATE POLICY "Allow public read access to gst_invoices"
    ON public.gst_invoices
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow service role and client insert access
CREATE POLICY "Allow service role and client insert to gst_invoices"
    ON public.gst_invoices
    FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

-- Allow service role and client update access
CREATE POLICY "Allow update to gst_invoices"
    ON public.gst_invoices
    FOR UPDATE
    TO anon, authenticated, service_role
    USING (true);

-- Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_gst_invoices_payment_id ON public.gst_invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_gst_invoices_receipt ON public.gst_invoices(receipt);
CREATE INDEX IF NOT EXISTS idx_gst_invoices_customer_email ON public.gst_invoices(customer_email);
