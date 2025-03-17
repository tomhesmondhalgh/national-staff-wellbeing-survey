
import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Check } from 'lucide-react';
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

  return (
    <Card className={`flex flex-col h-full ${plan.is_popular ? 'border-primary' : ''} ${className}`}>
      <CardHeader className="flex flex-col space-y-1">
        {plan.is_popular && (
          <Badge className="self-start mb-2">Most Popular</Badge>
        )}
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="text-muted-foreground">{plan.description}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
          {plan.purchase_type === 'subscription' && (
            <span className="text-muted-foreground ml-1">
              / {plan.duration_months ? `${plan.duration_months} months` : 'month'}
            </span>
          )}
          {plan.purchase_type === 'free' && (
            <span className="text-muted-foreground ml-1">Free forever</span>
          )}
        </div>
        
        {showFeatures && (
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
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
              Current Plan
            </Button>
          ) : plan.purchase_type === 'free' ? (
            <Button className="w-full" variant="outline">
              Free Plan
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handlePurchase}
              variant={plan.is_popular ? "default" : "outline"}
            >
              {plan.purchase_type === 'subscription' ? 'Subscribe' : 'Purchase'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default PlanCard;
