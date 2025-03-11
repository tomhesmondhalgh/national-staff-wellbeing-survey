
import { createClient } from "@supabase/supabase-js";

// Check if environment variables exist, otherwise use placeholders for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bagaaqkmewkuwtudwnqw.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2FhcWttZXdrdXd0dWR3bnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjQwMzIsImV4cCI6MjA1NjI0MDAzMn0.Eu_xDUDDk188oE0dB7W7KJ4oWjB6nQNuUBBnZUMrsvE";

console.log(`Initializing Supabase client with URL: ${supabaseUrl.substring(0, 15)}...`);

// Create Supabase client with auto-refresh and automatic retry
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (...args: Parameters<typeof fetch>) => {
      return fetch(...args);
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// If you need to log conditionally, use this approach
console.info("Supabase client initialized");

// Add a helper method to check if Supabase is configured properly
export const isSupabaseConfigured = () => {
  const isUrlValid = supabaseUrl && 
                    supabaseUrl !== "placeholder-url" && 
                    supabaseUrl.includes("supabase.co");
  
  const isKeyValid = supabaseAnonKey && 
                     supabaseAnonKey !== "placeholder-key" && 
                     supabaseAnonKey.length > 20;
  
  console.log(`Supabase configuration check - URL valid: ${isUrlValid}, Key valid: ${isKeyValid}`);
  
  return isUrlValid && isKeyValid;
};

// Helper to check if the current session is authenticated
export const isAuthenticated = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
    return !!data.session;
  } catch (error) {
    console.error("Exception checking authentication:", error);
    return false;
  }
};

// Add event listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth state changed: ${event}`, session ? "Session exists" : "No session");
});

// Multi-organization management functions
export type UserRoleType = 'administrator' | 'group_admin' | 'organization_admin' | 'editor' | 'viewer';

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

// Get all groups the current user belongs to
export const getUserGroups = async (): Promise<Group[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups(*)
    `)
    .eq('user_id', user.user.id);

  if (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }

  // Extract and transform the data to match the Group interface
  return (data || []).map(item => {
    // Ensure groups is an object with the required properties
    if (item.groups && 
        typeof item.groups === 'object' && 
        !Array.isArray(item.groups) &&
        'id' in item.groups && 
        'name' in item.groups && 
        'created_at' in item.groups &&
        'updated_at' in item.groups) {
      return item.groups as Group;
    }
    // Return a default Group object if data is not as expected
    console.warn('Group data is missing or malformed:', item);
    return null;
  }).filter((group): group is Group => group !== null);
};

// Get all organizations the current user belongs to
export const getUserOrganizations = async (): Promise<Organization[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  // Try to get the user profile as an organization (for organization admins)
  // This is needed for organization admins who are not part of multiple organizations
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
  }

  // If the user is an organization admin and has school_name, create an organization from their profile
  const organizations: Organization[] = [];
  if (userProfile && userProfile.school_name) {
    organizations.push({
      id: userProfile.id,
      name: userProfile.school_name,
      created_at: userProfile.created_at
    });
  }

  // Then check group memberships for additional organizations
  try {
    const { data: groupOrgs, error: groupError } = await supabase
      .from('group_members')
      .select(`
        group_id,
        group_organizations!inner(
          organization_id,
          profiles:organization_id(*)
        )
      `)
      .eq('user_id', user.user.id);

    if (groupError) {
      console.error('Error fetching group-based organization memberships:', groupError);
    } else if (groupOrgs) {
      // Add group-based orgs
      groupOrgs.forEach(item => {
        if (item.group_organizations && Array.isArray(item.group_organizations)) {
          item.group_organizations.forEach(go => {
            if (go.profiles && 
                typeof go.profiles === 'object' && 
                !Array.isArray(go.profiles) &&
                'id' in go.profiles && 
                (('name' in go.profiles && go.profiles.name) || ('school_name' in go.profiles && go.profiles.school_name)) && 
                'created_at' in go.profiles && 
                !organizations.some(o => o.id === go.organization_id)) {
              // Use school_name if available, fallback to name
              const orgName = (go.profiles as any).school_name || (go.profiles as any).name;
              organizations.push({
                id: go.profiles.id,
                name: orgName,
                created_at: go.profiles.created_at
              });
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('Error processing group organizations:', error);
  }

  return organizations;
};

// Get user's role for a specific organization
export const getUserRoleForOrganization = async (organizationId: string): Promise<UserRoleType | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  
  // Check if user is system admin
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.user.id)
    .eq('role', 'administrator')
    .maybeSingle();
    
  if (adminRole) return 'administrator';
  
  // If the user is looking at their own organization profile
  if (user.user.id === organizationId) {
    return 'organization_admin';
  }
  
  // Check group-based access
  const { data: groupRoles } = await supabase
    .from('group_members')
    .select(`
      role,
      group_id,
      group_organizations!inner(organization_id)
    `)
    .eq('user_id', user.user.id);
    
  if (groupRoles) {
    for (const groupRole of groupRoles) {
      if (groupRole.group_organizations && Array.isArray(groupRole.group_organizations)) {
        for (const groupOrg of groupRole.group_organizations) {
          if (groupOrg.organization_id === organizationId) {
            return groupRole.role as UserRoleType;
          }
        }
      }
    }
  }
  
  return null;
};

// Check if user has specific permission for an organization
export const userHasPermission = async (
  organizationId: string, 
  requiredRole: UserRoleType
): Promise<boolean> => {
  const userRole = await getUserRoleForOrganization(organizationId);
  if (!userRole) return false;
  
  const roleHierarchy: Record<UserRoleType, number> = {
    'administrator': 4,
    'group_admin': 3,
    'organization_admin': 2,
    'editor': 1,
    'viewer': 0
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
