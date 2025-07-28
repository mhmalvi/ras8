import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  ExternalLink, 
  Clock,
  CheckCircle,
  AlertCircle,
  Book,
  Video,
  Users
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const Support = () => {
  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Get help when you need it most
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover:shadow-md transition-all duration-200 hover:scale-105">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Live Chat</CardTitle>
              <CardDescription>Get instant help from our support team</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="default" className="mb-4">
                <Clock className="h-3 w-3 mr-1" />
                Usually responds in minutes
              </Badge>
              <Button className="w-full">
                Start Live Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200 hover:scale-105">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Email Support</CardTitle>
              <CardDescription>Send us a detailed message</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="secondary" className="mb-4">
                <Clock className="h-3 w-3 mr-1" />
                Response within 24 hours
              </Badge>
              <Button variant="outline" className="w-full">
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200 hover:scale-105">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Browse our comprehensive guides</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="secondary" className="mb-4">
                <CheckCircle className="h-3 w-3 mr-1" />
                Self-service available
              </Badge>
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Docs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5" />
              <span>Get Support</span>
            </CardTitle>
            <CardDescription>
              Describe your issue and we'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="What can we help you with?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select 
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="low">Low - General question</option>
                  <option value="medium">Medium - Feature request</option>
                  <option value="high">High - Important issue</option>
                  <option value="urgent">Urgent - System down</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message"
                placeholder="Please describe your issue in detail..."
                className="min-h-[120px]"
              />
            </div>

            <Button className="w-full md:w-auto">
              <Mail className="h-4 w-4 mr-2" />
              Send Support Request
            </Button>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold">How do I set up my Shopify integration?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Go to Settings → Integrations and follow the step-by-step guide to connect your Shopify store.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold">Why aren't my returns showing up?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Check your webhook configuration and ensure your Shopify store is properly connected.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold">How do I upgrade my plan?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Visit Settings → Billing to view available plans and upgrade options.
                </p>
              </div>
            </div>

            <Button variant="outline" className="w-full md:w-auto">
              <Book className="h-4 w-4 mr-2" />
              View All FAQ
            </Button>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>All systems operational</span>
              </div>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Status Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Support;