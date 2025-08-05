import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  BarChart3, 
  Bot, 
  RefreshCw, 
  Shield, 
  Zap, 
  Star,
  CheckCircle,
  Users,
  TrendingUp,
  Sparkles
} from "lucide-react";

const WaitlistLanding = () => {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleWaitlistSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address to join the waitlist.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual waitlist submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "🎉 You're on the waitlist!",
        description: "We'll notify you as soon as Returns Automation is available.",
      });
      
      setEmail('');
      setCompanyName('');
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <RefreshCw className="h-8 w-8 text-indigo-600" />
              <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Returns Automation
              </span>
              <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/return-portal">
              <Button variant="ghost" className="hover:bg-indigo-50">Return Portal</Button>
            </Link>
            <Link to="/shopify/install">
              <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                Install App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-6 text-indigo-600 border-indigo-200">
            <Star className="h-3 w-3 mr-1" />
            AI-Powered Returns Revolution
          </Badge>
          
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Transform Returns
            </span>
            <br />
            <span className="text-gray-900">Into Revenue</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            The first AI-driven returns automation platform that turns costly returns into profitable exchanges. 
            Join 500+ merchants already on our waitlist.
          </p>

          {/* Waitlist Form */}
          <Card className="max-w-lg mx-auto mb-12 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Join the Waitlist
              </CardTitle>
              <CardDescription>
                Get early access and 50% off your first year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWaitlistSubmission} className="space-y-4">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
                <Input
                  type="text"
                  placeholder="Company name (optional)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Waitlist
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
              
              <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No spam, ever
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Early access
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-gray-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">500+</div>
              <div className="text-sm">Merchants waiting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">$2M+</div>
              <div className="text-sm">Revenue saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">85%</div>
              <div className="text-sm">Exchange rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Makes Us Different
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Revolutionary features that transform the returns experience for both merchants and customers.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl w-fit">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">AI Exchange Engine</CardTitle>
              <CardDescription>
                Smart recommendations that turn 70% of returns into exchanges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Our AI analyzes customer behavior, product data, and inventory to suggest perfect exchange options in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl w-fit">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Instant Automation</CardTitle>
              <CardDescription>
                Zero-touch processing for 80% of return requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Automated approval rules, instant refunds, and smart routing reduce manual work by 90%.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl w-fit">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Revenue Recovery</CardTitle>
              <CardDescription>
                Recover 40% more revenue from returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Advanced analytics and AI-driven insights help recover lost revenue and reduce future returns.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join the Revolution?
          </h2>
          <p className="text-indigo-100 mb-8 max-w-2xl mx-auto text-lg">
            Be among the first to experience the future of returns automation. 
            Limited spots available for early access.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="px-8 py-3 text-lg bg-white text-indigo-600 hover:bg-gray-100 shadow-lg"
            onClick={() => (document.querySelector('input[type="email"]') as HTMLInputElement)?.focus()}
          >
            Secure Your Spot
            <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-indigo-400" />
              <span className="font-semibold text-white">Returns Automation</span>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/return-portal" className="text-gray-400 hover:text-white transition-colors">
                Return Portal
              </Link>
              <Link to="/shopify/install" className="text-gray-400 hover:text-white transition-colors">
                Install App
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WaitlistLanding;