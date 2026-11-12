-- FlexSACCO Stage 1 initial schema.
-- Financial writes and all profile provisioning are intentionally not exposed to browser clients.

CREATE TYPE user_role AS ENUM ('super_admin', 'sacco_admin', 'sacco_staff', 'member');
CREATE TYPE account_type AS ENUM ('savings', 'share_capital');

CREATE TABLE saccos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  iotec_wallet_id UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
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
  UNIQUE (sacco_id, national_id_nin),
  UNIQUE (sacco_id, id)
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id UUID NOT NULL REFERENCES saccos(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL,
  account_type account_type NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'UGX',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sacco_id, account_number),
  CONSTRAINT accounts_member_same_sacco_fk
    FOREIGN KEY (sacco_id, member_id)
    REFERENCES profiles (sacco_id, id)
    ON DELETE RESTRICT
);

ALTER TABLE saccos ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.get_auth_sacco_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.sacco_id
  FROM public.profiles AS p
  WHERE p.id = (SELECT auth.uid())
  LIMIT 1;
$$;

CREATE FUNCTION public.get_auth_role()
RETURNS public.user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role
  FROM public.profiles AS p
  WHERE p.id = (SELECT auth.uid())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_auth_sacco_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_auth_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_sacco_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated;

CREATE POLICY "Read own profile"
ON profiles FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Staff read profiles in own SACCO"
ON profiles FOR SELECT TO authenticated
USING (
  sacco_id = (SELECT public.get_auth_sacco_id())
  AND (SELECT public.get_auth_role()) IN ('sacco_admin', 'sacco_staff')
);

CREATE POLICY "Member read own account"
ON accounts FOR SELECT TO authenticated
USING (
  member_id = (SELECT auth.uid())
  AND sacco_id = (SELECT public.get_auth_sacco_id())
);

CREATE POLICY "Staff read accounts in own SACCO"
ON accounts FOR SELECT TO authenticated
USING (
  sacco_id = (SELECT public.get_auth_sacco_id())
  AND (SELECT public.get_auth_role()) IN ('sacco_admin', 'sacco_staff')
);

REVOKE ALL ON TABLE profiles FROM anon, authenticated;
REVOKE ALL ON TABLE accounts FROM anon, authenticated;
GRANT SELECT (id, sacco_id, role, full_name, phone_number, member_number, is_activated, created_at)
  ON TABLE profiles TO authenticated;
GRANT SELECT (id, sacco_id, member_id, account_type, account_number, balance, currency, created_at)
  ON TABLE accounts TO authenticated;
