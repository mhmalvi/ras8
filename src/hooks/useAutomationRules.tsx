
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { n8nService } from '@/services/n8nService';
import { Zap, Bot, Mail, Clock } from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  type: string;
  webhookUrl?: string;
  triggers?: number;
  lastRun?: string;
  conditions?: Record<string, any>;
  actions?: string[];
}

interface AutomationRuleData {
  name?: string;
  description?: string;
  icon?: string;
  active?: boolean;
  trigger?: string;
  webhookUrl?: string;
  triggers?: number;
  lastRun?: string;
  conditions?: Record<string, any>;
  actions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to format rules data
const formatRules = (rulesData: any[]): AutomationRule[] => {
  const iconMap = {
    'Zap': Zap,
    'Bot': Bot,
    'Mail': Mail,
    'Clock': Clock
  };

  return rulesData?.map(item => {
    const eventData = item.event_data as AutomationRuleData;
    
    return {
      id: item.id,
      name: eventData?.name || 'Unnamed Rule',
      description: eventData?.description || '',
      icon: iconMap[eventData?.icon as keyof typeof iconMap] || Zap,
      active: eventData?.active || false,
      type: eventData?.trigger || 'Rule-based',
      webhookUrl: eventData?.webhookUrl,
      triggers: eventData?.triggers || 0,
      lastRun: eventData?.lastRun,
      conditions: eventData?.conditions,
      actions: eventData?.actions
    };
  }) || [];
};

export const useAutomationRules = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();


  // Load automation rules from database
  const loadRules = async () => {
    try {
      const { data: rulesData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'automation_rule')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If no rules exist, create default ones
      if (!rulesData || rulesData.length === 0) {
        const defaultRules = [
          {
            name: 'Auto-approve low-risk returns',
            description: 'Automatically approve returns under $50 from verified customers',
            active: false,
            trigger: 'rule-based',
            icon: 'Zap'
          },
          {
            name: 'AI exchange suggestions',
            description: 'Generate AI-powered exchange recommendations for returns',
            active: true,
            trigger: 'ai-powered',
            icon: 'Bot'
          },
          {
            name: 'Email notifications',
            description: 'Send automated email updates to customers about return status',
            active: true,
            trigger: 'event-driven',
            icon: 'Mail'
          },
          {
            name: 'Retention campaigns',
            description: 'Trigger retention campaigns for customers who return frequently',
            active: false,
            trigger: 'scheduled',
            icon: 'Clock'
          }
        ];
        
        for (const rule of defaultRules) {
          await supabase
            .from('analytics_events')
            .insert({
              event_type: 'automation_rule',
              event_data: {
                ...rule,
                createdAt: new Date().toISOString()
              }
            });
        }

        // Reload rules after creating defaults
        const { data: newRulesData } = await supabase
          .from('analytics_events')
          .select('*')
          .eq('event_type', 'automation_rule')
          .order('created_at', { ascending: false });
        
        if (newRulesData) {
          const formattedRules = formatRules(newRulesData);
          setRules(formattedRules);
        }
        return;
      }

      const formattedRules = formatRules(rulesData);
      setRules(formattedRules);
    } catch (error) {
      console.error('Error loading automation rules:', error);
      toast({
        title: "Error",
        description: "Failed to load automation rules",
        variant: "destructive",
      });
    }
  };

  // Toggle automation rule
  const toggleRule = async (ruleId: string, active: boolean) => {
    setLoading(true);
    try {
      // Update local state immediately
      setRules(prev => 
        prev.map(rule => 
          rule.id === ruleId ? { ...rule, active } : rule
        )
      );

      // Update in database
      const { error } = await supabase
        .from('analytics_events')
        .update({
          event_data: {
            active,
            updatedAt: new Date().toISOString()
          }
        })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Rule updated",
        description: `Automation rule ${active ? 'activated' : 'deactivated'} successfully.`,
      });

      return true;
    } catch (error) {
      console.error('Error toggling rule:', error);
      // Revert local state
      await loadRules();
      toast({
        title: "Error",
        description: "Failed to update automation rule.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Test automation rule
  const testRule = async (ruleId: string) => {
    setLoading(true);
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule || !rule.webhookUrl) {
        throw new Error('Rule or webhook URL not found');
      }

      const result = await n8nService.testWebhookConnection(rule.webhookUrl);

      // Log the test
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'automation_test',
          event_data: {
            ruleId: rule.id,
            ruleName: rule.name,
            status: result.success ? 'success' : 'error',
            error: result.error,
            testedAt: new Date().toISOString()
          }
        });

      if (result.success) {
        toast({
          title: "Test successful",
          description: `Automation rule "${rule.name}" tested successfully.`,
        });
      } else {
        toast({
          title: "Test failed",
          description: `Test failed: ${result.error}`,
          variant: "destructive",
        });
      }

      return result.success;
    } catch (error) {
      console.error('Error testing rule:', error);
      toast({
        title: "Test failed",
        description: "Failed to test automation rule.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Configure rule (placeholder for future enhancement)
  const configureRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    toast({
      title: "Configuration",
      description: `Configuration for "${rule?.name}" will be available soon.`,
    });
  };

  useEffect(() => {
    setLoading(true);
    loadRules().finally(() => setLoading(false));
  }, []);

  return {
    rules,
    loading,
    toggleRule,
    testRule,
    configureRule,
    loadRules
  };
};
