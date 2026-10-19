-- Migration to grant permissions and reload PostgREST schema cache for public.business_ledger

-- 1. Ensure public.business_ledger table exists with all required columns
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
    project_name TEXT,
    booking_id TEXT,
    is_transfer BOOLEAN DEFAULT FALSE,
    created_by TEXT DEFAULT 'RMA Admin',
    last_modified_by TEXT,
    audit_trail JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Explicitly Grant Schema and Table Privileges to API Roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.business_ledger TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Ensure Row Level Security Policy is Active
ALTER TABLE public.business_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon, authenticated, service_role full manage business_ledger" ON public.business_ledger;

CREATE POLICY "Allow anon, authenticated, service_role full manage business_ledger"
    ON public.business_ledger FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 4. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
