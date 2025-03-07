
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
              name="Basic"
              price="£29"
              period="month"
              description="Essential features for small schools"
              features={[
                "Up to 5 active surveys",
                "Basic analytics",
                "Email support",
                "Data export (CSV)"
              ]}
              priceId="price_basic123"
              onSubscribe={() => handleSubscription('price_basic123', 'Basic')}
              isLoading={isLoading}
              highlighted={false}
            />
            
            <PricingPlan
              name="Professional"
              price="£79"
              period="month"
              description="Advanced features for growing schools"
              features={[
                "Unlimited active surveys",
                "Advanced analytics",
                "Priority email support",
                "Data export (CSV, PDF)",
                "Custom branding",
                "API access"
              ]}
              priceId="price_pro123"
              onSubscribe={() => handleSubscription('price_pro123', 'Professional')}
              isLoading={isLoading}
              highlighted={true}
            />
            
            <PricingPlan
              name="Enterprise"
              price="£199"
              period="month"
              description="Complete solution for large schools"
              features={[
                "All Professional features",
                "Dedicated account manager",
                "Phone support",
                "Custom reporting",
                "Staff training sessions",
                "SLA guarantee"
              ]}
              priceId="price_enterprise123"
              onSubscribe={() => handleSubscription('price_enterprise123', 'Enterprise')}
              isLoading={isLoading}
              highlighted={false}
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
