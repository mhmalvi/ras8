
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, BarChart3, Sparkles } from "lucide-react";
import { Link } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('🏠 Index page loaded, checking auth state');
  }, []);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    console.log('✅ User authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4">
        <div className="text-2xl font-bold text-primary">Returns Automation</div>
        <div className="space-x-4">
          <Link to="/return-portal">
            <Button variant="ghost">Return Portal</Button>
          </Link>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Automate Your Returns Process with
            <span className="text-primary block">AI-Powered Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Transform your e-commerce returns management with smart automation, 
            AI recommendations, and seamless customer experiences.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/return-portal">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Try Return Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Returns Automation?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <Sparkles className="h-8 w-8 text-primary mr-3" />
              <h3 className="text-xl font-semibold">AI-Powered Suggestions</h3>
            </div>
            <p className="text-gray-600">
              Smart exchange recommendations that increase conversion rates and reduce refunds.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <Zap className="h-8 w-8 text-primary mr-3" />
              <h3 className="text-xl font-semibold">Workflow Automation</h3>
            </div>
            <p className="text-gray-600">
              Streamline your returns process with n8n integration and custom automation rules.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-8 w-8 text-primary mr-3" />
              <h3 className="text-xl font-semibold">Advanced Analytics</h3>
            </div>
            <p className="text-gray-600">
              Deep insights into return patterns, revenue impact, and customer behavior.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Returns?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of merchants who have automated their returns process
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 Returns Automation SaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
