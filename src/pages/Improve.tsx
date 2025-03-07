import React from 'react';
import { Check, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../hooks/use-toast';

const Improve = () => {
  const navigate = useNavigate();
  const {
    subscription,
    isLoading,
    isFree,
    isFoundation,
    isProgress,
    isPremium
  } = useSubscription();
  const {
    toast
  } = useToast();

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
          cancelUrl: `${window.location.origin}/improve?payment=cancelled`
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

  const getButtonText = (planType: 'free' | 'foundation' | 'progress' | 'premium') => {
    if (planType === 'free' && isFree || planType === 'foundation' && isFoundation || planType === 'progress' && isProgress || planType === 'premium' && isPremium) {
      return 'Your Current Plan';
    }
    if (planType === 'free') {
      return 'Get Started';
    }
    const planLevels = {
      free: 0,
      foundation: 1,
      progress: 2,
      premium: 3
    };
    const currentPlanLevel = isFree ? 0 : isFoundation ? 1 : isProgress ? 2 : isPremium ? 3 : 0;
    const targetPlanLevel = planLevels[planType];
    if (targetPlanLevel > currentPlanLevel) {
      return `Upgrade to ${planType.charAt(0).toUpperCase() + planType.slice(1)}`;
    } else {
      return `Downgrade to ${planType.charAt(0).toUpperCase() + planType.slice(1)}`;
    }
  };

  const getButtonVariant = (planType: 'free' | 'foundation' | 'progress' | 'premium') => {
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

  return <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <PageTitle title="Improving Staff Wellbeing Made Easy" subtitle="Effective evidence-based strategies in an easy-to-use plan" alignment="center" />
        
        <div className="flex justify-center gap-6 mt-6 mb-8">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-gray-700 font-medium">Show Staff You Value Them</span>
          </div>
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-gray-700 font-medium">Keep Your Best Staff</span>
          </div>
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-gray-700 font-medium">Save Money on Recruitment</span>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto my-8 text-center">
          <p className="text-lg leading-relaxed text-gray-700 mb-4">Now you know the challenges staff face in your organisation, and the areas they'd like to change, how do you go about making that change happen? The Human Kind Award framework is a detailed set of 59 strategies you can use in your organisation to improve staff wellbeing.</p>
          
          <p className="text-lg leading-relaxed text-gray-700 mb-8">Sign up for our Foundation package below to access the Human Kind Framework and action planning tool online, or sign up for one of our more complete packages to access a huge range of support alongside it - to help you meet your goals faster.</p>
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-10 py-[30px]">Choose the Right Plan for Your Organisation</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="relative border-brandPurple-200 hover:border-brandPurple-400 transition-colors duration-300 flex flex-col">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-brandPurple-700">Free</CardTitle>
                <CardDescription>Establish priority areas</CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-4 flex-grow">
                <p className="text-3xl font-bold">Free</p>
                <p className="text-sm text-gray-500 mb-6">&nbsp;</p>
                
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Easily issue surveys to staff by email or survey link</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Analyse survey results for your school</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button onClick={() => navigate('/dashboard')} className="w-full" variant={getButtonVariant('free')}>
                  {getButtonText('free')}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="relative border-brandPurple-200 hover:border-brandPurple-400 transition-colors duration-300 flex flex-col">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-brandPurple-700">Foundation</CardTitle>
                <CardDescription>Plan for improvement</CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-4 flex-grow">
                <p className="text-3xl font-bold">£299</p>
                <p className="text-sm text-gray-500 mb-6">+ VAT (one-off payment)</p>
                
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Everything in the Free plan, plus...</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Compare your survey results to national averages</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Easily plan for improvement with the Human Kind Framework and planning tool</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button onClick={() => isFree || isLoading ? handleUpgrade('price_foundation', 'foundation', 'one-time') : null} className="w-full" variant={getButtonVariant('foundation')} disabled={isFoundation || isProgress || isPremium}>
                  {getButtonText('foundation')}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="relative border-brandPurple-400 shadow-lg hover:shadow-xl transition-shadow duration-300 scale-105 z-10 flex flex-col">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-brandPurple-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-brandPurple-700">Progress</CardTitle>
                <CardDescription>Comprehensive support & accreditation</CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-4 flex-grow">
                <p className="text-3xl font-bold">£1,499</p>
                <p className="text-sm text-gray-500 mb-6">+ VAT (3-year subscription)</p>
                
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Everything in the Foundation plan, plus...</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>1 space on our course 'Leading Staff Wellbeing'</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Quarterly live staff wellbeing networks</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Formal accreditation and a logo you can use on your website</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button onClick={() => isFree || isFoundation || isLoading ? handleUpgrade('price_progress', 'progress', 'subscription') : null} className="w-full" variant={getButtonVariant('progress')} disabled={isProgress || isPremium}>
                  {getButtonText('progress')}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="relative border-brandPurple-200 hover:border-brandPurple-400 transition-colors duration-300 flex flex-col">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-brandPurple-700">Premium</CardTitle>
                <CardDescription>Maximum support & coaching</CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-4 flex-grow">
                <p className="text-3xl font-bold">£2,499</p>
                <p className="text-sm text-gray-500 mb-6">+ VAT (3-year subscription)</p>
                
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Everything in the Progress plan, plus...</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Termly coaching meetings throughout your 3 year accreditation period</span>
                  </li>
                  <li className="flex items-start">
                    <Trophy className="h-5 w-5 text-yellow-500 mr-2 shrink-0 mt-0.5" />
                    <span>'Gold award' logo when accredited to celebrate your achievement</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button onClick={() => isFree || isFoundation || isProgress || isLoading ? handleUpgrade('price_premium', 'premium', 'subscription') : null} className="w-full" variant={getButtonVariant('premium')} disabled={isPremium}>
                  {getButtonText('premium')}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Need help choosing the right plan? <a href="mailto:support@wellbeingsurvey.com" className="text-brandPurple-600 underline">Contact our support team</a></p>
          </div>
        </div>
      </div>
    </MainLayout>;
};

export default Improve;
