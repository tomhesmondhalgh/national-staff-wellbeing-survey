
import React, { ReactNode, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useToast } from '../../hooks/use-toast';

// Get the publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  'pk_test_placeholder'; // Placeholder for development

// Initialize the Stripe instance
const stripePromise = loadStripe(stripePublishableKey);

interface StripeProviderProps {
  children: ReactNode;
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkStripeLoading = async () => {
      try {
        const stripe = await stripePromise;
        if (stripe) {
          console.log('Stripe loaded successfully');
          setStripeLoaded(true);
        } else {
          console.error('Stripe failed to load, no error thrown');
          toast({
            title: 'Warning',
            description: 'Payment system failed to initialize properly.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error loading Stripe:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment system. Please refresh the page.',
          variant: 'destructive'
        });
      }
    };

    checkStripeLoading();
  }, [toast]);

  const stripeOptions = {
    locale: 'en-GB', // Use UK English locale
  };

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
