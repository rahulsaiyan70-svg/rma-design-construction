-- Migration for RMA Design & Construction Business Ledger System
-- Creates public.business_ledger table with comprehensive RLS policies for income and expense accounting.

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

-- Index for fast date and entry type querying
CREATE INDEX IF NOT EXISTS idx_business_ledger_entry_date ON public.business_ledger(entry_date);
CREATE INDEX IF NOT EXISTS idx_business_ledger_entry_type ON public.business_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_business_ledger_transaction_date ON public.business_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_business_ledger_transaction_type ON public.business_ledger(transaction_type);

ALTER TABLE public.business_ledger ENABLE ROW LEVEL SECURITY;

-- Allow anon, service_role, and authenticated full access for RMA Admin business ledger management
DROP POLICY IF EXISTS "Allow service_role and authenticated full manage business_ledger" ON public.business_ledger;
DROP POLICY IF EXISTS "Allow anon, authenticated, service_role full manage business_ledger" ON public.business_ledger;

CREATE POLICY "Allow anon, authenticated, service_role full manage business_ledger"
    ON public.business_ledger FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);
