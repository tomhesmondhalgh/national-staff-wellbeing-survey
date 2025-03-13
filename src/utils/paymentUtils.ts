
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { BillingDetails } from '../types/subscription';

export const createPaymentSession = async (
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  planType: string = 'foundation',
  purchaseType: 'subscription' | 'one-time' = 'one-time',
  billingDetails?: BillingDetails
) => {
  try {
    if (!priceId) {
      throw new Error('Price ID is required');
    }

    // For testing, log the details
    console.log('Creating payment session with:', {
      priceId,
      planType,
      purchaseType,
      billingDetails
    });

    const { data, error } = await supabase.functions.invoke('create-payment-session', {
      body: {
        priceId,
        successUrl,
        cancelUrl,
        planType,
        purchaseType,
        billingDetails
      }
    });

    if (error) {
      console.error('Error creating payment session:', error);
      toast.error('Failed to create payment session');
      return { success: false, error };
    }

    if (!data?.url) {
      console.error('No checkout URL returned from payment session creation');
      toast.error('Failed to create payment session');
      return { success: false, error: new Error('No checkout URL returned') };
    }

    return { success: true, url: data.url };
  } catch (error) {
    console.error('Error creating payment session:', error);
    toast.error('Failed to create payment session');
    return { success: false, error };
  }
};

// Function to handle redirect to Stripe checkout
export const redirectToCheckout = async (
  plan: {
    id: string;
    name: string;
    stripe_price_id: string | null;
    purchase_type: string;
    price: number;
  },
  billingDetails?: BillingDetails
) => {
  try {
    if (!plan.stripe_price_id) {
      toast.error('This plan is not available for purchase at this time');
      return;
    }

    const currentUrl = window.location.href;
    const baseUrl = window.location.origin;

    const { success, url, error } = await createPaymentSession(
      plan.stripe_price_id,
      `${baseUrl}/payment-success`,
      currentUrl,
      plan.name.toLowerCase(),
      plan.purchase_type as 'subscription' | 'one-time',
      billingDetails
    );

    if (!success || !url) {
      console.error('Failed to create checkout session:', error);
      toast.error('Unable to redirect to checkout');
      return;
    }

    // Redirect the user to Stripe checkout
    window.location.href = url;
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    toast.error('Unable to redirect to checkout');
  }
};
