import { supabase } from './client';

export type PlanType = 'free' | 'foundation' | 'progress' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'pending';
export type PaymentMethod = 'stripe' | 'invoice' | 'manual';
export type PurchaseType = 'subscription' | 'one-time' | 'free';

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

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  purchase_type: PurchaseType;
  duration_months?: number;
  stripe_price_id?: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
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

// Manual function to check for a specific Stripe payment and create subscription if needed
export async function checkAndCreateSubscription(
  userId: string, 
  planType: PlanType, 
  stripePaymentId: string,
  purchaseType: PurchaseType = 'subscription'
): Promise<boolean> {
  try {
    console.log(`Manually checking payment ${stripePaymentId} for user ${userId}`);
    
    // First check if payment record exists
    const { data: paymentHistory } = await supabase
      .from('payment_history')
      .select('id, subscription_id')
      .eq('stripe_payment_id', stripePaymentId)
      .maybeSingle();
      
    if (paymentHistory) {
      console.log('Payment already recorded:', paymentHistory);
      return true;
    }
    
    // Check if subscription exists
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_type', planType)
      .eq('status', 'active');
      
    let subscriptionId;
    
    // If no active subscription, create one
    if (!subscriptions || subscriptions.length === 0) {
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          status: 'active',
          payment_method: 'stripe',
          purchase_type: purchaseType,
          start_date: new Date().toISOString(),
          ...(purchaseType === 'one-time' ? {
            end_date: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString()
          } : {})
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating subscription:', createError);
        return false;
      }
      
      subscriptionId = newSub.id;
      console.log('Created new subscription:', subscriptionId);
    } else {
      subscriptionId = subscriptions[0].id;
      console.log('Found existing subscription:', subscriptionId);
    }
    
    // Create payment record
    const { error: paymentError } = await supabase
      .from('payment_history')
      .insert({
        subscription_id: subscriptionId,
        amount: 0, // We don't know the amount, so set to 0
        currency: 'GBP',
        payment_method: 'stripe',
        stripe_payment_id: stripePaymentId,
        payment_status: 'payment_made',
        payment_date: new Date().toISOString()
      });
      
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return false;
    }
    
    console.log('Successfully created payment record');
    return true;
  } catch (error) {
    console.error('Error in checkAndCreateSubscription:', error);
    return false;
  }
}

/**
 * Get all active subscription plans ordered by sort_order
 * @returns Array of Plan objects
 */
export async function getPlans(): Promise<Plan[]> {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }

    return data.map(plan => ({
      ...plan,
      features: plan.features as unknown as string[],
    }));
  } catch (error) {
    console.error('Exception in getPlans:', error);
    return [];
  }
}

/**
 * Get a specific plan by ID
 * @param planId The UUID of the plan to retrieve
 * @returns Plan object or null if not found
 */
export async function getPlanById(planId: string): Promise<Plan | null> {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      console.error('Error fetching plan by ID:', error);
      return null;
    }

    return {
      ...data,
      features: data.features as unknown as string[],
    };
  } catch (error) {
    console.error('Exception in getPlanById:', error);
    return null;
  }
}

/**
 * Get a plan by its Stripe price ID
 * @param stripePriceId The Stripe price ID
 * @returns Plan object or null if not found
 */
export async function getPlanByStripeId(stripePriceId: string): Promise<Plan | null> {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('stripe_price_id', stripePriceId)
      .single();

    if (error) {
      console.error('Error fetching plan by Stripe ID:', error);
      return null;
    }

    return {
      ...data,
      features: data.features as unknown as string[],
    };
  } catch (error) {
    console.error('Exception in getPlanByStripeId:', error);
    return null;
  }
}
