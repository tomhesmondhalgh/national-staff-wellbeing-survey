
import React from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Button } from '../components/ui/button';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../components/ui/card';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../hooks/use-toast';

const Improve = () => {
  const navigate = useNavigate();
  const { hasActiveSubscription, upgradePlan } = useSubscription();
  const { toast } = useToast();

  const handleUpgrade = async (priceId: string, planType: 'foundation' | 'progress' | 'premium', purchaseType: 'subscription' | 'one-time') => {
    try {
      const response = await upgradePlan({
        priceId,
        planType,
        purchaseType,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/improve?payment=cancelled`,
      });

      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your request. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const benefits = [
    {
      title: "Shows Staff You Value Them",
      description: "Your staff give so much to the young people they teach and support. Focussing on staff wellbeing shows that you support and value their contribution to the life of the school."
    },
    {
      title: "Happy Staff Get Great Results",
      description: "How can children achieve their full potential if the adults that teach and support them are stressed, exhausted and demotivated? Developing wellbeing creates an environment where staff can do their best every single day."
    },
    {
      title: "Less Recruitment Saves Money",
      description: "The whole recruitment process – advertising, readvertising, interviewing and recruitment fees – can be incredibly expensive. Happy staff in good working environments are more likely to stay with you, helping you save thousands of pounds every year."
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <PageTitle 
          title="Improvement Strategies" 
          subtitle="Enhance your wellbeing program with our premium plans"
          alignment="center"
        />
        
        <div className="max-w-3xl mx-auto my-8 text-center">
          <h2 className="text-2xl font-bold mb-6">Key Benefits of Upgrading</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-brandPurple-700 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
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
                <Button 
                  onClick={() => handleUpgrade('price_foundation', 'foundation', 'one-time')} 
                  className="w-full"
                  variant="outline"
                >
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
                <Button 
                  onClick={() => handleUpgrade('price_progress', 'progress', 'subscription')} 
                  className="w-full"
                >
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
                <Button 
                  onClick={() => handleUpgrade('price_premium', 'premium', 'subscription')} 
                  className="w-full"
                  variant="outline"
                >
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
    </MainLayout>
  );
};

export default Improve;
