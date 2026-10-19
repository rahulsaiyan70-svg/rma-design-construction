-- Migration to enhance public.business_ledger table structure with project tracking, internal transfers, edit audit trails, and robust RLS policies.

-- 1. Ensure public.business_ledger exists
CREATE TABLE IF NOT EXISTS public.business_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_type TEXT NOT NULL DEFAULT 'INCOME',
    transaction_type TEXT DEFAULT 'income',
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_date DATE DEFAULT CURRENT_DATE,
    client_vendor_name TEXT,
    party_name TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    description TEXT,
    invoice_number TEXT,
    payment_method TEXT DEFAULT 'CASH',
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    gross_amount NUMERIC(12,2) DEFAULT 0.00,
    taxable_amount NUMERIC(12,2) DEFAULT 0.00,
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    gst_amount NUMERIC(12,2) DEFAULT 0.00,
    net_amount NUMERIC(12,2) DEFAULT 0.00,
    reference TEXT,
    notes TEXT,
    created_by TEXT DEFAULT 'RMA Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add extended financial & audit breakdown columns if missing
ALTER TABLE public.business_ledger
  ADD COLUMN IF NOT EXISTS project_name TEXT,
  ADD COLUMN IF NOT EXISTS booking_id TEXT,
  ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_modified_by TEXT,
  ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '[]'::jsonb;

-- Create Indexes for performance and sorting
CREATE INDEX IF NOT EXISTS idx_business_ledger_project_name ON public.business_ledger(project_name);
CREATE INDEX IF NOT EXISTS idx_business_ledger_payment_method ON public.business_ledger(payment_method);
CREATE INDEX IF NOT EXISTS idx_business_ledger_is_transfer ON public.business_ledger(is_transfer);

-- 3. Row Level Security Policies
ALTER TABLE public.business_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon, authenticated, service_role full manage business_ledger" ON public.business_ledger;

CREATE POLICY "Allow anon, authenticated, service_role full manage business_ledger"
    ON public.business_ledger FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);
