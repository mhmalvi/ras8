import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  RefreshCw,
  ArrowUp
} from 'lucide-react';

const CountUpNumber = ({ 
  end, 
  duration = 2, 
  prefix = '', 
  suffix = '',
  decimals = 0
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (end - startValue) * easeOutQuart;
      
      setCount(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}{suffix}
    </span>
  );
};

const MetricCard = ({ 
  title, 
  value, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  icon: Icon, 
  trend, 
  delay = 0,
  description 
}: {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: any;
  trend: string;
  delay?: number;
  description: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group"
    >
      <Card className="bg-card/90 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500 shadow-lg hover:shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="bg-gradient-to-br from-primary to-accent p-3 rounded-xl"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex items-center gap-1 text-accent text-sm font-medium">
              <ArrowUp className="h-4 w-4" />
              {trend}
            </div>
          </div>
          <CardTitle className="text-lg text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="text-4xl font-bold text-foreground mb-2"
            initial={{ scale: 0.8 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.5, delay: delay + 0.3 }}
          >
            <CountUpNumber 
              end={value} 
              prefix={prefix} 
              suffix={suffix} 
              decimals={decimals}
              duration={2}
            />
          </motion.div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const DashboardMetrics = () => {
  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Animation */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(circle at 20% 80%, hsla(37, 99%, 55%, 0.1), transparent 50%)",
            "radial-gradient(circle at 80% 20%, hsla(16, 85%, 59%, 0.1), transparent 50%)",
            "radial-gradient(circle at 40% 40%, hsla(142, 71%, 45%, 0.1), transparent 50%)"
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      />
      
      <div className="container mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Track Every Outcome.
            <br />
            <span className="text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              In Real Time.
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI doesn't just make suggestions—it delivers measurable results you can track and optimize.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <MetricCard
            title="Retained Revenue"
            value={38000}
            prefix="$"
            suffix="/month"
            icon={DollarSign}
            trend="+127%"
            delay={0.2}
            description="Average monthly revenue saved through AI-powered exchange recommendations"
          />
          
          <MetricCard
            title="AI Suggestion Accuracy"
            value={92}
            suffix="%"
            icon={Target}
            trend="+15%"
            delay={0.4}
            description="Our machine learning improves with every return, getting smarter over time"
          />
          
          <MetricCard
            title="Exchange Rate Boost"
            value={37}
            prefix="+"
            suffix="%"
            icon={TrendingUp}
            trend="+12%"
            delay={0.6}
            description="Increase in customers choosing exchanges over refunds with AI assistance"
          />
        </div>

        {/* Live Dashboard Preview */}
        <motion.div
          className="mt-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <Card className="bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-5 w-5 text-primary" />
                </motion.div>
                <CardTitle>Live Dashboard</CardTitle>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">Real-time updates</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Today's Returns", value: "23", change: "+4" },
                  { label: "Exchanges", value: "18", change: "+6" },
                  { label: "Revenue Saved", value: "$1,247", change: "+$312" },
                  { label: "AI Accuracy", value: "94%", change: "+2%" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="text-center p-3 bg-background/50 rounded-lg"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                  >
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                    <motion.div 
                      className="text-xs text-accent font-medium mt-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.5 + index * 0.1 }}
                    >
                      {stat.change}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};