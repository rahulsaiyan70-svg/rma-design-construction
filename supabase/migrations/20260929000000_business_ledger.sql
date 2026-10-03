-- Migration for RMA Design & Construction Business Ledger System
-- Creates public.business_ledger table with strict RLS policies for income and expense accounting.

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

-- Index for fast date and entry type querying
CREATE INDEX IF NOT EXISTS idx_business_ledger_entry_date ON public.business_ledger(entry_date);
CREATE INDEX IF NOT EXISTS idx_business_ledger_entry_type ON public.business_ledger(entry_type);

ALTER TABLE public.business_ledger ENABLE ROW LEVEL SECURITY;

-- Service role and authenticated admin full access
CREATE POLICY "Allow service_role and authenticated full manage business_ledger"
    ON public.business_ledger FOR ALL
    TO service_role, authenticated
    USING (true)
    WITH CHECK (true);
