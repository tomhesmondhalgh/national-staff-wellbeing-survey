
import { createClient } from '@supabase/supabase-js';

// Define all types in one place to avoid circular dependencies
export type UserRoleType = 'administrator' | 'group_admin' | 'organization_admin' | 'editor' | 'viewer';
export type PlanType = 'free' | 'foundation' | 'progress' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'pending' | 'trialing' | 'unpaid';
export type PaymentMethod = 'stripe' | 'manual' | 'invoice' | 'transfer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type SurveyStatus = 'Draft' | 'Saved' | 'Open' | 'Closed' | 'Archived';
export type DescriptorStatus = 'Not Started' | 'In Progress' | 'Complete';
export type PurchaseType = 'subscription' | 'one-time';

// Interface definitions for database entities
export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRoleType;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  organization_id: string;
  role: UserRoleType;
  token: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  group_id?: string;
}

// Create the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anonymous Key is missing in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Simple helper to check if user is admin (to be used in components)
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'administrator')
      .maybeSingle();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking admin status:', error);
    return false;
  }
};
