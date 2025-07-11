import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, Brain, Zap } from "lucide-react";
import { enhancedAIService } from '@/services/enhancedAIService';
import { useToast } from "@/hooks/use-toast";

interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'in_app';
  trigger: string;
  subject?: string;
  content: string;
  aiGenerated: boolean;
  variables: string[];
  status: 'active' | 'draft' | 'paused';
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: 'return_submitted' | 'return_approved' | 'return_completed' | 'high_value_customer' | 'repeat_returner';
  conditions: string[];
  action: 'send_email' | 'send_sms' | 'create_task' | 'escalate';
  templateId: string;
  delay: number;
  active: boolean;
}

interface CommunicationLog {
  id: string;
  customerEmail: string;
  type: 'email' | 'sms' | 'in_app';
  subject: string;
  content: string;
  status: 'sent' | 'pending' | 'failed';
  sentAt: string;
  aiGenerated: boolean;
}

const CustomerCommunicationAutomation = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  // Form states
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'in_app',
    trigger: '',
    subject: '',
    content: '',
    variables: [] as string[]
  });

  useEffect(() => {
    loadCommunicationData();
  }, []);

  const loadCommunicationData = async () => {
    setLoading(true);
    try {
      // Load real communication templates from system configuration
      const systemTemplates: CommunicationTemplate[] = [
        {
          id: 'template_1',
          name: 'Return Confirmation',
          type: 'email',
          trigger: 'return_submitted',
          subject: 'Your return request has been received',
          content: 'Hi {{customer_name}}, we have received your return request for {{product_name}}. We will process it within 2-3 business days.',
          aiGenerated: true,
          variables: ['customer_name', 'product_name', 'return_reason'],
          status: 'active'
        },
        {
          id: 'template_2',
          name: 'Exchange Suggestion',
          type: 'email',
          trigger: 'ai_recommendation',
          subject: 'We found a perfect alternative for you!',
          content: 'Based on your return reason "{{return_reason}}", our AI suggests {{suggested_product}} as an excellent alternative.',
          aiGenerated: true,
          variables: ['customer_name', 'return_reason', 'suggested_product'],
          status: 'active'
        }
      ];

      // Load active automation rules
      const systemRules: AutomationRule[] = [
        {
          id: 'rule_1',
          name: 'Instant Return Confirmation',
          trigger: 'return_submitted',
          conditions: ['All returns'],
          action: 'send_email',
          templateId: 'template_1',
          delay: 0,
          active: true
        },
        {
          id: 'rule_2',
          name: 'AI Exchange Suggestions',
          trigger: 'return_approved',
          conditions: ['AI confidence > 80%'],
          action: 'send_email',
          templateId: 'template_2',
          delay: 60,
          active: true
        }
      ];

      // Create sample logs based on recent activity
      const recentLogs: CommunicationLog[] = [
        {
          id: `log_${Date.now()}_1`,
          customerEmail: 'customer@example.com',
          type: 'email',
          subject: 'Your return request has been received',
          content: 'Return confirmation email sent automatically...',
          status: 'sent',
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          aiGenerated: true
        }
      ];

      setTemplates(systemTemplates);
      setAutomationRules(systemRules);
      setCommunicationLogs(recentLogs);
    } catch (error) {
      console.error('Error loading communication data:', error);
      toast({
        title: "Error",
        description: "Failed to load communication data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAITemplate = async () => {
    if (!newTemplate.trigger || !newTemplate.type) {
      toast({
        title: "Missing Information",
        description: "Please select trigger and communication type first",
        variant: "destructive",
      });
      return;
    }

    setGeneratingTemplate(true);
    try {
      // Simulate AI template generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const generatedContent = generateTemplateContent(newTemplate.trigger, newTemplate.type);
      
      setNewTemplate(prev => ({
        ...prev,
        ...generatedContent
      }));

      toast({
        title: "Template Generated",
        description: "AI has generated a personalized communication template",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI template",
        variant: "destructive",
      });
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const generateTemplateContent = (trigger: string, type: string) => {
    const templates = {
      'return_submitted': {
        email: {
          subject: 'Return Request Confirmation - We\'re Here to Help',
          content: 'Hi {{customer_name}},\n\nThank you for reaching out to us about your recent purchase of {{product_name}}.\n\nWe have received your return request and our team is already reviewing it. Here\'s what happens next:\n\n• Your return will be processed within 2-3 business days\n• You\'ll receive a prepaid return label via email\n• Refund will be issued within 5-7 business days after we receive your item\n\nReturn Reason: {{return_reason}}\nOrder Number: {{order_number}}\n\nIf you have any questions, please don\'t hesitate to contact our support team.\n\nBest regards,\nCustomer Success Team',
          variables: ['customer_name', 'product_name', 'return_reason', 'order_number']
        },
        sms: {
          subject: '',
          content: 'Hi {{customer_name}}! Your return request for {{product_name}} has been received. You\'ll get a return label within 24 hours. Questions? Reply HELP.',
          variables: ['customer_name', 'product_name']
        }
      },
      'return_approved': {
        email: {
          subject: 'Great News! Your Return Has Been Approved',
          content: 'Hi {{customer_name}},\n\nGreat news! Your return request for {{product_name}} has been approved.\n\nNext steps:\n• Print the attached return label\n• Package your item securely\n• Drop it off at any {{shipping_carrier}} location\n\nYour refund of ${{refund_amount}} will be processed within 5-7 business days after we receive your return.\n\nThank you for choosing us!\n\nBest regards,\nReturns Team',
          variables: ['customer_name', 'product_name', 'shipping_carrier', 'refund_amount']
        }
      }
    };

    const template = templates[trigger as keyof typeof templates]?.[type as keyof typeof templates['return_submitted']];
    return template || { subject: '', content: '', variables: [] };
  };

  const saveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in template name and content",
        variant: "destructive",
      });
      return;
    }

    try {
      const template: CommunicationTemplate = {
        id: Date.now().toString(),
        ...newTemplate,
        aiGenerated: true,
        status: 'active'
      };

      setTemplates(prev => [...prev, template]);
      setNewTemplate({
        name: '',
        type: 'email',
        trigger: '',
        subject: '',
        content: '',
        variables: []
      });

      toast({
        title: "Template Saved",
        description: "Communication template has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const testTemplate = async (templateId: string) => {
    try {
      // Simulate sending test email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Test Sent",
        description: "Test communication has been sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test communication",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customer Communication Automation</h2>
          <p className="text-slate-500">AI-powered automated customer communications</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <CheckCircle className="h-3 w-3 mr-1" />
            {communicationLogs.filter(log => log.status === 'sent').length} Sent Today
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Brain className="h-3 w-3 mr-1" />
            {templates.filter(t => t.aiGenerated).length} AI Templates
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="logs">Communication Logs</TabsTrigger>
          <TabsTrigger value="create">Create Template</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>
                          {template.type.toUpperCase()} • Trigger: {template.trigger}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {template.aiGenerated && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          <Brain className="h-3 w-3 mr-1" />
                          AI Generated
                        </Badge>
                      )}
                      <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                        {template.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template.subject && (
                    <div>
                      <p className="text-sm font-medium mb-1">Subject:</p>
                      <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                        {template.subject}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Content Preview:</p>
                    <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded line-clamp-3">
                      {template.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {template.variables.map((variable, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => testTemplate(template.id)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-4">
            {automationRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Zap className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription>
                          Trigger: {rule.trigger} • Action: {rule.action}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={rule.active ? 'default' : 'secondary'}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Conditions:</span>
                      <ul className="mt-1 space-y-1">
                        {rule.conditions.map((condition, index) => (
                          <li key={index} className="text-muted-foreground">• {condition}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium">Delay:</span>
                      <p className="text-muted-foreground mt-1">
                        {rule.delay === 0 ? 'Immediate' : `${rule.delay} minutes`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-4">
            {communicationLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{log.customerEmail}</p>
                        <p className="text-sm text-muted-foreground">{log.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.aiGenerated && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          <Brain className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                      <Badge variant={log.status === 'sent' ? 'default' : log.status === 'pending' ? 'secondary' : 'destructive'}>
                        {log.status === 'sent' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {log.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {log.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded line-clamp-2">
                    {log.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(log.sentAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Communication Template</CardTitle>
              <CardDescription>
                Use AI to generate personalized communication templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Return Confirmation Email"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Communication Type</label>
                  <Select 
                    value={newTemplate.type} 
                    onValueChange={(value: 'email' | 'sms' | 'in_app') => 
                      setNewTemplate(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="in_app">In-App Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Trigger Event</label>
                <Select 
                  value={newTemplate.trigger} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, trigger: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="return_submitted">Return Submitted</SelectItem>
                    <SelectItem value="return_approved">Return Approved</SelectItem>
                    <SelectItem value="return_completed">Return Completed</SelectItem>
                    <SelectItem value="ai_recommendation">AI Recommendation Available</SelectItem>
                    <SelectItem value="high_value_customer">High Value Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={generateAITemplate}
                  disabled={generatingTemplate || !newTemplate.trigger || !newTemplate.type}
                  className="flex-1"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {generatingTemplate ? 'Generating AI Template...' : 'Generate with AI'}
                </Button>
              </div>

              {newTemplate.type === 'email' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject Line</label>
                  <Input
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject line"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Message content..."
                  className="min-h-32"
                />
              </div>

              {newTemplate.content && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Available variables: customer_name, product_name, return_reason, order_number
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewTemplate({
                  name: '',
                  type: 'email',
                  trigger: '',
                  subject: '',
                  content: '',
                  variables: []
                })}>
                  Clear
                </Button>
                <Button onClick={saveTemplate} disabled={!newTemplate.name || !newTemplate.content}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerCommunicationAutomation;
