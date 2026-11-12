-- Stage 1 hardening migration for the initial prototype schema.
-- Review and apply only in a non-production environment until tested.
-- Profile role/tenant fields and all account writes are server/provisioner controlled.

CREATE OR REPLACE FUNCTION public.get_auth_sacco_id()
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

CREATE OR REPLACE FUNCTION public.get_auth_role()
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

DROP POLICY IF EXISTS "Members can update only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Members can read only their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view profiles in their own SACCO" ON public.profiles;
DROP POLICY IF EXISTS "Members can read own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Staff can read SACCO accounts" ON public.accounts;
DROP POLICY IF EXISTS "Members cannot mutate accounts from browser" ON public.accounts;
DROP POLICY IF EXISTS "Members cannot insert accounts from browser" ON public.accounts;
DROP POLICY IF EXISTS "Members cannot delete accounts from browser" ON public.accounts;

CREATE POLICY "Read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Staff read profiles in own SACCO"
ON public.profiles FOR SELECT TO authenticated
USING (
  sacco_id = (SELECT public.get_auth_sacco_id())
  AND (SELECT public.get_auth_role()) IN ('sacco_admin', 'sacco_staff')
);

CREATE POLICY "Member read own account"
ON public.accounts FOR SELECT TO authenticated
USING (
  member_id = (SELECT auth.uid())
  AND sacco_id = (SELECT public.get_auth_sacco_id())
);

CREATE POLICY "Staff read accounts in own SACCO"
ON public.accounts FOR SELECT TO authenticated
USING (
  sacco_id = (SELECT public.get_auth_sacco_id())
  AND (SELECT public.get_auth_role()) IN ('sacco_admin', 'sacco_staff')
);

-- Remove broad table-level grants and do not allow browser-side profile/account writes.
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.accounts FROM anon, authenticated;
GRANT SELECT (id, sacco_id, role, full_name, phone_number, member_number, is_activated, created_at)
  ON TABLE public.profiles TO authenticated;
GRANT SELECT (id, sacco_id, member_id, account_type, account_number, balance, currency, created_at)
  ON TABLE public.accounts TO authenticated;

-- Ensure tenant and member references agree at the database layer.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_sacco_id_id_unique UNIQUE (sacco_id, id);

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_member_same_sacco_fk
  FOREIGN KEY (sacco_id, member_id)
  REFERENCES public.profiles (sacco_id, id)
  ON DELETE CASCADE;
