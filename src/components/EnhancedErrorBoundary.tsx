/**
 * Enhanced Error Boundary for H5 App
 * Provides comprehensive error handling with user-friendly fallbacks
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { performHealthCheck, formatHealthReport } from '@/utils/healthCheck';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isSubmittingReport: boolean;
  healthReport: string | null;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isSubmittingReport: false,
      healthReport: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for tracking
    const errorId = `h5-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('🚨 H5 Error Boundary caught an error:', {
      error,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Generate health report
    this.generateHealthReport();

    // Send error to monitoring service (Sentry)
    if (window.Sentry) {
      window.Sentry.withScope((scope) => {
        scope.setTag('component', 'ErrorBoundary');
        scope.setTag('errorId', this.state.errorId);
        scope.setContext('errorInfo', errorInfo);
        scope.setContext('errorBoundary', {
          errorId: this.state.errorId,
          timestamp: new Date().toISOString()
        });
        window.Sentry.captureException(error);
      });
    }
  }

  async generateHealthReport() {
    try {
      const health = await performHealthCheck();
      const report = formatHealthReport(health);
      this.setState({ healthReport: report });
    } catch (error) {
      console.error('Failed to generate health report:', error);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      healthReport: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleCopyError = async () => {
    const errorData = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      healthReport: this.state.healthReport
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorData, null, 2));
      alert('Error details copied to clipboard');
    } catch (error) {
      console.error('Failed to copy error details:', error);
    }
  };

  handleReportIssue = () => {
    const errorData = {
      title: `H5 Error: ${this.state.error?.message}`,
      body: `
**Error ID:** ${this.state.errorId}
**Timestamp:** ${new Date().toISOString()}
**URL:** ${window.location.href}

**Error Message:** ${this.state.error?.message}

**Stack Trace:**
\`\`\`
${this.state.error?.stack}
\`\`\`

**Component Stack:**
\`\`\`
${this.state.errorInfo?.componentStack}
\`\`\`

**Health Report:**
\`\`\`
${this.state.healthReport || 'Not available'}
\`\`\`
      `.trim()
    };

    const url = `https://github.com/your-org/h5/issues/new?title=${encodeURIComponent(errorData.title)}&body=${encodeURIComponent(errorData.body)}`;
    window.open(url, '_blank');
  };

  getErrorSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const error = this.state.error;
    if (!error) return 'low';

    // Critical errors that break core functionality
    if (error.message.includes('ChunkLoadError') || 
        error.message.includes('Loading chunk') ||
        error.message.includes('dynamically imported module')) {
      return 'critical';
    }

    // High severity for authentication or data errors
    if (error.message.includes('auth') || 
        error.message.includes('permission') ||
        error.message.includes('network') ||
        error.name === 'TypeError') {
      return 'high';
    }

    // Medium for component or rendering errors
    if (error.name === 'Error' && this.state.errorInfo?.componentStack) {
      return 'medium';
    }

    return 'low';
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.state.errorInfo!);
      }

      const severity = this.getErrorSeverity();
      const isDevelopment = import.meta.env.VITE_DEV_MODE === 'true';

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-6">
            {/* Main Error Card */}
            <Card className="border-destructive/20">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-destructive/10 rounded-full">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CardTitle className="text-xl">Something went wrong</CardTitle>
                  <Badge className={this.getSeverityColor(severity)}>
                    {severity.toUpperCase()}
                  </Badge>
                </div>
                
                <CardDescription>
                  We've encountered an unexpected error. Our team has been automatically notified.
                </CardDescription>
                
                {this.state.errorId && (
                  <div className="text-xs text-muted-foreground font-mono mt-2">
                    Error ID: {this.state.errorId}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Error Message */}
                {this.state.error && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium text-destructive mb-1">
                      Error Message:
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {this.state.error.message}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button onClick={this.handleRetry} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  
                  <Button onClick={this.handleReload} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reload Page
                  </Button>
                  
                  <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                    <Home className="h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </div>

                {/* Developer/Debug Actions */}
                {(isDevelopment || this.props.showErrorDetails) && (
                  <div className="border-t pt-4 space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Debug Actions:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={this.handleCopyError} 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copy Error Details
                      </Button>
                      
                      <Button 
                        onClick={this.handleReportIssue} 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Report Issue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Stack Trace (Development Only) */}
                {isDevelopment && this.state.error?.stack && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Show Stack Trace
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}

                {/* Health Report (Development Only) */}
                {isDevelopment && this.state.healthReport && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Show Health Report
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                      {this.state.healthReport}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>

            {/* Support Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium">Need immediate help?</div>
                  <div className="text-sm text-muted-foreground">
                    Contact our support team with the Error ID above for faster assistance.
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Bug className="h-3 w-3" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export as default component
export default EnhancedErrorBoundary;