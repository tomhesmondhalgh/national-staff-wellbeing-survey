
CREATE OR REPLACE FUNCTION public.check_organization_membership_exists(user_uuid UUID, org_uuid UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  membership_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = user_uuid
    AND organization_id = org_uuid
  ) INTO membership_exists;
  
  RETURN membership_exists;
END;
$$;
