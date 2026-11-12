-- FlexSACCO security-first Stage 1 migration.
-- This file is a reviewed foundation for a secure multi-tenant platform.
-- Use with Supabase SQL Editor or the Supabase CLI.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('super_admin', 'sacco_admin', 'sacco_staff', 'member');
CREATE TYPE account_type AS ENUM ('savings', 'share_capital');

CREATE TABLE IF NOT EXISTS saccos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  iotec_wallet_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sacco_id UUID REFERENCES saccos(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  national_id_nin VARCHAR(30),
  member_number VARCHAR(50),
  is_activated BOOLEAN NOT NULL DEFAULT FALSE,
  activation_token_hash TEXT,
  activation_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sacco_id, phone_number),
  UNIQUE (sacco_id, national_id_nin)
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_type account_type NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'UGX',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sacco_id, account_number)
);

ALTER TABLE saccos ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_auth_sacco_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sacco_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE POLICY "Members can read only their own profiles"
ON profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Members can update only their own profile"
ON profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Staff can view profiles in their own SACCO"
ON profiles
FOR SELECT
USING (
  sacco_id = get_auth_sacco_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles AS current_profile
    WHERE current_profile.id = auth.uid()
      AND current_profile.role IN ('sacco_admin', 'sacco_staff')
  )
);

CREATE POLICY "Members can read own accounts"
ON accounts
FOR SELECT
USING (member_id = auth.uid() AND sacco_id = get_auth_sacco_id());

CREATE POLICY "Staff can read SACCO accounts"
ON accounts
FOR SELECT
USING (
  sacco_id = get_auth_sacco_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles AS current_profile
    WHERE current_profile.id = auth.uid()
      AND current_profile.role IN ('sacco_admin', 'sacco_staff')
  )
);

CREATE POLICY "Members cannot mutate accounts from browser"
ON accounts
FOR UPDATE
USING (FALSE);

CREATE POLICY "Members cannot insert accounts from browser"
ON accounts
FOR INSERT
WITH CHECK (FALSE);

CREATE POLICY "Members cannot delete accounts from browser"
ON accounts
FOR DELETE
USING (FALSE);

ALTER TABLE profiles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE accounts
  ENABLE ROW LEVEL SECURITY;
