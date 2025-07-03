
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Phone, Mail, HelpCircle, Send, Clock, CheckCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from './LoadingStates';
import GlobalErrorBoundary from './GlobalErrorBoundary';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  responses: Array<{
    id: string;
    message: string;
    from: 'customer' | 'support';
    timestamp: string;
  }>;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
}

const CustomerSupport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
    priority: 'medium'
  });

  // Mock data for demonstration
  const mockTickets: SupportTicket[] = [
    {
      id: 'TICK-001',
      subject: 'Unable to process return',
      message: 'I am having trouble processing my return for order #12345',
      category: 'returns',
      status: 'in_progress',
      priority: 'medium',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString(),
      responses: [
        {
          id: '1',
          message: 'Thank you for contacting us. We are looking into your return request.',
          from: 'support',
          timestamp: new Date(Date.now() - 43200000).toISOString()
        }
      ]
    }
  ];

  const mockFAQs: FAQ[] = [
    {
      id: '1',
      question: 'How long does it take to process a return?',
      answer: 'Returns are typically processed within 2-3 business days after we receive your item. You will receive email updates throughout the process.',
      category: 'returns',
      helpful_count: 45
    },
    {
      id: '2',
      question: 'Can I exchange an item instead of getting a refund?',
      answer: 'Yes! During the return process, you can select the exchange option and choose a different size, color, or similar product. Our AI will suggest the best alternatives.',
      category: 'exchanges',
      helpful_count: 32
    },
    {
      id: '3',
      question: 'What is your return policy?',
      answer: 'We accept returns within 30 days of purchase. Items must be in original condition with tags attached. Some restrictions apply to certain categories.',
      category: 'policy',
      helpful_count: 78
    },
    {
      id: '4',
      question: 'How do I track my return?',
      answer: 'You can track your return using your order number and email address on our return tracking page. You will also receive email updates.',
      category: 'tracking',
      helpful_count: 23
    }
  ];

  const categories = [
    { value: 'returns', label: 'Returns & Refunds' },
    { value: 'exchanges', label: 'Exchanges' },
    { value: 'tracking', label: 'Order Tracking' },
    { value: 'account', label: 'Account Issues' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'other', label: 'Other' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Support Request Submitted",
        description: "We've received your message and will respond within 24 hours.",
      });

      // Reset form
      setContactForm({
        name: '',
        email: '',
        category: '',
        subject: '',
        message: '',
        priority: 'medium'
      });

    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Unable to submit your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markFAQHelpful = (faqId: string) => {
    toast({
      title: "Thank you!",
      description: "Your feedback helps us improve our support.",
    });
  };

  return (
    <GlobalErrorBoundary level="component">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Customer Support</h1>
          <p className="text-muted-foreground">Get help with your returns, orders, and account</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Contact Us
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              My Tickets
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="contact-info" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Describe your issue and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name *</label>
                      <Input
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select 
                        value={contactForm.category} 
                        onValueChange={(value) => setContactForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select 
                        value={contactForm.priority} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => 
                          setContactForm(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject *</label>
                    <Input
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message *</label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Please provide detailed information about your issue..."
                      className="min-h-32"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      <LoadingSpinner size="sm" text="Sending..." />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            {mockTickets.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium text-muted-foreground mb-2">No Support Tickets</h3>
                  <p className="text-sm text-muted-foreground">
                    You haven't submitted any support requests yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              mockTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                        <CardDescription>
                          Ticket #{ticket.id} • Created {new Date(ticket.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-sm">{ticket.message}</p>
                    </div>
                    
                    {ticket.responses.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Responses</h4>
                        {ticket.responses.map((response) => (
                          <div key={response.id} className="flex items-start space-x-3">
                            <div className="p-1 bg-blue-100 rounded-full">
                              {response.from === 'support' ? (
                                <HelpCircle className="h-4 w-4 text-blue-600" />
                              ) : (
                                <User className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 bg-white p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {response.from === 'support' ? 'Support Team' : 'You'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(response.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{response.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <div className="grid gap-4">
              {mockFAQs.map((faq) => (
                <Card key={faq.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{faq.answer}</p>
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => markFAQHelpful(faq.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Helpful ({faq.helpful_count})
                      </Button>
                      <Badge variant="outline">{faq.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contact-info" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">
                    For general inquiries and support requests
                  </p>
                  <div className="space-y-2">
                    <p><strong>General Support:</strong> support@company.com</p>
                    <p><strong>Returns:</strong> returns@company.com</p>
                    <p><strong>Response Time:</strong> Within 24 hours</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Phone Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">
                    Speak directly with our support team
                  </p>
                  <div className="space-y-2">
                    <p><strong>Phone:</strong> 1-800-SUPPORT</p>
                    <p><strong>Hours:</strong> Mon-Fri 9AM-6PM EST</p>
                    <p><strong>Wait Time:</strong> Usually under 5 minutes</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Business Hours</h4>
                    <div className="space-y-1 text-sm">
                      <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                      <p>Saturday: 10:00 AM - 4:00 PM EST</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Emergency Support</h4>
                    <div className="space-y-1 text-sm">
                      <p>For urgent issues affecting active returns</p>
                      <p>Available 24/7 via email</p>
                      <p>Response within 4 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </GlobalErrorBoundary>
  );
};

export default CustomerSupport;
