-- Migration: Manual GST Invoices Support & Profiles Schema Alignment
-- Extends public.gst_invoices with invoice_source and ensures public.profiles table schema and RLS policies.

-- 1. Extend public.gst_invoices with invoice_source column
ALTER TABLE public.gst_invoices
  ADD COLUMN IF NOT EXISTS invoice_source TEXT NOT NULL DEFAULT 'online';

CREATE INDEX IF NOT EXISTS idx_gst_invoices_invoice_source ON public.gst_invoices(invoice_source);

-- 2. Ensure public.profiles table exists with role and active columns for admin verification
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for public.profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow users to read own profile or admins read all') THEN
        CREATE POLICY "Allow users to read own profile or admins read all"
            ON public.profiles FOR SELECT
            TO authenticated, anon
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow service_role full manage profiles') THEN
        CREATE POLICY "Allow service_role full manage profiles"
            ON public.profiles FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
