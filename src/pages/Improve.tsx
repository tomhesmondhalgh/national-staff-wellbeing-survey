
import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import PricingPlan from '../components/improve/PricingPlan';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';

const Improve = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubscription = async (priceId: string, planName: string) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/improve?canceled=true`,
          userId: user?.id
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check for URL parameters for success/cancel messages
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('success') === 'true') {
      toast.success('Subscription successful!', {
        description: 'Thank you for your subscription.'
      });
    }
    
    if (urlParams.get('canceled') === 'true') {
      toast.info('Subscription canceled', {
        description: 'You can complete your subscription at any time.'
      });
    }
  }, []);

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Improve Your Wellbeing Insights" 
          subtitle="Choose a plan that best fits your school's needs"
        />
        
        <div className="mt-8 max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Pricing Plans</h2>
            <p className="text-gray-600 mt-2">
              Unlock advanced features and support with our premium plans
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <PricingPlan
              title="Basic"
              price="£29/month"
              description="Essential features for small schools"
              features={[
                { name: "Up to 5 active surveys", included: true },
                { name: "Basic analytics", included: true },
                { name: "Email support", included: true },
                { name: "Data export (CSV)", included: true }
              ]}
              buttonText="Subscribe"
              onSelect={() => handleSubscription('price_basic123', 'Basic')}
              disabled={isLoading}
              popular={false}
            />
            
            <PricingPlan
              title="Professional"
              price="£79/month"
              description="Advanced features for growing schools"
              features={[
                { name: "Unlimited active surveys", included: true },
                { name: "Advanced analytics", included: true },
                { name: "Priority email support", included: true },
                { name: "Data export (CSV, PDF)", included: true },
                { name: "Custom branding", included: true },
                { name: "API access", included: true }
              ]}
              buttonText="Subscribe"
              onSelect={() => handleSubscription('price_pro123', 'Professional')}
              disabled={isLoading}
              popular={true}
            />
            
            <PricingPlan
              title="Enterprise"
              price="£199/month"
              description="Complete solution for large schools"
              features={[
                { name: "All Professional features", included: true },
                { name: "Dedicated account manager", included: true },
                { name: "Phone support", included: true },
                { name: "Custom reporting", included: true },
                { name: "Staff training sessions", included: true },
                { name: "SLA guarantee", included: true }
              ]}
              buttonText="Subscribe"
              onSelect={() => handleSubscription('price_enterprise123', 'Enterprise')}
              disabled={isLoading}
              popular={false}
            />
          </div>
          
          <div className="mt-12 p-6 bg-gray-50 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-gray-800">Need a custom solution?</h3>
            <p className="mt-2 text-gray-600">
              Contact us for custom pricing and feature requirements for your organization.
            </p>
            <button className="mt-4 btn-secondary">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Improve;
