import React from 'react';
import PlanCard, { PlanType } from './PlanCard';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/use-toast';

const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const {
    subscription,
    isLoading,
    isFree,
    isFoundation,
    isProgress,
    isPremium
  } = useSubscription();
  const { toast } = useToast();

  const handleUpgrade = async (priceId: string, planType: 'foundation' | 'progress' | 'premium', purchaseType: 'subscription' | 'one-time') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          priceId,
          planType,
          purchaseType,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/upgrade?payment=cancelled`,
          billingDetails: {
            schoolName: subscription?.schoolName || '',
            address: subscription?.schoolAddress || '',
            contactName: `${subscription?.firstName || ''} ${subscription?.lastName || ''}`.trim(),
            contactEmail: subscription?.email || ''
          }
        })
      });
      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your request. Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const getButtonText = (planType: PlanType) => {
    if (planType === 'free' && isFree || planType === 'foundation' && isFoundation || planType === 'progress' && isProgress || planType === 'premium' && isPremium) {
      return 'Your Current Plan';
    }

    const planLevels = {
      free: 0,
      foundation: 1,
      progress: 2,
      premium: 3
    };
    const currentPlanLevel = isFree ? 0 : isFoundation ? 1 : isProgress ? 2 : isPremium ? 3 : 0;
    const targetPlanLevel = planLevels[planType];
    
    if (targetPlanLevel < currentPlanLevel) {
      return 'Contact to Downgrade';
    }
    
    if (planType === 'free') {
      return 'Get Started';
    }
    
    return `Upgrade to ${planType.charAt(0).toUpperCase() + planType.slice(1)}`;
  };

  const getButtonVariant = (planType: PlanType): 'default' | 'outline' => {
    if (planType === 'free' && isFree || planType === 'foundation' && isFoundation || planType === 'progress' && isProgress || planType === 'premium' && isPremium) {
      return 'outline';
    }
    const planLevels = {
      free: 0,
      foundation: 1,
      progress: 2,
      premium: 3
    };
    const currentPlanLevel = isFree ? 0 : isFoundation ? 1 : isProgress ? 2 : isPremium ? 3 : 0;
    const targetPlanLevel = planLevels[planType];
    return targetPlanLevel > currentPlanLevel ? 'default' : 'outline';
  };

  const handleButtonClick = (planType: PlanType, onButtonClick: () => void) => {
    const planLevels = {
      free: 0,
      foundation: 1,
      progress: 2,
      premium: 3
    };
    const currentPlanLevel = isFree ? 0 : isFoundation ? 1 : isProgress ? 2 : isPremium ? 3 : 0;
    const targetPlanLevel = planLevels[planType];
    
    if (targetPlanLevel < currentPlanLevel) {
      window.location.href = 'mailto:happytohelp@humankindaward.com?subject=Plan Downgrade Request';
      return;
    }
    
    onButtonClick();
  };

  const plans = [
    {
      title: "Free",
      description: "Establish priority areas",
      price: "Free",
      features: [
        {
          text: "Easily issue surveys to staff by email or survey link"
        },
        {
          text: "Analyse survey results for your school"
        }
      ],
      planType: 'free' as PlanType,
      onButtonClick: () => handleButtonClick('free', () => navigate('/dashboard')),
      buttonText: getButtonText('free'),
      buttonVariant: getButtonVariant('free')
    },
    {
      title: "Foundation",
      description: "Plan for improvement",
      price: "£299",
      priceSubtext: "+ VAT (one-off payment)",
      features: [
        {
          text: "Everything in the Free plan, plus..."
        },
        {
          text: "Compare your survey results to national averages"
        },
        {
          text: "Easily plan for improvement with the Human Kind Framework and planning tool"
        }
      ],
      planType: 'foundation' as PlanType,
      onButtonClick: () => handleButtonClick('foundation', () => 
        isFree || isLoading ? handleUpgrade('price_foundation', 'foundation', 'one-time') : null
      ),
      buttonText: getButtonText('foundation'),
      buttonVariant: getButtonVariant('foundation'),
      disabled: isFoundation || isProgress || isPremium
    },
    {
      title: "Progress",
      description: "Comprehensive support & accreditation",
      price: "£1,499",
      priceSubtext: "+ VAT (3-year subscription)",
      features: [
        {
          text: "Everything in the Foundation plan, plus..."
        },
        {
          text: "1 space on our course 'Leading Staff Wellbeing'"
        },
        {
          text: "Formal accreditation and a logo you can use on your website"
        },
        {
          text: "Add additional users to collaborate on your plan"
        },
        {
          text: "Quarterly live staff wellbeing networks"
        },
        {
          text: "Unlimited email support"
        }
      ],
      planType: 'progress' as PlanType,
      isPopular: true,
      onButtonClick: () => handleButtonClick('progress', () => 
        isFree || isFoundation || isLoading ? handleUpgrade('price_progress', 'progress', 'subscription') : null
      ),
      buttonText: getButtonText('progress'),
      buttonVariant: getButtonVariant('progress'),
      disabled: isProgress || isPremium
    },
    {
      title: "Premium",
      description: "Maximum support & coaching",
      price: "£2,499",
      priceSubtext: "+ VAT (3-year subscription)",
      features: [
        {
          text: "Everything in the Progress plan, plus..."
        },
        {
          text: "Termly coaching meetings throughout your 3 year accreditation period"
        },
        {
          text: "Gold award' logo when accredited to celebrate your achievement",
          icon: 'trophy' as const
        }
      ],
      planType: 'premium' as PlanType,
      onButtonClick: () => handleButtonClick('premium', () => 
        isFree || isFoundation || isProgress || isLoading ? handleUpgrade('price_premium', 'premium', 'subscription') : null
      ),
      buttonText: getButtonText('premium'),
      buttonVariant: getButtonVariant('premium'),
      disabled: isPremium
    }
  ];

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-center mb-10 py-[30px]">Choose the Right Plan for Your Organisation</h2>
      
      <div className="grid md:grid-cols-4 gap-8">
        {plans.map((plan, index) => (
          <PlanCard key={index} {...plan} />
        ))}
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Need help choosing the right plan? <a href="mailto:happytohelp@humankindaward.com" className="text-brandPurple-600 underline">Contact our support team</a></p>
      </div>
    </div>
  );
};

export default PricingSection;
