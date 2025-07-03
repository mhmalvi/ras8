
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Rocket } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const SubscriptionPlans = () => {
  const { subscriptionData, createCheckout, loading } = useSubscription();

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small businesses just getting started',
      icon: <Zap className="h-6 w-6" />,
      features: [
        'Up to 100 returns per month',
        'Basic AI suggestions',
        'Email notifications',
        'Standard support'
      ],
      popular: false
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '$79',
      period: '/month',
      description: 'Ideal for growing businesses with higher volume',
      icon: <Rocket className="h-6 w-6" />,
      features: [
        'Up to 500 returns per month',
        'Advanced AI recommendations',
        'Priority email notifications',
        'Analytics dashboard',
        'Priority support'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$149',
      period: '/month',
      description: 'For established businesses with high return volumes',
      icon: <Crown className="h-6 w-6" />,
      features: [
        'Unlimited returns',
        'Premium AI insights',
        'Custom email templates',
        'Advanced analytics',
        'Dedicated support',
        'API access'
      ],
      popular: false
    }
  ];

  const handleSelectPlan = (planId: string) => {
    createCheckout(planId);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrentPlan = subscriptionData.plan_type === plan.id && subscriptionData.subscribed;
        const isTrialing = subscriptionData.trial_active && subscriptionData.plan_type === plan.id;
        
        return (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                Most Popular
              </Badge>
            )}
            {isCurrentPlan && (
              <Badge className="absolute -top-2 right-4 bg-green-500">
                Current Plan
              </Badge>
            )}
            {isTrialing && (
              <Badge className="absolute -top-2 left-4 bg-orange-500">
                Free Trial
              </Badge>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4 text-blue-600">
                {plan.icon}
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-slate-500">{plan.period}</span>
              </div>
              <CardDescription className="mt-2">
                {plan.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading || isCurrentPlan}
                className="w-full mt-6"
                variant={isCurrentPlan ? "outline" : (plan.popular ? "default" : "outline")}
              >
                {isCurrentPlan 
                  ? 'Current Plan' 
                  : isTrialing 
                    ? 'Trialing' 
                    : `Start ${plan.name} Plan`
                }
              </Button>
              
              {!isCurrentPlan && !isTrialing && (
                <p className="text-xs text-center text-slate-500 mt-2">
                  14-day free trial included
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SubscriptionPlans;
