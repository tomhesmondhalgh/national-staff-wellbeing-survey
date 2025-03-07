
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Get the publishable key from environment variables
// This is safe to expose in the frontend code
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  'pk_test_placeholder'; // You'll need to set this in your environment

interface StripeContextType {
  isLoading: boolean;
  stripe: Stripe | null;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const useStripe = (): StripeContextType => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!stripePromise) {
      const promise = loadStripe(stripePublishableKey);
      setStripePromise(promise);
      
      promise.then(stripeInstance => {
        setStripe(stripeInstance);
        setIsLoading(false);
      }).catch(err => {
        console.error('Failed to load Stripe:', err);
        setIsLoading(false);
      });
    }
  }, []);

  return (
    <StripeContext.Provider value={{ isLoading, stripe }}>
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
};
