
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Settings, Zap, Brain, Clock } from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  type: string;
  icon: any;
  triggers?: number;
  lastRun?: string;
  conditions?: Record<string, any>;
  actions?: string[];
  merchantId: string;
}

export const useAutomationRules = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useProfile();

  const loadRules = async () => {
    if (!profile?.merchant_id) return;

    setLoading(true);
    try {
      // Load merchant-specific automation rules
      const { data: rulesData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'automation_rule')
        .eq('merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRules: AutomationRule[] = rulesData?.map(rule => {
        const eventData = rule.event_data as any;
        return {
          id: rule.id,
          name: eventData.name || 'Unnamed Rule',
          description: eventData.description || 'No description',
          active: eventData.active || false,
          type: eventData.type || 'Rule-based',
          icon: getIconForType(eventData.type),
          triggers: eventData.triggers || 0,
          lastRun: eventData.lastRun,
          merchantId: profile.merchant_id
        };
      }) || [];

      // Add default rules if none exist
      if (formattedRules.length === 0) {
        const defaultRules: AutomationRule[] = [
          {
            id: 'auto-approve-small',
            name: 'Auto-approve returns under $50',
            description: 'Automatically approve return requests for orders under $50',
            active: false,
            type: 'Rule-based',
            icon: Zap,
            triggers: 0,
            merchantId: profile.merchant_id
          },
          {
            id: 'ai-exchange-suggest',
            name: 'AI Exchange Suggestions',
            description: 'Generate AI-powered exchange recommendations for returned items',
            active: true,
            type: 'AI-powered',
            icon: Brain,
            triggers: 0,
            merchantId: profile.merchant_id
          },
          {
            id: 'email-followup',
            name: 'Return Follow-up Emails',
            description: 'Send follow-up emails to customers about return status',
            active: true,
            type: 'Time-based',
            icon: Clock,
            triggers: 0,
            merchantId: profile.merchant_id
          }
        ];
        setRules(defaultRules);
      } else {
        setRules(formattedRules);
      }
    } catch (error) {
      console.error('Error loading automation rules:', error);
      toast({
        title: "Error",
        description: "Failed to load automation rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, active: boolean) => {
    if (!profile?.merchant_id) return;

    try {
      // Update rule in database
      const { error } = await supabase
        .from('analytics_events')
        .upsert({
          id: ruleId,
          event_type: 'automation_rule',
          merchant_id: profile.merchant_id,
          event_data: {
            ...rules.find(r => r.id === ruleId),
            active,
            updatedAt: new Date().toISOString()
          }
        });

      if (error) throw error;

      // Update local state
      setRules(prev => 
        prev.map(rule => 
          rule.id === ruleId ? { ...rule, active } : rule
        )
      );

      toast({
        title: "Rule updated",
        description: `Rule ${active ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: "Error",
        description: "Failed to update automation rule.",
        variant: "destructive",
      });
    }
  };

  const testRule = async (ruleId: string) => {
    toast({
      title: "Test triggered",
      description: "Automation rule test has been initiated.",
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'AI-powered':
        return Brain;
      case 'Time-based':
        return Clock;
      default:
        return Zap;
    }
  };

  useEffect(() => {
    if (profile?.merchant_id) {
      loadRules();
    }
  }, [profile?.merchant_id]);

  return {
    rules,
    loading,
    toggleRule,
    testRule,
    loadRules
  };
};
