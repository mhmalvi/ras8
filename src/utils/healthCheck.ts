/**
 * Health Check Utilities for H5 App
 * Provides system health monitoring and diagnostics
 */

import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: any;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthCheckResult[];
  version: string;
}

/**
 * Checks Supabase database connectivity
 */
async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Simple connectivity test
    const { data, error } = await supabase
      .from('merchants')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      throw error;
    }
    
    return {
      service: 'supabase',
      status: 'healthy',
      responseTime,
      details: {
        connectionTest: 'passed',
        queryExecuted: true
      }
    };
  } catch (error) {
    return {
      service: 'supabase',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { connectionTest: 'failed' }
    };
  }
}

/**
 * Checks Shopify App Bridge initialization
 */
async function checkAppBridgeHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Check if we're in embedded context
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    const host = urlParams.get('host');
    
    // Check if App Bridge can be imported
    const { default: createApp } = await import('@shopify/app-bridge');
    
    const responseTime = Date.now() - startTime;
    
    const isEmbedded = !!(shop || host);
    const canInitialize = !!createApp;
    
    const status = canInitialize ? 'healthy' : 'degraded';
    
    return {
      service: 'app-bridge',
      status,
      responseTime,
      details: {
        isEmbedded,
        hasShopParam: !!shop,
        hasHostParam: !!host,
        canImport: canInitialize
      }
    };
  } catch (error) {
    return {
      service: 'app-bridge',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Checks local storage and session storage
 */
async function checkStorageHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test localStorage
    const testKey = 'health-check-test';
    const testValue = Date.now().toString();
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      throw new Error('localStorage read/write test failed');
    }
    
    // Test sessionStorage
    sessionStorage.setItem(testKey, testValue);
    const sessionRetrieved = sessionStorage.getItem(testKey);
    sessionStorage.removeItem(testKey);
    
    if (sessionRetrieved !== testValue) {
      throw new Error('sessionStorage read/write test failed');
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'storage',
      status: 'healthy',
      responseTime,
      details: {
        localStorage: 'working',
        sessionStorage: 'working'
      }
    };
  } catch (error) {
    return {
      service: 'storage',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Checks environment configuration
 */
async function checkEnvironmentHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const requiredVars = [
      'VITE_SHOPIFY_CLIENT_ID',
      'VITE_APP_URL'
    ];
    
    const missing = requiredVars.filter(varName => !import.meta.env[varName]);
    
    const responseTime = Date.now() - startTime;
    
    if (missing.length > 0) {
      return {
        service: 'environment',
        status: 'unhealthy',
        responseTime,
        error: `Missing required environment variables: ${missing.join(', ')}`
      };
    }
    
    return {
      service: 'environment',
      status: 'healthy',
      responseTime,
      details: {
        requiredVarsPresent: requiredVars.length,
        appUrl: import.meta.env.VITE_APP_URL,
        clientIdConfigured: !!import.meta.env.VITE_SHOPIFY_CLIENT_ID
      }
    };
  } catch (error) {
    return {
      service: 'environment',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Runs all health checks and returns overall system health
 */
export async function performHealthCheck(): Promise<SystemHealth> {
  const startTime = Date.now();
  
  console.log('🏥 Starting system health check...');
  
  // Run all health checks in parallel
  const checks = await Promise.all([
    checkSupabaseHealth(),
    checkAppBridgeHealth(),
    checkStorageHealth(),
    checkEnvironmentHealth()
  ]);
  
  // Determine overall health
  const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
  const hasDegraded = checks.some(check => check.status === 'degraded');
  
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (hasUnhealthy) {
    overall = 'unhealthy';
  } else if (hasDegraded) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }
  
  const totalTime = Date.now() - startTime;
  const result: SystemHealth = {
    overall,
    timestamp: new Date().toISOString(),
    checks,
    version: '1.0.0' // Update this with actual app version
  };
  
  console.log(`🏥 Health check completed in ${totalTime}ms - Status: ${overall}`);
  
  return result;
}

/**
 * Creates a formatted health report for debugging
 */
export function formatHealthReport(health: SystemHealth): string {
  const lines = [
    '🏥 H5 System Health Report',
    '=' .repeat(50),
    `Overall Status: ${health.overall.toUpperCase()}`,
    `Timestamp: ${health.timestamp}`,
    `Version: ${health.version}`,
    '',
    'Service Details:',
    '-' .repeat(30)
  ];
  
  health.checks.forEach(check => {
    const status = check.status === 'healthy' ? '✅' : 
                  check.status === 'degraded' ? '⚠️' : '❌';
    
    lines.push(`${status} ${check.service}: ${check.status.toUpperCase()}`);
    
    if (check.responseTime) {
      lines.push(`   Response Time: ${check.responseTime}ms`);
    }
    
    if (check.error) {
      lines.push(`   Error: ${check.error}`);
    }
    
    if (check.details) {
      lines.push(`   Details: ${JSON.stringify(check.details, null, 2)}`);
    }
    
    lines.push('');
  });
  
  return lines.join('\n');
}

/**
 * Monitors health continuously and logs issues
 */
export function startHealthMonitoring(intervalMs: number = 300000): () => void {
  console.log(`🏥 Starting health monitoring (interval: ${intervalMs}ms)`);
  
  const interval = setInterval(async () => {
    try {
      const health = await performHealthCheck();
      
      if (health.overall !== 'healthy') {
        console.warn('⚠️ System health check detected issues:');
        console.warn(formatHealthReport(health));
      }
    } catch (error) {
      console.error('❌ Health monitoring error:', error);
    }
  }, intervalMs);
  
  // Return cleanup function
  return () => {
    console.log('🏥 Stopping health monitoring');
    clearInterval(interval);
  };
}