import type React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Bot, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const AICard = () => {
  // Parallax tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 100, damping: 12 });
  const ry = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 100, damping: 12 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set(px);
    y.set(py);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <TooltipProvider>
      <motion.div
        className="relative max-w-md mx-auto"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: 1000,
        }}
      >
        {/* Depth glow */}
        <motion.div
          className="absolute -inset-6 -z-10 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <motion.div style={{ rotateX: rx, rotateY: ry }}>
          <Card className="bg-card/90 backdrop-blur-xl border border-primary/20 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <motion.div
                  className="bg-gradient-to-br from-primary to-accent p-3 rounded-full"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" className="flex-1 bg-accent hover:bg-accent/90">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Apply the exchange and retain revenue</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1">
                      <X className="h-4 w-4 mr-2" />
                      Override
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dismiss or choose a different action</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Floating animation */}
        <motion.div
          className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur-xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>
    </TooltipProvider>
  );
};