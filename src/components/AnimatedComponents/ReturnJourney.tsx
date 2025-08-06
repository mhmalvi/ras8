import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  Bot, 
  CheckCircle, 
  Package, 
  RefreshCw,
  TrendingUp,
  User
} from 'lucide-react';

const JourneyStep = ({ 
  step, 
  title, 
  description, 
  children, 
  delay = 0 
}: {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="mb-24"
      initial={{ opacity: 0, y: 100 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
      transition={{ duration: 0.8, delay }}
    >
      <div className="text-center mb-12">
        <Badge className="mb-4 px-4 py-2 text-lg bg-primary text-primary-foreground">
          Step {step}
        </Badge>
        <h3 className="text-3xl font-bold text-foreground mb-4">{title}</h3>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
      </div>
      
      <div className="flex justify-center">
        {children}
      </div>
    </motion.div>
  );
};

export const ReturnJourney = () => {
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
            A Real Return Journey
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch how our AI transforms a typical refund into a profitable exchange
          </p>
        </motion.div>

        {/* Step 1: Customer initiates return */}
        <JourneyStep
          step={1}
          title="Customer initiates return"
          description="Sarah loves her hoodie but needs a different size. She visits your branded returns portal."
          delay={0.2}
        >
          <Card className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="bg-gradient-to-r from-primary to-accent p-3 rounded-full w-fit mx-auto mb-4">
                <Package className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Return Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Order Number</label>
                <Input value="#ORD-2024-001" readOnly className="bg-muted/50" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Email</label>
                <Input value="sarah@example.com" readOnly className="bg-muted/50" />
              </div>
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Blue Hoodie</p>
                    <p className="text-sm text-muted-foreground">Size L • $65.00</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Reason: Too small</p>
              </div>
              <Button className="w-full">Submit Return Request</Button>
            </CardContent>
          </Card>
        </JourneyStep>

        {/* Step 2: AI offers smarter option */}
        <JourneyStep
          step={2}
          title="AI offers a smarter option"
          description="Instead of processing a refund, our AI recognizes a perfect exchange opportunity."
          delay={0.4}
        >
          <Card className="w-full max-w-lg bg-card/90 backdrop-blur-xl border border-primary/30 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <motion.div
                  className="bg-gradient-to-br from-primary to-accent p-3 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bot className="h-6 w-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-foreground text-lg">AI Analysis Complete</span>
                    <Badge variant="secondary" className="text-xs bg-accent/20 text-accent">
                      94% confidence
                    </Badge>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-4">
                    <p className="font-medium text-accent mb-2">💡 Smart Exchange Detected</p>
                    <p className="text-sm text-foreground mb-3">
                      Customer likely needs larger size based on return reason and purchase history.
                    </p>
                    <div className="bg-background/50 rounded-lg p-3">
                      <p className="text-sm font-medium">Suggested Exchange:</p>
                      <p className="text-sm text-muted-foreground">Blue Hoodie (Size L) → Blue Hoodie (Size XL)</p>
                      <p className="text-xs text-accent mt-1">Same price • Customer keeps product • You keep revenue</p>
                    </div>
                  </div>
                  <motion.div
                    className="text-sm text-muted-foreground italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    "Don't refund yet. Offer exchange instead."
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </JourneyStep>

        {/* Step 3: You keep revenue, they stay loyal */}
        <JourneyStep
          step={3}
          title="You keep the revenue. They stay loyal."
          description="Sarah gets exactly what she wanted, and you retain $65 in revenue that would have been lost."
          delay={0.6}
        >
          <Card className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-accent/30 shadow-xl">
            <CardHeader className="text-center pb-4">
              <motion.div
                className="bg-gradient-to-r from-accent to-emerald-500 p-3 rounded-full w-fit mx-auto mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="h-6 w-6 text-white" />
              </motion.div>
              <CardTitle className="text-accent">Exchange Completed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <p className="text-2xl font-bold text-accent">$65</p>
                  <p className="text-xs text-muted-foreground">Revenue Retained</p>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <p className="text-2xl font-bold text-accent">98%</p>
                  <p className="text-xs text-muted-foreground">Customer Satisfaction</p>
                </div>
              </div>
              
              <div className="border border-accent/20 rounded-lg p-3 bg-accent/5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span className="font-medium text-accent">Status: Exchanged</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Blue Hoodie (Size L) → Blue Hoodie (Size XL)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer will receive new item in 2-3 business days
                </p>
              </div>

              <motion.div
                className="text-center text-sm text-accent font-medium bg-gradient-to-r from-accent/10 to-emerald-500/10 rounded-lg p-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
              >
                "The refund you used to lose? Retained. 
                <br />
                The customer you thought was gone? Retained."
              </motion.div>
            </CardContent>
          </Card>
        </JourneyStep>
      </div>
    </section>
  );
};
