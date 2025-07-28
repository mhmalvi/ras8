import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { MessageSquare, Mail, Phone, Send, ExternalLink, HelpCircle, FileText, Video, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Support Center
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Get help and support for your return automation platform
            </p>
            <Separator className="mt-4" />
          </div>

          {/* Support Channels */}
          <section className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Contact Support</h2>
              <p className="text-muted-foreground">Choose your preferred way to get in touch with our team</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {supportChannels.map((channel, index) => (
                <Card 
                  key={index} 
                  className={cn(
                    "transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer group",
                    "border-border hover:border-primary/50"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <div className="text-primary">
                          {channel.icon}
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {channel.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                        <p className="text-sm font-medium text-primary">{channel.action}</p>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">
                            {channel.available}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Support Form & Resources */}
          <section className="animate-fade-in">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Contact Form */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Send className="h-5 w-5 text-primary" />
                    </div>
                    <span>Submit Support Ticket</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Describe your issue and we'll get back to you promptly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Subject *</label>
                      <Input
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        placeholder="Brief description of your issue"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email *</label>
                      <Input
                        type="email"
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        placeholder="your.email@company.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Message *</label>
                      <Textarea
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
                        placeholder="Provide detailed information about your issue..."
                        rows={4}
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full transition-all duration-200 hover:shadow-lg"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Send className="h-4 w-4" />
                          <span>Submit Ticket</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Resources */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <HelpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <span>Help Resources</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Find answers and learn more about the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resources.map((resource, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-xl",
                        "hover:bg-muted/50 hover:border-primary/30 cursor-pointer transition-all duration-200",
                        "group hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <div className="text-primary">
                            {resource.icon}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {resource.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* FAQ */}
          <section className="animate-fade-in">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <span>Frequently Asked Questions</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faqItems.map((item, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "border-b last:border-b-0 pb-6 last:pb-0",
                        "hover:bg-muted/30 p-4 rounded-lg transition-colors duration-200 -mx-4"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-foreground text-base leading-relaxed pr-4">
                          {item.question}
                        </h4>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Success Message Section */}
          <section className="animate-fade-in">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Still need help?</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Our support team typically responds within 2-4 hours during business hours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default SupportCenter;