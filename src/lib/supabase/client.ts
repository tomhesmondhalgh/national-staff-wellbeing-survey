
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../integrations/supabase/types';

const SUPABASE_URL = "https://bagaaqkmewkuwtudwnqw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2FhcWttZXdrdXd0dWR3bnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjQwMzIsImV4cCI6MjA1NjI0MDAzMn0.Eu_xDUDDk188oE0dB7W7KJ4oWjB6nQNuUBBnZUMrsvE";

// For debugging in development
console.log('Initializing Supabase client with URL:', SUPABASE_URL.substring(0, 8) + '...');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Type definitions for use throughout the application
export type UserRoleType = 'administrator' | 'group_admin' | 'organization_admin' | 'editor' | 'viewer';

export type PlanType = 'free' | 'foundation' | 'progress' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'pending';
export type PaymentMethod = 'stripe' | 'invoice' | 'manual';
export type PurchaseType = 'subscription' | 'one-time';

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRoleType;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: UserRoleType;
  organization_id?: string;
  group_id?: string;
  invited_by: string;
  accepted_at?: string | null;
  created_at: string;
  expires_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupData {
  id: string;
  name: string;
  group_organizations: { organization_id: string }[];
}

export interface GroupRoleResponse {
  role: UserRoleType;
  group_id: string;
  groups: GroupData[];
}

// Helper functions
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user organizations:', error);
      return [];
    }

    return data.map(item => ({
      id: item.organization_id,
      name: 'Loading...', // Name will be loaded separately
      created_at: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Unexpected error in getUserOrganizations:', error);
    return [];
  }
}

export async function getUserRoleForOrganization(userId: string, organizationId: string): Promise<UserRoleType | null> {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching user role for organization:', error);
      return null;
    }

    return data.role as UserRoleType;
  } catch (error) {
    console.error('Unexpected error in getUserRoleForOrganization:', error);
    return null;
  }
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }

    return data.map(item => ({
      id: item.group_id,
      name: item.groups?.name || 'Unknown',
      description: item.groups?.description,
      created_at: item.groups?.created_at || new Date().toISOString(),
      updated_at: item.groups?.updated_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Unexpected error in getUserGroups:', error);
    return [];
  }
}
