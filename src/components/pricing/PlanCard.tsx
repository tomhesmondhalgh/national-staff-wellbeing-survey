
import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Check, Trophy } from 'lucide-react';
import { Plan, BillingDetails } from '../../types/subscription';
import { redirectToCheckout } from '../../utils/paymentUtils';
import { Badge } from '../ui/badge';

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  billingDetails?: BillingDetails;
  showFeatures?: boolean;
  showCta?: boolean;
  className?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrentPlan = false,
  billingDetails,
  showFeatures = true,
  showCta = true,
  className = ''
}) => {
  const formatPrice = (price: number, currency: string = 'GBP'): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(price / 100);
  };

  const handlePurchase = () => {
    redirectToCheckout(plan, billingDetails);
  };

  // Helper function to determine subscription text
  const getSubscriptionText = () => {
    if (plan.purchase_type === 'free') {
      return '';
    } else if (plan.purchase_type === 'one-time') {
      return '+ VAT (one-off payment)';
    } else if (plan.purchase_type === 'subscription' && plan.duration_months) {
      return `+ VAT (${plan.duration_months / 12}-year subscription)`;
    }
    return '';
  };

  const getDescriptionText = () => {
    switch(plan.name.toLowerCase()) {
      case 'free':
        return 'Establish priority areas';
      case 'foundation':
        return 'Plan for improvement';
      case 'progress':
        return 'Comprehensive support & accreditation';
      case 'premium':
        return 'Maximum support & coaching';
      default:
        return plan.description;
    }
  };

  return (
    <Card className={`flex flex-col h-full ${plan.is_popular ? 'border-primary shadow-md' : ''} ${className}`}>
      <CardHeader className="flex flex-col space-y-1">
        {plan.is_popular && (
          <Badge className="self-center mb-2">Most Popular</Badge>
        )}
        <h3 className="text-xl font-bold text-center">{plan.name}</h3>
        <p className="text-muted-foreground text-center">{getDescriptionText()}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4 text-center">
          <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
          {plan.purchase_type !== 'free' && (
            <div className="text-sm text-muted-foreground">
              {getSubscriptionText()}
            </div>
          )}
        </div>
        
        {showFeatures && (
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                {feature.includes('Gold award') ? (
                  <Trophy className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                )}
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      {showCta && (
        <CardFooter>
          {isCurrentPlan ? (
            <Button className="w-full" variant="outline" disabled>
              Your Current Plan
            </Button>
          ) : plan.purchase_type === 'free' ? (
            <Button className="w-full" variant="outline">
              Get Started
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handlePurchase}
              variant={plan.is_popular ? "default" : "outline"}
            >
              {`Upgrade to ${plan.name}`}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default PlanCard;
