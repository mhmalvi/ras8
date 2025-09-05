
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Shield, Users, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { signIn, signUp, user, loading: authLoading } = useAtomicAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });
  
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const from = location.state?.from?.pathname || '/dashboard';

  // Handle redirect when user is authenticated with Shopify context preservation
  useEffect(() => {
    if (user && !authLoading) {
      // Save any pending embedded context to database
      const pendingContext = localStorage.getItem('pending_embedded_context');
      if (pendingContext) {
        try {
          const context = JSON.parse(pendingContext);
          // Only process if timestamp is recent (within 5 minutes)
          if (Date.now() - context.timestamp < 5 * 60 * 1000) {
            supabase.rpc('update_embedded_context_from_auth', {
              p_user_id: user.id,
              p_shop_domain: context.shopDomain,
              p_host_param: context.hostParam,
              p_is_embedded: context.isEmbedded
            }).then(({ error: contextError }) => {
              if (contextError) {
                console.warn('⚠️ Could not save embedded context:', contextError.message);
              } else {
                console.log('💾 Embedded context saved to database for user:', user.id);
              }
            });
          }
          // Clear the pending context
          localStorage.removeItem('pending_embedded_context');
        } catch (e) {
          console.warn('Could not parse pending embedded context');
          localStorage.removeItem('pending_embedded_context');
        }
      }

      // Check if we need to preserve Shopify context from the original URL
      const searchParams = new URLSearchParams(window.location.search);
      const shopifyParams = new URLSearchParams();
      
      // Preserve shop and host parameters if they exist
      if (searchParams.get('shop')) {
        shopifyParams.set('shop', searchParams.get('shop')!);
      }
      if (searchParams.get('host')) {
        shopifyParams.set('host', searchParams.get('host')!);
      }
      if (searchParams.get('embedded')) {
        shopifyParams.set('embedded', searchParams.get('embedded')!);
      }
      
      // Try to get shop from database or localStorage if not in URL (for embedded apps)
      if (!searchParams.get('shop')) {
        // First try database for this user
        let shopFromStorage = null;
        try {
          const { data, error } = await supabase
            .rpc('get_embedded_context', { p_user_id: user.id })
            .single();
          
          if (!error && data?.shop_domain) {
            shopFromStorage = data.shop_domain;
            console.log('🗄️ Retrieved shop from database:', shopFromStorage);
            
            // Also get host param if available
            if (data.host_param) {
              searchParams.set('host', data.host_param);
              console.log('🗄️ Retrieved host param from database:', data.host_param);
            }
          }
        } catch (e) {
          console.warn('Could not retrieve shop from database:', e);
        }
        
        // Fallback to localStorage
        if (!shopFromStorage) {
          const lastDecision = localStorage.getItem('last_landing_decision');
          if (lastDecision) {
            try {
              const decision = JSON.parse(lastDecision);
              if (decision.context?.shopDomain) {
                shopFromStorage = decision.context.shopDomain;
              }
            } catch (e) {
              console.log('Could not parse last landing decision');
            }
          }
        }
        
        // Also check if we're in a frame (embedded context)
        const isInFrame = window.self !== window.top;
        const hasShopifyReferrer = document.referrer && (
          document.referrer.includes('shopify.com') || 
          document.referrer.includes('shopifycloud.com')
        );
        
        // If we detect embedded context, use stored shop or try to determine from referrer
        if (isInFrame || hasShopifyReferrer || shopFromStorage) {
          if (shopFromStorage) {
            shopifyParams.set('shop', shopFromStorage);
            shopifyParams.set('embedded', '1');
            console.log('🏪 Restored shop from localStorage:', shopFromStorage);
          } else if (hasShopifyReferrer) {
            // Try to extract shop from referrer
            const referrerMatch = document.referrer.match(/store\/([^\/]+)/);
            if (referrerMatch) {
              const shopName = referrerMatch[1];
              const shopDomain = shopName.includes('.myshopify.com') ? shopName : `${shopName}.myshopify.com`;
              shopifyParams.set('shop', shopDomain);
              shopifyParams.set('embedded', '1');
              console.log('🏪 Extracted shop from referrer:', shopDomain);
            }
          }
        }
      }
      
      // For embedded Shopify apps, always redirect to dashboard
      const isEmbeddedApp = isInFrame || hasShopifyReferrer || shopFromStorage;
      
      let redirectUrl;
      if (isEmbeddedApp) {
        // Force dashboard redirect for embedded apps with preserved context
        redirectUrl = shopifyParams.toString() 
          ? `/dashboard?${shopifyParams.toString()}`
          : '/dashboard';
      } else {
        // Standard redirect for non-embedded apps
        redirectUrl = shopifyParams.toString() 
          ? `${from}?${shopifyParams.toString()}`
          : from;
      }
      
      console.log('🔄 User authenticated, redirecting with Shopify context:', {
        from,
        redirectUrl,
        isEmbeddedApp,
        hasShop: shopifyParams.has('shop'),
        shopDomain: shopifyParams.get('shop'),
        forceDashboard: isEmbeddedApp
      });
      
      // For embedded apps, use immediate redirect
      if (isEmbeddedApp) {
        navigate(redirectUrl, { replace: true });
      } else {
        // Small delay for non-embedded apps
        setTimeout(() => {
          navigate(redirectUrl, { replace: true });
        }, 100);
      }
    }
  }, [user, authLoading, navigate, from]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Attempting sign in with:', signInForm.email);
      const { error } = await signIn(signInForm.email, signInForm.password);
      
      if (error) {
        console.error('❌ Sign in error:', error.message);
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message,
        });
      } else {
        console.log('✅ Sign in successful, saving embedded context...');
        
        // Save embedded app context to database if available
        const searchParams = new URLSearchParams(window.location.search);
        const shopDomain = searchParams.get('shop');
        const hostParam = searchParams.get('host');
        const isEmbedded = Boolean(shopDomain || hostParam || window.self !== window.top);
        
        // Store embedded context for later use (user might not be available yet)
        if (isEmbedded && shopDomain) {
          localStorage.setItem('pending_embedded_context', JSON.stringify({
            shopDomain,
            hostParam,
            isEmbedded,
            timestamp: Date.now()
          }));
          console.log('💾 Stored pending embedded context for user authentication');
        }
        
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        // Don't navigate here - let useEffect handle it
      }
    } catch (err) {
      console.error('💥 Unexpected sign in error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (signUpForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting sign up with:', signUpForm.email);
      const { error } = await signUp(
        signUpForm.email, 
        signUpForm.password,
        signUpForm.firstName,
        signUpForm.lastName
      );
      
      if (error) {
        console.error('❌ Sign up error:', error.message);
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message,
        });
      } else {
        console.log('✅ Sign up successful');
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        // Don't navigate here - let useEffect handle it after email verification
      }
    } catch (err) {
      console.error('💥 Unexpected sign up error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading if auth is still initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-muted-foreground">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Returns Automation</h1>
          <p className="text-gray-600 mt-2">AI-powered returns management for Shopify stores</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="text-center">
            <div className="mx-auto w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">AI Suggestions</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Customer Portal</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Secure & GDPR</p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Get Started</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInForm.email}
                      onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInForm.password}
                      onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">First Name</Label>
                      <Input
                        id="signup-firstname"
                        value={signUpForm.firstName}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input
                        id="signup-lastname"
                        value={signUpForm.lastName}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="At least 6 characters"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={signUpForm.confirmPassword}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
