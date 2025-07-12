
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Bot, RefreshCw, Shield, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">Returns Automation</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/return-portal">
              <Button variant="ghost">Return Portal</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Automate Your Returns with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your e-commerce returns process with intelligent automation. 
            Reduce manual work, increase exchanges, and boost customer satisfaction.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/return-portal">
              <Button size="lg" variant="outline" className="px-8">
                Try Return Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need to Automate Returns
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to streamline your returns process and improve your bottom line.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Bot className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>AI-Powered Suggestions</CardTitle>
              <CardDescription>
                Smart exchange recommendations to turn returns into sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Our AI analyzes customer preferences and inventory to suggest the perfect exchange options, increasing revenue retention.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Automated Workflows</CardTitle>
              <CardDescription>
                Streamline approvals and processing with n8n integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Set up custom automation rules to handle routine returns automatically, freeing up your team for strategic work.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Gain insights into return patterns and customer behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Track return rates, identify trends, and make data-driven decisions to reduce future returns.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Fraud Detection</CardTitle>
              <CardDescription>
                Protect your business from return abuse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                AI-powered fraud detection identifies suspicious return patterns and protects your revenue.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <RefreshCw className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Shopify Integration</CardTitle>
              <CardDescription>
                Seamless integration with your existing store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Connect directly to your Shopify store for automatic order syncing and real-time updates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bot className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Customer Portal</CardTitle>
              <CardDescription>
                Self-service returns portal for customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Branded return portal that provides a smooth experience for your customers while reducing support tickets.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Returns Process?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of merchants who have automated their returns and increased customer satisfaction.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">Returns Automation</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/return-portal" className="text-gray-600 hover:text-gray-900">
                Return Portal
              </Link>
              <Link to="/auth" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
