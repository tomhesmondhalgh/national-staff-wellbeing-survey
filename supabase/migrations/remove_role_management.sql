
-- This migration removes all the role management tables, types and functions
-- that are no longer needed in the simplified access model

-- First, drop functions that depend on roles
DROP FUNCTION IF EXISTS public.user_has_organization_role;
DROP FUNCTION IF EXISTS public.user_has_organization_role_v2;
DROP FUNCTION IF EXISTS public.get_organization_role;
DROP FUNCTION IF EXISTS public.role_has_permission;
DROP FUNCTION IF EXISTS public.get_user_highest_role;
DROP FUNCTION IF EXISTS public.has_role_v2;
DROP FUNCTION IF EXISTS public.get_user_role_v2;
DROP FUNCTION IF EXISTS public.check_organization_membership_exists;
DROP FUNCTION IF EXISTS public.count_user_organization_memberships;

-- Drop tables related to role management
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;

-- Drop enums that are no longer needed
DROP TYPE IF EXISTS public.app_role;
DROP TYPE IF EXISTS public.user_role_type;

-- Create a simple helper function to check if user owns a record
CREATE OR REPLACE FUNCTION public.is_owner(record_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN auth.uid() = record_user_id;
END;
$$;
