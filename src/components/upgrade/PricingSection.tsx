
import React, { useState, useEffect } from 'react';
import PlanCard, { PlanType } from './PlanCard';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  schoolAddress: string;
}

interface InvoiceDetails {
  schoolName: string;
  address: string;
  contactName: string;
  contactEmail: string;
  purchaseOrderNumber?: string;
  additionalInformation?: string;
}

const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<{type: 'foundation' | 'progress' | 'premium', purchaseType: 'subscription' | 'one-time'} | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    schoolName: '',
    address: '',
    contactName: '',
    contactEmail: '',
    purchaseOrderNumber: '',
    additionalInformation: ''
  });

  const {
    subscription,
    isLoading,
    isFree,
    isFoundation,
    isProgress,
    isPremium
  } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, school_name, school_address')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
        if (data) {
          setUserProfile({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            email: user.email || '',
            schoolName: data.school_name || '',
            schoolAddress: data.school_address || ''
          });

          // Pre-fill invoice details with profile data
          setInvoiceDetails({
            schoolName: data.school_name || '',
            address: data.school_address || '',
            contactName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            contactEmail: user.email || '',
            purchaseOrderNumber: '',
            additionalInformation: ''
          });
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const handleUpgrade = async (priceId: string, planType: 'foundation' | 'progress' | 'premium', purchaseType: 'subscription' | 'one-time') => {
    try {
      // Prevent multiple clicks
      if (isProcessing) {
        console.log('Already processing a payment request, please wait...');
        return;
      }
      
      setIsProcessing(true);
      
      console.log('Initiating upgrade process:', {
        priceId,
        planType,
        purchaseType,
        userProfile
      });

      toast({
        title: 'Processing',
        description: 'Preparing your payment session...',
      });

      const { data, error } = await supabase.functions.invoke('create-payment-session', {
        body: {
          priceId,
          planType,
          purchaseType,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/upgrade?payment=cancelled`,
          billingDetails: {
            schoolName: userProfile?.schoolName || '',
            address: userProfile?.schoolAddress || '',
            contactName: `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim(),
            contactEmail: userProfile?.email || ''
          }
        }
      });

      console.log('Payment session response:', { data, error });

      if (error) {
        console.error('Error creating payment session:', error);
        toast({
          title: 'Error',
          description: `Failed to create payment session: ${error.message || 'Unknown error'}`,
          variant: 'destructive'
        });
        setIsProcessing(false);
        throw error;
      }

      if (data?.url) {
        console.log('Redirecting to payment URL:', data.url);
        // Use window.open in a new tab to prevent issues with the current page
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
        toast({
          title: 'Error',
          description: 'No payment URL was returned. Please try again later.',
          variant: 'destructive'
        });
        setIsProcessing(false);
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your request. Please try again later.',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  const openInvoiceDialog = (planType: 'foundation' | 'progress' | 'premium', purchaseType: 'subscription' | 'one-time') => {
    setCurrentPlan({ type: planType, purchaseType });
    setShowInvoiceDialog(true);
  };

  const handleInvoiceRequest = async () => {
    if (!currentPlan || !user) {
      toast({
        title: 'Error',
        description: 'Missing plan information or user data',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create a subscription record with payment_method 'invoice'
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: currentPlan.type,
          status: 'pending',
          payment_method: 'invoice',
          purchase_type: currentPlan.purchaseType,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Add billing details to payment_history
        await supabase.from('payment_history').insert({
          subscription_id: data.id,
          payment_method: 'invoice',
          // Use standard UK pricing (no VAT included here)
          amount: currentPlan.type === 'foundation' 
            ? 299 
            : currentPlan.type === 'progress' 
              ? 1499 
              : 2499,
          currency: 'GBP',
          payment_status: 'pending',
          billing_school_name: invoiceDetails.schoolName,
          billing_address: invoiceDetails.address,
          billing_contact_name: invoiceDetails.contactName,
          billing_contact_email: invoiceDetails.contactEmail,
          invoice_number: `INV-${Date.now().toString().slice(-6)}`, // Simple invoice number generation
        });

        toast({
          title: 'Success',
          description: 'Your invoice request has been submitted. Our team will contact you shortly.',
        });

        setShowInvoiceDialog(false);
        navigate('/dashboard?payment=invoice-requested');
      }
    } catch (error) {
      console.error('Error requesting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your invoice request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
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
        isFree || isLoading 
          ? (userProfile && user
              ? () => openInvoiceDialog('foundation', 'one-time')
              : handleUpgrade('foundation_price', 'foundation', 'one-time'))
          : null
      ),
      buttonText: getButtonText('foundation'),
      buttonVariant: getButtonVariant('foundation'),
      disabled: isFoundation || isProgress || isPremium,
      hasInvoiceOption: true
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
        isFree || isFoundation || isLoading 
          ? (userProfile && user
              ? () => openInvoiceDialog('progress', 'subscription')
              : handleUpgrade('progress_price', 'progress', 'subscription'))
          : null
      ),
      buttonText: getButtonText('progress'),
      buttonVariant: getButtonVariant('progress'),
      disabled: isProgress || isPremium,
      hasInvoiceOption: true
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
        isFree || isFoundation || isProgress || isLoading 
          ? (userProfile && user
              ? () => openInvoiceDialog('premium', 'subscription')
              : handleUpgrade('premium_price', 'premium', 'subscription'))
          : null
      ),
      buttonText: getButtonText('premium'),
      buttonVariant: getButtonVariant('premium'),
      disabled: isPremium,
      hasInvoiceOption: true
    }
  ];

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-center mb-10 py-[30px]">Choose the Right Plan for Your Organisation</h2>
      
      <div className="grid md:grid-cols-4 gap-8">
        {plans.map((plan, index) => (
          <PlanCard 
            key={index} 
            {...plan} 
            disabled={plan.disabled || isProcessing} 
            hasInvoiceOption={plan.hasInvoiceOption}
            onInvoiceRequest={plan.hasInvoiceOption && user ? 
              () => openInvoiceDialog(plan.planType as 'foundation' | 'progress' | 'premium', 
                plan.planType === 'foundation' ? 'one-time' : 'subscription') 
              : undefined}
          />
        ))}
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Need help choosing the right plan? <a href="mailto:happytohelp@humankindaward.com" className="text-brandPurple-600 underline">Contact our support team</a></p>
      </div>

      {/* Invoice Request Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Request Invoice Payment</DialogTitle>
            <DialogDescription>
              Fill in your billing details below to request payment by invoice.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="schoolName">School/Organisation Name</Label>
                <Input
                  id="schoolName"
                  value={invoiceDetails.schoolName}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, schoolName: e.target.value})}
                  className="mt-1"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="address">Billing Address</Label>
                <Textarea
                  id="address"
                  value={invoiceDetails.address}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, address: e.target.value})}
                  className="mt-1"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={invoiceDetails.contactName}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, contactName: e.target.value})}
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={invoiceDetails.contactEmail}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, contactEmail: e.target.value})}
                  className="mt-1"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="purchaseOrderNumber">Purchase Order Number (optional)</Label>
                <Input
                  id="purchaseOrderNumber"
                  value={invoiceDetails.purchaseOrderNumber}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, purchaseOrderNumber: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="additionalInformation">Additional Information (optional)</Label>
                <Textarea
                  id="additionalInformation"
                  value={invoiceDetails.additionalInformation}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, additionalInformation: e.target.value})}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowInvoiceDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInvoiceRequest}
              disabled={isProcessing || !invoiceDetails.schoolName || !invoiceDetails.address || !invoiceDetails.contactName || !invoiceDetails.contactEmail}
            >
              {isProcessing ? 'Processing...' : 'Request Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingSection;
