
import { supabase } from './client';

export type PlanType = 'free' | 'foundation' | 'progress' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'pending';
export type PaymentMethod = 'stripe' | 'invoice' | 'manual';
export type PurchaseType = 'subscription' | 'one-time';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  payment_method: PaymentMethod;
  stripe_subscription_id?: string;
  invoice_number?: string;
  start_date?: string;
  end_date?: string;
  purchase_type: PurchaseType;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: PaymentMethod;
  invoice_number?: string;
  stripe_payment_id?: string;
  created_at: string;
}

export interface SubscriptionAccess {
  plan: PlanType;
  isActive: boolean;
}

// Fetch user's current subscription
export async function getUserSubscription(userId: string): Promise<SubscriptionAccess | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_subscription', { user_uuid: userId });

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return { plan: 'free', isActive: false };
    }

    return {
      plan: data[0].plan,
      isActive: data[0].is_active
    };
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

// Check if user has access to a specific plan level
export async function checkPlanAccess(userId: string, requiredPlan: PlanType): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('user_has_access', { 
        user_uuid: userId,
        required_plan: requiredPlan
      });

    if (error) {
      console.error('Error checking plan access:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in checkPlanAccess:', error);
    return false;
  }
}

// Get user's subscription history
export async function getSubscriptionHistory(userId: string): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscription history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSubscriptionHistory:', error);
    return [];
  }
}

// Get user's payment history
export async function getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
  try {
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId);

    if (subError || !subscriptions.length) {
      console.error('Error fetching subscription IDs:', subError);
      return [];
    }

    const subscriptionIds = subscriptions.map(sub => sub.id);
    
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .in('subscription_id', subscriptionIds)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPaymentHistory:', error);
    return [];
  }
}
