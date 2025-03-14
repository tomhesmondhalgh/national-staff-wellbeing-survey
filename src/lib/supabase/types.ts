
// User and role types
export type UserRoleType = 'administrator' | 'group_admin' | 'organization_admin' | 'editor' | 'viewer';

// Organization and group related types
export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  school_name?: string | null; // For backward compatibility
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: UserRoleType;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRoleType;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRoleType;
  invited_by: string;
  organization_id: string | null;
  group_id: string | null;
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

// Types for Supabase responses
export interface ProfileData {
  id: string;
  name?: string;
  school_name?: string;
  created_at: string;
  [key: string]: any; // For other profile fields
}

export interface GroupOrganization {
  organization_id: string;
  profiles: ProfileData | Record<string, any>; // Allow for different profile structures
}

export interface GroupOrganizationsResponse {
  group_id: string;
  group_organizations: GroupOrganization[];
}
