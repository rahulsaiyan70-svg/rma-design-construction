-- Migration to update public.business_ledger table structure and RLS policies for RMA Admin Business Ledger
-- Fixes RLS permission issues for anon/authenticated admin client and adds comprehensive GST breakdown columns.

-- 1. Ensure table exists with base columns
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

-- 2. Add full financial & metadata breakdown columns if missing from earlier table iterations
ALTER TABLE public.business_ledger
  ADD COLUMN IF NOT EXISTS transaction_type TEXT,
  ADD COLUMN IF NOT EXISTS transaction_date DATE,
  ADD COLUMN IF NOT EXISTS party_name TEXT,
  ADD COLUMN IF NOT EXISTS client_vendor_name TEXT,
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 18.00,
  ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_business_ledger_entry_date ON public.business_ledger(entry_date);
CREATE INDEX IF NOT EXISTS idx_business_ledger_entry_type ON public.business_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_business_ledger_transaction_date ON public.business_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_business_ledger_transaction_type ON public.business_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_business_ledger_category ON public.business_ledger(category);

-- 3. Update Row Level Security Policies
ALTER TABLE public.business_ledger ENABLE ROW LEVEL SECURITY;

-- Drop existing restricted policy if present
DROP POLICY IF EXISTS "Allow service_role and authenticated full manage business_ledger" ON public.business_ledger;
DROP POLICY IF EXISTS "Allow anon, authenticated, service_role full manage business_ledger" ON public.business_ledger;

-- Create comprehensive policy granting full manage rights to anon, authenticated, and service_role
CREATE POLICY "Allow anon, authenticated, service_role full manage business_ledger"
    ON public.business_ledger FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);
