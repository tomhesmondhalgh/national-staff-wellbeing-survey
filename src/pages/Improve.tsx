
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PricingPlan from '@/components/improve/PricingPlan';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Improve = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planName: string) => {
    if (!user) {
      toast.error('Please sign in to continue with the purchase');
      return;
    }

    setIsLoading(priceId);

    try {
      // Call our Supabase Edge Function to create a Stripe checkout
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true&plan=${planName}`,
          cancelUrl: `${window.location.origin}/improve?canceled=true`,
          userId: user?.id
        },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        toast.error('Failed to create checkout session');
        return;
      }

      // Redirect to Stripe Checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Invalid checkout session response');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(null);
    }
  };

  // Pricing features for different plans
  const basicFeatures = [
    { name: 'Basic wellbeing survey templates', included: true },
    { name: 'Unlimited surveys', included: true },
    { name: 'Basic analysis', included: true },
    { name: 'Email support', included: true },
    { name: 'Advanced analysis tools', included: false },
    { name: 'AI-powered insights', included: false },
    { name: 'Custom survey questions', included: false },
    { name: 'Priority support', included: false },
  ];

  const proFeatures = [
    { name: 'Basic wellbeing survey templates', included: true },
    { name: 'Unlimited surveys', included: true },
    { name: 'Basic analysis', included: true },
    { name: 'Email support', included: true },
    { name: 'Advanced analysis tools', included: true },
    { name: 'AI-powered insights', included: true },
    { name: 'Custom survey questions', included: true },
    { name: 'Priority support', included: true },
  ];

  const enterpriseFeatures = [
    { name: 'All Pro features', included: true },
    { name: 'Unlimited surveys', included: true },
    { name: 'Advanced analysis', included: true },
    { name: 'Email & phone support', included: true },
    { name: 'Advanced analysis tools', included: true },
    { name: 'AI-powered insights', included: true },
    { name: 'Custom survey questions', included: true },
    { name: 'Dedicated account manager', included: true },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
            Enhance Your Wellbeing Surveys
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Choose the plan that best fits your organization's needs and unlock advanced features to better understand wellbeing trends.
          </p>
        </div>

        {/* URL parameters handling */}
        {new URLSearchParams(window.location.search).get('canceled') === 'true' && (
          <div className="mb-8 p-4 border border-yellow-300 bg-yellow-50 rounded-md text-center text-yellow-800">
            Your payment was canceled. You can try again when you're ready.
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <PricingPlan
            title="Basic"
            price="Free"
            description="Essential wellbeing surveys for small organizations"
            features={basicFeatures}
            buttonText="Current Plan"
            onSelect={() => {}}
            disabled={true}
          />

          <PricingPlan
            title="Professional"
            price="£49/month"
            description="Advanced features for deeper insights"
            features={proFeatures}
            buttonText={isLoading === 'price_prod_professional' ? 
              <div className="flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</div> : 
              "Upgrade Now"}
            popular={true}
            onSelect={() => handleCheckout('price_prod_professional', 'Professional')}
            disabled={isLoading !== null}
          />

          <PricingPlan
            title="Enterprise"
            price="£199/month"
            description="Complete solution for large organizations"
            features={enterpriseFeatures}
            buttonText={isLoading === 'price_prod_enterprise' ? 
              <div className="flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</div> : 
              "Upgrade Now"}
            onSelect={() => handleCheckout('price_prod_enterprise', 'Enterprise')}
            disabled={isLoading !== null}
          />
        </div>

        <div className="mt-12 max-w-3xl mx-auto bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Need a custom solution?</h3>
          <p className="text-gray-600 mb-4">
            We offer tailored wellbeing survey solutions for organizations with unique requirements. Get in touch to learn more.
          </p>
          <Button variant="outline">Contact Sales</Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Improve;
