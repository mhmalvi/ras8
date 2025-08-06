import { motion } from 'framer-motion';
import { Bot, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AICard = () => {
  return (
    <motion.div
      className="relative max-w-md mx-auto"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <Card className="bg-card/90 backdrop-blur-xl border border-primary/20 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <motion.div
              className="bg-gradient-to-br from-primary to-accent p-3 rounded-full"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Bot className="h-5 w-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-foreground">AI Suggestion</span>
                <Badge variant="secondary" className="text-xs">
                  92% confidence
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Don't refund yet. Offer exchange instead.
              </p>
              <motion.div
                className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <p className="text-sm font-medium text-accent">
                  Recommend: Blue Hoodie (Size L) → Blue Hoodie (Size XL)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer previously ordered Size L, likely needs larger size
                </p>
              </motion.div>
            </div>
          </div>
          
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            <Button size="sm" className="flex-1 bg-accent hover:bg-accent/90">
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Override
            </Button>
          </motion.div>
        </CardContent>
      </Card>
      
      {/* Floating animation */}
      <motion.div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur-xl"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
};