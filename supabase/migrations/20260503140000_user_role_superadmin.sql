-- Step 10: MFA / RBAC — superadmin role (invoked in build guide Step 10).

DO $$
BEGIN
  ALTER TYPE public.user_role ADD VALUE 'superadmin';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
