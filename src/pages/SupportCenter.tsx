import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { MessageSquare, Mail, Phone, Send, ExternalLink, HelpCircle, FileText, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SupportCenter = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    subject: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission - in real app, this would call a support ticket API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Support ticket submitted",
        description: "We'll get back to you within 24 hours via email.",
      });
      
      setFormData({ subject: '', email: '', message: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const faqItems = [
    {
      question: "How do I set up Shopify integration?",
      answer: "Navigate to Settings > Integrations and follow the OAuth flow to connect your Shopify store.",
      category: "Integration"
    },
    {
      question: "How does AI return processing work?",
      answer: "Our AI analyzes return requests and suggests optimal outcomes like exchanges or refunds based on product data and customer history.",
      category: "AI Features"
    },
    {
      question: "Can I customize return reasons?",
      answer: "Yes, you can add custom return reasons in Settings > Return Management to match your business needs.",
      category: "Customization"
    },
    {
      question: "How do I upgrade my subscription plan?",
      answer: "Go to Billing in your dashboard and click 'Upgrade Plan' to see available options and pricing.",
      category: "Billing"
    }
  ];

  const supportChannels = [
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Email Support",
      description: "Get help via email within 24 hours",
      action: "support@returnautomation.com",
      available: "24/7"
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Live Chat",
      description: "Chat with our support team",
      action: "Start Chat",
      available: "Mon-Fri 9AM-6PM EST"
    },
    {
      icon: <Phone className="h-5 w-5" />,
      title: "Phone Support",
      description: "Speak directly with our team",
      action: "+1 (555) 123-4567",
      available: "Mon-Fri 9AM-6PM EST"
    }
  ];

  const resources = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Documentation",
      description: "Comprehensive guides and API docs",
      link: "#"
    },
    {
      icon: <Video className="h-5 w-5" />,
      title: "Video Tutorials",
      description: "Step-by-step video walkthroughs",
      link: "#"
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      title: "Community Forum",
      description: "Connect with other merchants",
      link: "#"
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Support Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get help and support for your return automation platform
          </p>
        </div>

        {/* Support Channels */}
        <div className="grid gap-4 md:grid-cols-3">
          {supportChannels.map((channel, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    {channel.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{channel.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{channel.description}</p>
                    <p className="text-sm font-medium text-blue-600">{channel.action}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {channel.available}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Submit Support Ticket</span>
              </CardTitle>
              <CardDescription>
                Describe your issue and we'll get back to you promptly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="your.email@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Provide detailed information about your issue..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Help Resources</CardTitle>
              <CardDescription>
                Find answers and learn more about the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded">
                      {resource.icon}
                    </div>
                    <div>
                      <p className="font-medium">{resource.title}</p>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{item.question}</h4>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SupportCenter;