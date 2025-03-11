
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
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups:group_id(*)
    `)
    .eq('user_id', supabase.auth.getUser().then(({ data }) => data.user?.id));

  if (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }

  return data?.map(item => item.groups) || [];
};

// Get all organizations the current user belongs to
export const getUserOrganizations = async (): Promise<Organization[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  // First check direct organization memberships
  const { data: directOrgs, error: directError } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      profiles:organization_id(*)
    `)
    .eq('user_id', user.user.id);

  if (directError) {
    console.error('Error fetching direct organization memberships:', directError);
    return [];
  }

  // Then check group memberships
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
    return [];
  }

  // Combine and deduplicate results
  const allOrgs: Organization[] = [];
  
  // Add direct orgs
  directOrgs?.forEach(item => {
    if (item.profiles) {
      allOrgs.push(item.profiles as Organization);
    }
  });
  
  // Add group-based orgs
  groupOrgs?.forEach(item => {
    item.group_organizations.forEach(go => {
      if (go.profiles && !allOrgs.some(o => o.id === go.organization_id)) {
        allOrgs.push(go.profiles as Organization);
      }
    });
  });

  return allOrgs;
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
  
  // Check direct organization membership
  const { data: directRole } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.user.id)
    .maybeSingle();
    
  if (directRole) return directRole.role as UserRoleType;
  
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
      for (const groupOrg of groupRole.group_organizations) {
        if (groupOrg.organization_id === organizationId) {
          return groupRole.role as UserRoleType;
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
