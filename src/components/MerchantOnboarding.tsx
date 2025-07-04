
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Check, ArrowRight, Store, Shield, Zap } from 'lucide-react';
import { ShopifyService } from '@/services/shopifyService';

interface MerchantOnboardingProps {
  onComplete?: () => void;
}

const MerchantOnboarding: React.FC<MerchantOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [shopDomain, setShopDomain] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'growth' | 'pro'>('starter');
  const [installing, setInstalling] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      price: 29,
      returns: '100 returns/month',
      features: ['Basic AI suggestions', 'Email support', 'Standard analytics']
    },
    {
      id: 'growth' as const,
      name: 'Growth',
      price: 79,
      returns: '500 returns/month',
      features: ['Advanced AI suggestions', 'Priority support', 'Advanced analytics', 'Custom branding']
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: 149,
      returns: 'Unlimited returns',
      features: ['Enterprise AI', '24/7 support', 'Custom workflows', 'API access', 'White-label']
    }
  ];

  const handleShopifyInstall = async () => {
    if (!shopDomain.trim()) {
      toast({
        title: "Shop domain required",
        description: "Please enter your Shopify shop domain.",
        variant: "destructive",
      });
      return;
    }

    setInstalling(true);

    try {
      // Clean up shop domain
      let cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (!cleanDomain.includes('.myshopify.com') && !cleanDomain.includes('.')) {
        cleanDomain = `${cleanDomain}.myshopify.com`;
      }

      // Validate domain format
      if (!cleanDomain.includes('.')) {
        throw new Error('Please enter a valid shop domain');
      }

      console.log('🚀 Starting Shopify installation for:', cleanDomain);

      // Generate state parameter for security
      const state = crypto.randomUUID();
      sessionStorage.setItem('shopify_oauth_state', state);
      sessionStorage.setItem('selected_plan', selectedPlan);
      sessionStorage.setItem('shop_domain', cleanDomain);

      // Shopify OAuth parameters - these should come from environment
      const SHOPIFY_CLIENT_ID = 'your-shopify-client-id'; // This should be from Supabase secrets
      const SCOPES = 'read_orders,write_orders,read_customers,read_products';
      const CALLBACK_URL = `${window.location.origin}/api/auth/shopify/callback`;

      // Build Shopify OAuth URL
      const authUrl = new URL(`https://${cleanDomain}/admin/oauth/authorize`);
      authUrl.searchParams.set('client_id', SHOPIFY_CLIENT_ID);
      authUrl.searchParams.set('scope', SCOPES);
      authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('grant_options[]', 'per-user');

      console.log('🔗 Redirecting to Shopify OAuth:', authUrl.toString());

      // Redirect to Shopify OAuth
      window.location.href = authUrl.toString();

    } catch (error) {
      console.error('❌ Installation error:', error);
      toast({
        title: "Installation failed",
        description: error instanceof Error ? error.message : "There was an error starting the installation process.",
        variant: "destructive",
      });
      setInstalling(false);
    }
  };

  // Handle OAuth callback completion
  React.useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const shop = urlParams.get('shop');
      
      if (code && state && shop) {
        const savedState = sessionStorage.getItem('shopify_oauth_state');
        const savedPlan = sessionStorage.getItem('selected_plan') as 'starter' | 'growth' | 'pro';
        const savedDomain = sessionStorage.getItem('shop_domain');
        
        if (state === savedState && savedDomain) {
          try {
            console.log('✅ OAuth callback received, completing installation...');
            
            // Exchange code for access token (this would typically be done server-side)
            // For now, we'll simulate the merchant creation
            const { merchantId, error } = await ShopifyService.createMerchantFromShopify(
              savedDomain,
              `temp_token_${Date.now()}`, // This would be the real access token
              savedPlan || 'starter'
            );
            
            if (error) {
              throw new Error(error);
            }
            
            // Clear session storage
            sessionStorage.removeItem('shopify_oauth_state');
            sessionStorage.removeItem('selected_plan');
            sessionStorage.removeItem('shop_domain');
            
            toast({
              title: "Installation successful!",
              description: "Your Shopify store has been connected successfully.",
            });
            
            if (onComplete) {
              onComplete();
            }
            
          } catch (error) {
            console.error('❌ OAuth completion failed:', error);
            toast({
              title: "Installation failed",
              description: error instanceof Error ? error.message : "Failed to complete installation",
              variant: "destructive",
            });
          }
        }
      }
    };
    
    handleOAuthCallback();
  }, [onComplete, toast]);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-gray-600">Select the plan that fits your business needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer border-2 transition-colors ${
                    selectedPlan === plan.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      {plan.name}
                      {plan.id === 'growth' && (
                        <Badge variant="secondary">Popular</Badge>
                      )}
                    </CardTitle>
                    <div className="text-3xl font-bold">${plan.price}</div>
                    <CardDescription>{plan.returns}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Connect Your Shopify Store</h2>
              <p className="text-gray-600">Enter your Shopify store domain to get started</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="text-center">
                  <Zap className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <CardTitle>AI-Powered</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Smart product recommendations that turn returns into exchanges
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Store className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <CardTitle>Seamless Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Works directly with your existing Shopify store
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Shield className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                  <CardTitle>Secure & Compliant</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    GDPR compliant with enterprise-grade security
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <Card className="max-w-md mx-auto">
              <CardContent className="space-y-4 pt-6">
                <div>
                  <label htmlFor="shop-domain" className="block text-sm font-medium text-gray-700 mb-2">
                    Shop Domain
                  </label>
                  <Input
                    id="shop-domain"
                    type="text"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    placeholder="your-store.myshopify.com"
                    className="w-full"
                    disabled={installing}
                  />
                </div>
                
                <Button 
                  onClick={handleShopifyInstall}
                  disabled={installing || !shopDomain.trim()}
                  className="w-full"
                  size="lg"
                >
                  {installing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Store
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  <p>By connecting, you agree to our Terms of Service and Privacy Policy.</p>
                  <p className="mt-1">
                    <strong>Permissions:</strong> Read orders, customers, and products to provide return automation.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Returns Automation
          </h1>
          <p className="text-xl text-gray-600">
            Let's get your store set up in just a few steps
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
          </div>
        </div>

        {renderStepContent()}
      </div>
    </div>
  );
};

export default MerchantOnboarding;
