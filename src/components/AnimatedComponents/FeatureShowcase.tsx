import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bot, 
  BarChart3, 
  Settings, 
  Zap,
  ChevronRight,
  Filter,
  TrendingUp,
  CheckCircle,
  X,
  MoreHorizontal
} from 'lucide-react';

const FeatureCard = ({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  delay = 0 
}: {
  title: string;
  description: string;
  icon: any;
  children: React.ReactNode;
  delay?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="group"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="h-full bg-card/90 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500 shadow-lg hover:shadow-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="bg-gradient-to-br from-primary to-accent p-3 rounded-xl"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div
            animate={{ scale: isHovered ? 1.02 : 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AIPanel = () => (
  <div className="space-y-3">
    <motion.div
      className="border border-primary/20 rounded-lg p-3 bg-primary/5"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">High Confidence Suggestion</span>
        <Badge variant="secondary" className="text-xs">94%</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Exchange for same item in different size
      </p>
      <div className="flex gap-2">
        <Button size="sm" className="text-xs h-7 flex-1">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accept
        </Button>
        <Button size="sm" variant="outline" className="text-xs h-7">
          <X className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
    
    <motion.div
      className="border border-border rounded-lg p-3 bg-muted/30"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Medium Confidence</span>
        <Badge variant="outline" className="text-xs">67%</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Store credit with 10% bonus
      </p>
    </motion.div>
  </div>
);

const ReturnsTable = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-3">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Filter & manage all returns</span>
    </div>
    
    {[
      { id: "#001", customer: "Sarah M.", status: "pending", amount: "$65", action: "Exchange suggested" },
      { id: "#002", customer: "Mike R.", status: "approved", amount: "$89", action: "Refund approved" },
      { id: "#003", customer: "Lisa K.", status: "exchanged", amount: "$45", action: "Exchange completed" }
    ].map((row, index) => (
      <motion.div
        key={row.id}
        className="border border-border rounded-lg p-3 bg-background/50 hover:bg-background/80 transition-colors"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 + index * 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono">{row.id}</span>
            <span className="text-sm">{row.customer}</span>
            <Badge 
              variant={row.status === 'exchanged' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {row.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{row.amount}</span>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{row.action}</p>
      </motion.div>
    ))}
  </div>
);

const MetricsTimeline = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-3">
      <BarChart3 className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Revenue retention over time</span>
    </div>
    
    <div className="relative h-32 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4">
      <motion.div
        className="absolute bottom-4 left-4 right-4 h-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Simple chart visualization */}
        <div className="flex items-end gap-2 h-full">
          {[20, 35, 45, 60, 75, 85].map((height, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-t from-primary to-accent rounded-t flex-1"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
            />
          ))}
        </div>
      </motion.div>
      
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1 text-accent">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">+127%</span>
        </div>
      </div>
    </div>
    
    <div className="grid grid-cols-3 gap-2 text-center">
      {["Jan", "Feb", "Mar"].map((month, index) => (
        <motion.div
          key={month}
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 + index * 0.1 }}
        >
          {month}
        </motion.div>
      ))}
    </div>
  </div>
);

const ShopifyAuth = () => (
  <div className="space-y-4">
    <motion.div
      className="border border-border rounded-lg p-4 bg-background/50"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">S</span>
        </div>
        <div>
          <p className="font-medium text-sm">Shopify Integration</p>
          <p className="text-xs text-muted-foreground">Secure OAuth connection</p>
        </div>
      </div>
      
      <motion.div
        className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">Connected Successfully</span>
        </div>
        <p className="text-xs text-muted-foreground">
          yourstore.myshopify.com
        </p>
      </motion.div>
      
      <div className="space-y-2">
        {["Order access", "Product catalog", "Customer data"].map((permission, index) => (
          <motion.div
            key={permission}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            <CheckCircle className="h-3 w-3 text-accent" />
            <span className="text-xs text-muted-foreground">{permission}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </div>
);

export const FeatureShowcase = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Your Toolkit for
            <br />
            <span className="text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Smarter Returns
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Interactive components that put you in control of every return decision
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            title="AI Suggestions Panel"
            description="Intercept refund with smart exchange logic"
            icon={Bot}
            delay={0.2}
          >
            <AIPanel />
          </FeatureCard>

          <FeatureCard
            title="Returns Management"
            description="Control outcomes with a single click"
            icon={Settings}
            delay={0.4}
          >
            <ReturnsTable />
          </FeatureCard>

          <FeatureCard
            title="Metrics Timeline"
            description="Track revenue retention in real-time"
            icon={BarChart3}
            delay={0.6}
          >
            <MetricsTimeline />
          </FeatureCard>

          <FeatureCard
            title="Shopify Integration"
            description="One-click secure OAuth connection"
            icon={Zap}
            delay={0.8}
          >
            <ShopifyAuth />
          </FeatureCard>
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <p className="text-lg text-muted-foreground mb-6">
            Ready to see it all working together?
          </p>
          <Button size="lg" className="px-8">
            Join the Waitlist
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};