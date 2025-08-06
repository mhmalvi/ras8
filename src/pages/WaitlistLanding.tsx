import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Gauge,
  Database,
  Cpu,
  Activity
} from "lucide-react";

const WaitlistLanding = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    shopifyStore: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(300);

  const { toast } = useToast();

  // Fetch waitlist count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count } = await supabase
          .from('waitlist_signups')
          .select('*', { count: 'exact', head: true });
        
        if (count !== null) {
          setWaitlistCount(count + 285); // Base number for social proof
        }
      } catch (error) {
        console.log('Could not fetch waitlist count');
      }
    };

    fetchCount();
  }, []);

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
          source: 'enterprise_landing'
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
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
        <motion.div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(circle at 20% 80%, hsla(37, 99%, 55%, 0.15), transparent 50%), 
                         radial-gradient(circle at 80% 20%, hsla(16, 85%, 59%, 0.15), transparent 50%),
                         radial-gradient(circle at 40% 40%, hsla(15, 61%, 19%, 0.1), transparent 50%)`
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
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
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
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
              <Button variant="outline" size="sm">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* 1. Hero Block - Conversion Magnet */}
      <section className="relative pt-24 pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Badge variant="outline" className="mb-8 px-4 py-2 text-sm border-primary/20 text-primary bg-primary/5">
                <Cpu className="h-4 w-4 mr-2" />
                AI-Powered Commerce Infrastructure
              </Badge>
              
              <motion.h1 
                className="text-6xl md:text-8xl font-display font-bold mb-8 leading-[1.05] tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <span className="block text-foreground mb-4">Returns</span>
                <span className="block text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-float">
                  Reinvented.
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-body"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Automate Refunds. Retain Revenue. Delight Customers.
                <br />
                <span className="text-lg mt-2 block">
                  A smart return automation engine that knows when to exchange, refund, or retain — 
                  so you don't lose loyal customers to a broken returns process.
                </span>
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    className="px-10 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl glow transition-all duration-300"
                  >
                    Join the Waitlist
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-10 py-4 text-lg border-border hover:bg-muted/50 transition-all duration-300"
                >
                  <Play className="mr-2 h-5 w-5" />
                  See Product in Action
                </Button>
              </motion.div>

              {/* 3D Visualization Placeholder */}
              <motion.div
                className="relative mx-auto max-w-4xl h-96 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-border/50 overflow-hidden depth-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 1 }}
              >
                <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                  <motion.div
                    className="grid grid-cols-3 gap-6 w-full max-w-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    {[Bot, BarChart3, TrendingUp].map((Icon, i) => (
                      <motion.div
                        key={i}
                        className="flex flex-col items-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30"
                        animate={{ 
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 4, 
                          repeat: Infinity, 
                          delay: i * 0.5 
                        }}
                      >
                        <Icon className="h-8 w-8 text-primary mb-2" />
                        <div className="text-xs text-muted-foreground text-center">
                          {['AI Engine', 'Analytics', 'Revenue'][i]}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Intelligent Outcomes Block - AI ROI Visualized */}
      <section className="py-24 bg-muted/30 relative">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
              Designed to Increase Retention,
              <br />
              <span className="text-gradient">Not Just Approvals.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { value: "37%", label: "Exchange Rate Uplift", icon: TrendingUp, color: "text-accent" },
              { value: "92%", label: "AI Confidence Accuracy", icon: Target, color: "text-primary" },
              { value: "$38K", label: "Revenue Recovered /mo", icon: Award, color: "text-emerald-500" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <Card className="text-center p-8 bg-card/50 backdrop-blur-sm border-border/30 hover:border-primary/30 transition-all duration-500 group depth-1">
                  <motion.div
                    className={`${stat.color} mb-4 mx-auto w-fit p-4 rounded-2xl bg-primary/10 group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: 10 }}
                  >
                    <stat.icon className="h-8 w-8" />
                  </motion.div>
                  <motion.div 
                    className={`text-6xl font-display font-bold ${stat.color} mb-3`}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.3, type: "spring" }}
                  >
                    ▲ {stat.value}
                  </motion.div>
                  <div className="text-muted-foreground font-body">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Product Explainer Block - How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-body">
              Three steps to transform your returns into revenue opportunities.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                title: "Connect Shopify",
                description: "Secure OAuth, instant setup",
                icon: Globe,
                details: "One-click integration with enterprise-grade security. No technical setup required."
              },
              {
                step: "02", 
                title: "AI Decision Engine",
                description: "Suggestions with confidence scores",
                icon: Bot,
                details: "Machine learning analyzes customer behavior, inventory, and preferences for optimal recommendations."
              },
              {
                step: "03",
                title: "Real-Time Dashboard",
                description: "Metrics, overrides, ROI tracking",
                icon: Activity,
                details: "Monitor performance, override AI decisions, and track revenue retention in real-time."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <Card className="relative h-full bg-card/50 backdrop-blur-sm border-border/30 hover:border-primary/30 transition-all duration-500 group depth-1">
                  <CardHeader className="text-center pb-6">
                    <div className="absolute -top-6 left-8">
                      <Badge className="bg-primary text-primary-foreground px-4 py-2 text-lg font-display font-bold">
                        {item.step}
                      </Badge>
                    </div>
                    <motion.div
                      className="bg-gradient-to-br from-primary to-accent p-6 rounded-3xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: 5 }}
                    >
                      <item.icon className="h-10 w-10 text-primary-foreground" />
                    </motion.div>
                    <CardTitle className="text-2xl font-display mb-3">{item.title}</CardTitle>
                    <CardDescription className="text-lg text-accent font-semibold mb-4">
                      {item.description}
                    </CardDescription>
                    <p className="text-muted-foreground leading-relaxed font-body">
                      {item.details}
                    </p>
                  </CardHeader>
                </Card>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                    <ChevronRight className="h-8 w-8 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Trust & Infrastructure Stack Block */}
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
              Built for scale. Backed by intelligence.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-body">
              Returns Automation is built using enterprise-grade tools, ensuring security, scalability, and speed from day one.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {[
              { name: "Supabase", icon: Database },
              { name: "OpenAI", icon: Bot },
              { name: "Stripe", icon: Lock },
              { name: "n8n", icon: RefreshCw },
              { name: "Shopify", icon: Building2 }
            ].map((tech, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 hover:border-primary/30 transition-all duration-300 group"
                whileHover={{ y: -5 }}
              >
                <tech.icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors duration-300 mb-3" />
                <span className="text-sm font-body font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {tech.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. Waitlist Form Block - Conversion Optimized */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
                Early Access.
                <br />
                <span className="text-gradient">Exclusive Benefits.</span>
              </h2>
              <p className="text-xl text-muted-foreground font-body mb-8">
                Join {waitlistCount.toLocaleString()}+ forward-thinking brands already automating their returns.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border-border/30 depth-2 glow">
                <CardHeader className="text-center pb-8">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 2 }}
                  >
                    <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  </motion.div>
                  <CardTitle className="text-2xl font-display">Get Early Access</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    Be first in line for the future of returns automation
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
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-14 text-lg bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 text-primary-foreground shadow-2xl glow transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-3"></div>
                            Joining waitlist...
                          </>
                        ) : (
                          <>
                            Join the Waitlist
                            <ArrowRight className="ml-2 h-5 w-5" />
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
                      50% off first year
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

      {/* 6. Navigation & Footer */}
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