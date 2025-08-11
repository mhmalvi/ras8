import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowRight, 
  Bot, 
  RefreshCw, 
  Shield, 
  CheckCircle,
  Users,
  Building2,
  Globe,
  Lock,
  Play,
  Database,
  Sparkles
} from "lucide-react";

// Import the animated components
import { AICard } from '@/components/AnimatedComponents/AICard';
import { ReturnJourney } from '@/components/AnimatedComponents/ReturnJourney';
import { DashboardMetrics } from '@/components/AnimatedComponents/DashboardMetrics';
import { FeatureShowcase } from '@/components/AnimatedComponents/FeatureShowcase';

const WaitlistLanding = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    shopifyStore: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
const [waitlistCount, setWaitlistCount] = useState(500);
const [showWalkthrough, setShowWalkthrough] = useState(false);

const { toast } = useToast();

  // Fetch waitlist count - EXACT SAME functionality preserved
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count } = await supabase
          .from('waitlist_signups')
          .select('*', { count: 'exact', head: true });
        
        if (count !== null) {
          setWaitlistCount(count + 485); // Base number for social proof
        }
      } catch (error) {
        console.log('Could not fetch waitlist count');
      }
    };

    fetchCount();
  }, []);

  // Form submission - EXACT SAME functionality preserved
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please enter your name and email.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('waitlist_signups')
        .insert({
          name: formData.name,
          email: formData.email,
          company: formData.shopifyStore || null,
          source: 'story_landing'
        });

      if (error) throw error;
      
      toast({
        title: "🎉 You're in!",
        description: "Welcome to the future of returns automation.",
      });
      
      setFormData({ name: '', email: '', shopifyStore: '' });
      setWaitlistCount(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Neural Mesh Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        <motion.div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, hsla(37, 99%, 55%, 0.15), transparent 50%), 
              radial-gradient(circle at 80% 20%, hsla(16, 85%, 59%, 0.15), transparent 50%),
              radial-gradient(circle at 40% 40%, hsla(142, 71%, 45%, 0.1), transparent 50%)
            `
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Neural network pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <motion.nav 
        className="relative z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl"
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
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <span className="text-xl font-display font-semibold text-foreground">
                  Returns Automation
                </span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  Early Access
                </Badge>
              </div>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Product
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Docs
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Blog
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const form = document.querySelector('form');
                  form?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Join Waitlist
              </Button>
            </div>
          </div>
        </div>
</motion.nav>

{/* Walkthrough Modal */}
<Dialog open={showWalkthrough} onOpenChange={setShowWalkthrough}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Animated Walkthrough</DialogTitle>
      <DialogDescription>
        See how AI intercepts refunds, suggests exchanges, and updates your dashboard in real time.
      </DialogDescription>
    </DialogHeader>

    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <AICard />
      </div>
      <div className="space-y-4">
        <div className="border border-border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Return #001 • Sarah M.</span>
            <Badge variant="secondary" className="text-xs">pending</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Blue Hoodie • Reason: Too small</p>
          <div className="mt-3 flex items-center gap-2">
            <Badge className="text-xs">Exchange suggested</Badge>
            <span className="text-xs text-accent">Revenue Recovered: $72.40</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[{label:'Exchanges',value:'18'},{label:'Revenue Saved',value:'$1,247'},{label:'AI Accuracy',value:'94%'}].map((s, i) => (
            <motion.div key={i} className="p-3 bg-background/60 rounded-lg border border-border/50" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2*i}}>
              <div className="text-lg font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* 1. Hero Section - "Returns. Reimagined." */}
      <section className="relative pt-24 pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Headline & CTAs */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Badge variant="outline" className="mb-8 px-4 py-2 text-sm border-primary/20 text-primary bg-primary/5">
                  <Bot className="h-4 w-4 mr-2" />
                  AI-Powered Commerce Infrastructure
                </Badge>
                
                <h1 className="text-6xl md:text-7xl font-display font-bold mb-8 leading-[1.05] tracking-tight">
                  <span className="block text-foreground mb-2">Your Refund Problem</span>
                  <span className="block text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Has an AI Solution.
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                  Returns Automation turns costly refunds into personalized exchanges — 
                  with real-time AI decisions, merchant controls, and a fully branded experience.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="lg" 
                      className="px-10 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl glow transition-all duration-300"
                      onClick={() => {
                        const form = document.querySelector('form');
                        form?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Join the Waitlist
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                  
<Button 
                    variant="outline" 
                    size="lg" 
                    className="px-10 py-4 text-lg border-border hover:bg-muted/50 transition-all duration-300"
                    onClick={() => setShowWalkthrough(true)}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    See It In Action
                  </Button>
                </div>

                {/* Social proof */}
                <motion.div
                  className="flex items-center gap-6 text-muted-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium">{waitlistCount.toLocaleString()}+ merchants waiting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium">$3.2M+ projected savings</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right: Floating AI Card */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <AICard />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Scroll Scene - Return Journey Story */}
      <div id="return-journey">
        <ReturnJourney />
      </div>

      {/* 3. Smart Dashboard Highlights */}
      <DashboardMetrics />

      {/* 4. Feature Use Cases Grid */}
      <FeatureShowcase />

      {/* 5. Infrastructure & Trust Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Enterprise Ready. API-Friendly.
              <br />
              <span className="text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Fully Secure.
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built with enterprise-grade infrastructure for security, scalability, and compliance.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-4xl mx-auto mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {[
              { name: "Supabase", subtitle: "PostgreSQL, RLS", icon: Database },
              { name: "OpenAI", subtitle: "LLM", icon: Bot },
              { name: "Stripe", subtitle: "Billing", icon: Lock },
              { name: "n8n", subtitle: "Automation", icon: RefreshCw },
              { name: "Shopify", subtitle: "OAuth", icon: Building2 }
            ].map((tech, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 hover:border-primary/30 transition-all duration-300 group"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <tech.icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors duration-300 mb-3" />
                <span className="text-sm font-body font-medium text-foreground mb-1">
                  {tech.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tech.subtitle}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust bullets */}
          <motion.div
            className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {[
              "GDPR-ready compliance",
              "Row-level security",
              "Scales to millions",
              "Audit logging + encryption"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 6. Early Access + Waitlist CTA */}
      <section className="py-32 relative">
        {/* Animated background with live dashboard */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%']
            }}
            transition={{ duration: 30, repeat: Infinity, repeatType: "reverse" }}
            style={{
              backgroundImage: 'linear-gradient(45deg, transparent 30%, hsl(var(--primary) / 0.1) 50%, transparent 70%)',
              backgroundSize: '200% 200%'
            }}
          />
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6">
                Join {waitlistCount.toLocaleString()}+ DTC brands
                <br />
                <span className="text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  reshaping returns.
                </span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Get early access + 60 days free at launch.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl glow">
                <CardHeader className="text-center pb-8">
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                  >
                    <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                  </motion.div>
                  <CardTitle className="text-3xl font-display">Early Access</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    Be first in line for the AI revolution in returns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="h-14 text-lg border-border focus:border-primary focus:ring-primary/20 bg-background/50"
                        required
                      />
                      <Input
                        type="email"
                        placeholder="Work Email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="h-14 text-lg border-border focus:border-primary focus:ring-primary/20 bg-background/50"
                        required
                      />
                      <Input
                        type="url"
                        placeholder="Shopify Store URL (optional)"
                        value={formData.shopifyStore}
                        onChange={(e) => setFormData(prev => ({ ...prev, shopifyStore: e.target.value }))}
                        className="h-14 text-lg border-border focus:border-primary focus:ring-primary/20 bg-background/50"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        Notify me when AI Suggestions Dashboard is live
                      </span>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-16 text-xl bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 text-primary-foreground shadow-2xl glow transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground mr-3"></div>
                            Joining waitlist...
                          </>
                        ) : (
                          <>
                            Join the Waitlist
                            <ArrowRight className="ml-3 h-6 w-6" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                  
                  <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      No spam, ever
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      60 days free
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      Priority support
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/50 backdrop-blur-xl border-t border-border/40">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-8 w-8 text-primary" />
                <span className="text-xl font-display font-semibold text-foreground">Returns Automation</span>
              </div>
              <p className="text-muted-foreground font-body leading-relaxed max-w-md">
                Transforming returns into revenue opportunities for the next generation of commerce brands.
              </p>
            </div>
            
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Product</h4>
              <div className="space-y-3 text-sm font-body">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Features</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Pricing</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Integrations</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">API</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
              <div className="space-y-3 text-sm font-body">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">About</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Blog</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Careers</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Contact</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Support</h4>
              <div className="space-y-3 text-sm font-body">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Docs</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Privacy</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Terms</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Security</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground font-body">
              © 2024 Returns Automation. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground font-body">
              Ready to automate retention? 
              <span 
                className="text-primary cursor-pointer hover:underline ml-2 font-semibold"
                onClick={() => {
                  const form = document.querySelector('form');
                  form?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Join the waitlist →
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WaitlistLanding;