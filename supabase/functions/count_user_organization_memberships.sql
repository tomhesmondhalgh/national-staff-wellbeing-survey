
CREATE OR REPLACE FUNCTION public.count_user_organization_memberships(user_uuid UUID, org_uuid UUID)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  membership_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO membership_count
  FROM organization_members
  WHERE user_id = user_uuid
  AND organization_id = org_uuid;
  
  RETURN membership_count;
END;
$$;
