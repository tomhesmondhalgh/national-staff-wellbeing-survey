import React from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../hooks/use-toast';

// Let's create an upgradePlan function in useSubscription hook
const Improve = () => {
  const navigate = useNavigate();
  const {
    subscription,
    isLoading
  } = useSubscription();
  const {
    toast
  } = useToast();
  const handleUpgrade = async (priceId: string, planType: 'foundation' | 'progress' | 'premium', purchaseType: 'subscription' | 'one-time') => {
    try {
      // Call Supabase Edge Function to create a payment session
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
  return <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <PageTitle title="Improving Staff Wellbeing Made Easy" subtitle="Effective evidence-based strategies in an easy-to-use plan" alignment="center" />
        
        <div className="max-w-4xl mx-auto my-8 text-center">
          <p className="text-lg leading-relaxed text-gray-700 mb-8">Now you know the challenges staff face in your organisation, and the areas they'd like to change, how do you go about making that change happen? The Human Kind Award framework is a detailed set of 59 strategies you can use in your organisation to improve staff wellbeing. These 59 strategies are divided across 8 domains: Leadership, workload, health, life-work balance, connection, growth, support and values. Each domain matches exactly to a wellbeing indicator in your survey, so if you spot an area of weakness from your responses its easy to hone in and identify the set of strategies that will make the biggest difference. Sign up for our Foundation package below to access the Human Kind Framework and action planning tool online, or sign up for one of our more complete packages to access a huge range of support alongside it - to help you meet your goals faster.</p>
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-10">Choose the Right Plan for Your Organisation</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Foundation Plan */}
            <Card className="relative border-brandPurple-200 hover:border-brandPurple-400 transition-colors duration-300">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-brandPurple-700">Foundation</CardTitle>
                <CardDescription>Essential tools for wellbeing</CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-4">
                <p className="text-3xl font-bold">£299</p>
                <p className="text-sm text-gray-500 mb-6">+ VAT (one-off payment)</p>
                
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>The complete Human Kind Framework and online planning tool</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleUpgrade('price_foundation', 'foundation', 'one-time')} className="w-full" variant="outline">
                  Get Started
                </Button>
              </CardFooter>
            </Card>
            
            {/* Progress Plan - Most Popular */}
            <Card className="relative border-brandPurple-400 shadow-lg hover:shadow-xl transition-shadow duration-300 scale-105 z-10">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-brandPurple-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-brandPurple-700">Progress</CardTitle>
                <CardDescription>Comprehensive support & accreditation</CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-4">
                <p className="text-3xl font-bold">£1,499</p>
                <p className="text-sm text-gray-500 mb-6">+ VAT (3-year subscription)</p>
                
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>The complete Human Kind Framework and online planning tool</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>1 space on in-depth training to improve staff wellbeing</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Review of your evidence by one of our experienced coaches</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Quarterly live staff wellbeing networks for one person</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Formal accreditation and a logo you can use on your website</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Unlimited email support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleUpgrade('price_progress', 'progress', 'subscription')} className="w-full">
                  Upgrade to Progress
                </Button>
              </CardFooter>
            </Card>
            
            {/* Premium Plan */}
            <Card className="relative border-brandPurple-200 hover:border-brandPurple-400 transition-colors duration-300">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-brandPurple-700">Premium</CardTitle>
                <CardDescription>Maximum support & coaching</CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-4">
                <p className="text-3xl font-bold">£2,499</p>
                <p className="text-sm text-gray-500 mb-6">+ VAT (3-year subscription)</p>
                
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>The complete Human Kind Framework and online planning tool</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>1 space on in-depth training to improve staff wellbeing</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Review of your evidence by one of our experienced coaches</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Quarterly live staff wellbeing networks for one person</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Formal accreditation and a logo you can use on your website</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Unlimited email support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span className="font-medium">Termly coaching meetings throughout your 3 year accreditation period</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleUpgrade('price_premium', 'premium', 'subscription')} className="w-full" variant="outline">
                  Upgrade to Premium
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