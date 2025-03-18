
import { createClient } from '@supabase/supabase-js';

// Define all types in one place to avoid circular dependencies
export type UserRoleType = 'administrator' | 'group_admin' | 'organization_admin' | 'editor' | 'viewer';
export type PlanType = 'free' | 'foundation' | 'progress' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'pending' | 'trialing' | 'unpaid';
export type PaymentMethod = 'stripe' | 'manual' | 'invoice' | 'transfer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type SurveyStatus = 'Draft' | 'Saved' | 'Open' | 'Closed' | 'Archived';
export type DescriptorStatus = 'Not Started' | 'In Progress' | 'Complete';

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
