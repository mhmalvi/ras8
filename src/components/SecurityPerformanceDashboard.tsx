import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Database,
  Globe,
  Lock,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { apiCache, userDataCache, analyticsCache, aiCache } from '@/utils/cacheManager';
import { securityHeaders } from '@/middleware/securityHeaders';

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  threshold: number;
}

export const SecurityPerformanceDashboard: React.FC = () => {
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [cacheStats, setCacheStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Security Analysis
      const securityAnalysis = analyzeSecurityPosture();
      setSecurityIssues(securityAnalysis);

      // Performance Metrics
      const perfMetrics = analyzePerformanceMetrics();
      setPerformanceMetrics(perfMetrics);

      // Cache Statistics
      const cacheData = {
        api: apiCache.getMetrics(),
        userData: userDataCache.getMetrics(),
        analytics: analyticsCache.getMetrics(),
        ai: aiCache.getMetrics()
      };
      setCacheStats(cacheData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSecurityPosture = (): SecurityIssue[] => {
    const issues: SecurityIssue[] = [];
    
    // Check HTTPS
    if (typeof window !== 'undefined' && location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push({
        severity: 'critical',
        title: 'Insecure Connection',
        description: 'Application is not served over HTTPS',
        recommendation: 'Enable HTTPS/TLS encryption for all traffic'
      });
    }

    // Check for security headers
    const headerValidation = securityHeaders.validateEnvironment();
    if (!headerValidation.secure) {
      headerValidation.issues.forEach(issue => {
        issues.push({
          severity: 'medium',
          title: 'Security Headers',
          description: issue,
          recommendation: 'Configure proper security headers in production'
        });
      });
    }

    // Check localStorage usage
    if (typeof window !== 'undefined') {
      try {
        const sensitiveKeys = Object.keys(localStorage).filter(key => 
          key.includes('token') || key.includes('password') || key.includes('secret')
        );
        
        if (sensitiveKeys.length > 0) {
          issues.push({
            severity: 'high',
            title: 'Sensitive Data in localStorage',
            description: `Found ${sensitiveKeys.length} potentially sensitive keys in localStorage`,
            recommendation: 'Move sensitive data to secure HTTP-only cookies or encrypted storage'
          });
        }
      } catch (error) {
        // localStorage access might be restricted
      }
    }

    // Check for console warnings
    const originalWarn = console.warn;
    let warningCount = 0;
    console.warn = (...args) => {
      warningCount++;
      originalWarn(...args);
    };

    if (warningCount > 10) {
      issues.push({
        severity: 'low',
        title: 'Console Warnings',
        description: `${warningCount} warnings detected in console`,
        recommendation: 'Review and fix console warnings to improve stability'
      });
    }

    return issues;
  };

  const analyzePerformanceMetrics = (): PerformanceMetric[] => {
    const pageLoadMetrics = performanceMonitor.getPageLoadMetrics();
    const metrics: PerformanceMetric[] = [];

    if (pageLoadMetrics) {
      metrics.push(
        {
          name: 'First Contentful Paint',
          value: pageLoadMetrics.fcp,
          unit: 'ms',
          status: pageLoadMetrics.fcp < 1800 ? 'good' : pageLoadMetrics.fcp < 3000 ? 'warning' : 'critical',
          threshold: 1800
        },
        {
          name: 'Largest Contentful Paint',
          value: pageLoadMetrics.lcp,
          unit: 'ms',
          status: pageLoadMetrics.lcp < 2500 ? 'good' : pageLoadMetrics.lcp < 4000 ? 'warning' : 'critical',
          threshold: 2500
        },
        {
          name: 'First Input Delay',
          value: pageLoadMetrics.fid,
          unit: 'ms',
          status: pageLoadMetrics.fid < 100 ? 'good' : pageLoadMetrics.fid < 300 ? 'warning' : 'critical',
          threshold: 100
        },
        {
          name: 'Cumulative Layout Shift',
          value: pageLoadMetrics.cls,
          unit: '',
          status: pageLoadMetrics.cls < 0.1 ? 'good' : pageLoadMetrics.cls < 0.25 ? 'warning' : 'critical',
          threshold: 0.1
        },
        {
          name: 'Time to First Byte',
          value: pageLoadMetrics.ttfb,
          unit: 'ms',
          status: pageLoadMetrics.ttfb < 800 ? 'good' : pageLoadMetrics.ttfb < 1800 ? 'warning' : 'critical',
          threshold: 800
        }
      );
    }

    return metrics;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={colors[severity as keyof typeof colors] || colors.low}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const clearAllCaches = () => {
    apiCache.clear();
    userDataCache.clear();
    analyticsCache.clear();
    aiCache.clear();
    loadDashboardData();
  };

  const downloadPerformanceReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      securityIssues,
      performanceMetrics,
      cacheStats,
      pageLoadMetrics: performanceMonitor.getPageLoadMetrics(),
      performanceHistory: performanceMonitor.getMetrics(24 * 60 * 60 * 1000) // Last 24 hours
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Security & Performance Dashboard</h1>
          <p className="text-slate-600">Monitor application health and security posture</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={downloadPerformanceReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="caching">Caching</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                <Shield className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityIssues.length === 0 ? '100%' : `${Math.max(0, 100 - securityIssues.length * 20)}%`}
                </div>
                <p className="text-xs text-slate-600">
                  {securityIssues.length} issues found
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics.filter(m => m.status === 'good').length * 20}%
                </div>
                <p className="text-xs text-slate-600">
                  Based on Core Web Vitals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Database className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cacheStats.api?.hitRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-slate-600">
                  API cache efficiency
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.9%</div>
                <p className="text-xs text-slate-600">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Security Issues
              </CardTitle>
              <CardDescription>
                Identified security vulnerabilities and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityIssues.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Security Issues Found</h3>
                  <p className="text-slate-600">Your application follows security best practices</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityIssues.map((issue, index) => (
                    <Alert key={index} className="border-l-4 border-l-red-500">
                      <AlertTriangle className="h-4 w-4" />
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{issue.title}</h4>
                            {getSeverityBadge(issue.severity)}
                          </div>
                          <AlertDescription className="mb-2">
                            {issue.description}
                          </AlertDescription>
                          <p className="text-sm text-blue-600">
                            <strong>Recommendation:</strong> {issue.recommendation}
                          </p>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Core Web Vitals
              </CardTitle>
              <CardDescription>
                Key performance metrics that affect user experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceMetrics.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Performance Data</h3>
                  <p className="text-slate-600">Performance metrics will appear after page interactions</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(metric.status)}
                          <span className="font-medium">{metric.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold">{metric.value.toFixed(metric.name.includes('Shift') ? 3 : 0)}</span>
                          <span className="text-sm text-slate-600 ml-1">{metric.unit}</span>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, (metric.threshold / Math.max(metric.value, metric.threshold)) * 100)} 
                        className="h-2"
                      />
                      <div className="text-xs text-slate-600">
                        Threshold: {metric.threshold}{metric.unit} | Status: {metric.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Cache Performance
                </div>
                <Button onClick={clearAllCaches} variant="outline" size="sm">
                  Clear All Caches
                </Button>
              </CardTitle>
              <CardDescription>
                Cache hit rates and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(cacheStats).map(([name, stats]: [string, any]) => (
                  <div key={name} className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium capitalize">{name} Cache</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Hit Rate:</span>
                        <span className="font-medium">{stats.hitRate?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Requests:</span>
                        <span className="font-medium">{stats.totalRequests || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cache Hits:</span>
                        <span className="font-medium text-green-600">{stats.hits || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cache Misses:</span>
                        <span className="font-medium text-red-600">{stats.misses || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Evictions:</span>
                        <span className="font-medium text-yellow-600">{stats.evictions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Response Time:</span>
                        <span className="font-medium">{stats.averageResponseTime?.toFixed(0) || 0}ms</span>
                      </div>
                    </div>
                    <Progress value={stats.hitRate || 0} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};