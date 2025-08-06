import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  Sparkles,
  Building2,
  Globe,
  Target,
  Layers,
  Lock,
  Play,
  ChevronRight,
  Lightbulb,
  Award,
  Gauge
} from "lucide-react";

const WaitlistLanding = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    shopifyStore: '',
    businessSize: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(432);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch current waitlist count
    const fetchWaitlistCount = async () => {
      try {
        const { count } = await supabase
          .from('waitlist_signups')
          .select('*', { count: 'exact', head: true });
        
        if (count !== null) {
          setWaitlistCount(count + 400); // Add base number for social proof
        }
      } catch (error) {
        console.log('Could not fetch waitlist count');
      }
    };

    fetchWaitlistCount();
  }, []);

  const handleWaitlistSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.name.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please enter your name and email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('waitlist_signups')
        .insert({
          email: formData.email,
          name: formData.name,
          company: formData.shopifyStore || null,
          source: 'landing_page'
        });

      if (error) throw error;
      
      toast({
        title: "🎉 Welcome to the waitlist!",
        description: "You'll be among the first to know when we launch.",
      });
      
      setFormData({ email: '', name: '', shopifyStore: '', businessSize: '' });
      setWaitlistCount(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact our support team.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30" />
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(600px circle at 0% 0%, rgba(29, 78, 216, 0.15), transparent 50%)",
              "radial-gradient(600px circle at 100% 100%, rgba(16, 185, 129, 0.15), transparent 50%)",
              "radial-gradient(600px circle at 50% 0%, rgba(139, 92, 246, 0.15), transparent 50%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-8 w-8 text-primary" />
                </motion.div>
                <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <div>
                <span className="text-xl font-semibold text-foreground">
                  Returns Automation
                </span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  Early Access
                </Badge>
              </div>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Play className="h-4 w-4 mr-2" />
                See Demo
              </Button>
              <Button variant="outline" size="sm">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 pt-24 pb-16">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Badge variant="outline" className="mb-8 px-4 py-2 text-sm border-primary/20 text-primary bg-primary/5">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Built for Modern Shopify Brands
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <span className="block text-foreground mb-2">Reimagine Returns.</span>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Automate Revenue Retention
                </span>
                <span className="block text-foreground">with AI.</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                Your branded, intelligent return portal that turns refunds into loyalty — 
                built for modern Shopify brands scaling toward DTC excellence.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
              >
                <Button 
                  size="lg" 
                  className="px-8 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Join the Waitlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-4 text-lg border-border hover:bg-muted/50 transition-all duration-300"
                >
                  <Play className="mr-2 h-5 w-5" />
                  See How It Works
                </Button>
              </motion.div>
            </motion.div>

            {/* Waitlist Form */}
            <motion.div
              className="max-w-2xl mx-auto mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl flex items-center justify-center gap-3 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 2 }}
                    >
                      <Users className="h-6 w-6 text-primary" />
                    </motion.div>
                    Get Early Access
                  </CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    Join {waitlistCount.toLocaleString()}+ merchants already on the waitlist
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleWaitlistSubmission} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="h-12 border-border focus:border-primary focus:ring-primary/20"
                        required
                      />
                      <Input
                        type="email"
                        placeholder="Business Email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="h-12 border-border focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        type="url"
                        placeholder="Shopify Store URL (optional)"
                        value={formData.shopifyStore}
                        onChange={(e) => setFormData(prev => ({ ...prev, shopifyStore: e.target.value }))}
                        className="h-12 border-border focus:border-primary focus:ring-primary/20"
                      />
                      <Select value={formData.businessSize} onValueChange={(value) => setFormData(prev => ({ ...prev, businessSize: value }))}>
                        <SelectTrigger className="h-12 border-border focus:border-primary focus:ring-primary/20">
                          <SelectValue placeholder="Business Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="startup">Startup (0-10 employees)</SelectItem>
                          <SelectItem value="small">Small (11-50 employees)</SelectItem>
                          <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                          <SelectItem value="large">Large (200+ employees)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Joining waitlist...
                          </>
                        ) : (
                          <>
                            Secure Your Spot
                            <ChevronRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                  
                  <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      No spam, ever
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      50% off first year
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Priority support
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Social Proof Stats */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              <div className="text-center">
                <motion.div 
                  className="text-4xl font-bold text-primary mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.6, type: "spring" }}
                >
                  {waitlistCount.toLocaleString()}+
                </motion.div>
                <div className="text-muted-foreground">Merchants waiting</div>
              </div>
              <div className="text-center">
                <motion.div 
                  className="text-4xl font-bold text-green-600 mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.8, type: "spring" }}
                >
                  $3.2M+
                </motion.div>
                <div className="text-muted-foreground">Revenue projected to save</div>
              </div>
              <div className="text-center">
                <motion.div 
                  className="text-4xl font-bold text-purple-600 mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 2.0, type: "spring" }}
                >
                  87%
                </motion.div>
                <div className="text-muted-foreground">AI exchange success rate</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Three simple steps to transform your returns process and start retaining more revenue.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                title: "Connect Your Store",
                description: "One-click OAuth integration with your Shopify store. No technical setup required.",
                icon: <Globe className="h-8 w-8" />,
                delay: 0.2
              },
              {
                step: "02", 
                title: "AI Analyzes & Suggests",
                description: "Our AI evaluates each return and suggests the best exchange options with confidence scoring.",
                icon: <Bot className="h-8 w-8" />,
                delay: 0.4
              },
              {
                step: "03",
                title: "Track ROI in Real-Time",
                description: "Monitor revenue retention, exchange rates, and customer satisfaction through your dashboard.",
                icon: <BarChart3 className="h-8 w-8" />,
                delay: 0.6
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: item.delay }}
              >
                <Card className="relative h-full border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="text-center pb-6">
                    <div className="absolute -top-4 left-6">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold">
                        {item.step}
                      </Badge>
                    </div>
                    <motion.div
                      className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: 5 }}
                    >
                      <div className="text-primary-foreground">
                        {item.icon}
                      </div>
                    </motion.div>
                    <CardTitle className="text-xl mb-3">{item.title}</CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Key Benefits
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Revolutionary features designed specifically for modern Shopify brands.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: <Target className="h-8 w-8" />,
                title: "Reduce Refunds, Automatically",
                description: "AI-powered exchange suggestions turn 70% of returns into profitable exchanges",
                gradient: "from-blue-500 to-indigo-600"
              },
              {
                icon: <Bot className="h-8 w-8" />,
                title: "Exchange-First AI Suggestions", 
                description: "Smart recommendations with confidence scoring and real-time inventory awareness",
                gradient: "from-green-500 to-emerald-600"
              },
              {
                icon: <Gauge className="h-8 w-8" />,
                title: "Real-Time ROI Dashboard",
                description: "Track revenue retention, customer satisfaction, and operational efficiency",
                gradient: "from-purple-500 to-pink-600"
              },
              {
                icon: <Award className="h-8 w-8" />,
                title: "Fully Branded Experience",
                description: "White-labeled customer portal that matches your store's design and branding",
                gradient: "from-orange-500 to-red-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="text-center">
                    <motion.div
                      className={`bg-gradient-to-br ${feature.gradient} p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                      whileHover={{ rotate: 5 }}
                    >
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </motion.div>
                    <CardTitle className="text-lg mb-3">{feature.title}</CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-2xl font-semibold text-foreground mb-6">
              Built on Enterprise-Grade Infrastructure
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Supabase</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                <span>OpenAI</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                <span>n8n</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <span>Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600" />
        <div className="absolute inset-0 bg-black/20" />
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(600px circle at 20% 80%, rgba(120, 119, 198, 0.3), transparent 50%)",
              "radial-gradient(600px circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%)",
              "radial-gradient(600px circle at 40% 40%, rgba(120, 200, 255, 0.3), transparent 50%)"
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
        />
        
        <div className="relative container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to automate retention?
            </h2>
            <p className="text-blue-100 mb-10 max-w-3xl mx-auto text-xl leading-relaxed">
              Join the growing community of forward-thinking Shopify merchants 
              who are transforming their returns into revenue opportunities.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="px-8 py-4 text-lg bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300"
                  onClick={() => {
                    const form = document.querySelector('form');
                    form?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Get Early Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg border-white/30 text-white hover:bg-white/10 transition-all duration-300"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 text-primary" />
                <span className="font-semibold text-foreground">Returns Automation</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Transforming returns into revenue opportunities for modern Shopify brands.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Features</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Pricing</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Integrations</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">API</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">About</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Blog</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Careers</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Contact</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Help Center</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Privacy Policy</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Terms of Service</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Security</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Returns Automation. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground">
              Ready to automate retention? 
              <span 
                className="text-primary cursor-pointer hover:underline ml-1"
                onClick={() => {
                  const form = document.querySelector('form');
                  form?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Join the waitlist
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WaitlistLanding;