import React from 'react';

/**
 * Mock Data Cleanup Utility
 * 
 * This utility helps identify and remove mock data patterns from the codebase.
 * It provides functions to detect and replace common mock data patterns.
 */

export interface MockDataInstance {
  file: string;
  line: number;
  type: 'setTimeout' | 'mockArray' | 'staticMetric' | 'hardcodedValue';
  description: string;
  suggestion: string;
}

// Patterns to detect mock data
export const MOCK_PATTERNS = {
  setTimeout: /setTimeout\([^,]+,\s*\d+\)/g,
  mockArrays: /const\s+\w+\s*=\s*\[[\s\S]*?{[\s\S]*?id:\s*['"`]mock-/g,
  staticMetrics: /const\s+\w+\s*=\s*\d+;\s*\/\/.*mock/gi,
  hardcodedData: /\/\/.*mock.*data/gi
};

// Replacement suggestions
export const REPLACEMENT_SUGGESTIONS = {
  setTimeout: 'Remove artificial delays and use real loading states',
  mockArrays: 'Replace with supabase.from().select() queries',
  staticMetrics: 'Use real data from billing_records or analytics_events',
  hardcodedData: 'Connect to live database tables'
};

/**
 * Validates that a data array doesn't contain mock data
 */
export const validateRealData = (data: any[], context: string = 'unknown') => {
  if (!Array.isArray(data)) return true;
  
  const hasMockData = data.some(item => {
    if (typeof item === 'object' && item !== null) {
      const itemStr = JSON.stringify(item);
      return (
        itemStr.includes('mock-') ||
        itemStr.includes('test-') ||
        item.id?.toString().startsWith('mock') ||
        item.id?.toString().startsWith('test')
      );
    }
    return false;
  });
  
  if (hasMockData) {
    console.error(`🚨 Mock data detected in ${context}:`, data);
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Mock data detected in ${context} - replace with real database queries`);
    }
  }
  
  return !hasMockData;
};

/**
 * Validates that metrics are coming from real sources
 */
export const validateRealMetrics = (metrics: Record<string, any>, context: string = 'unknown') => {
  const suspiciousValues = Object.entries(metrics).filter(([key, value]) => {
    if (typeof value === 'number') {
      // Check for obviously fake round numbers that are commonly used as mock data
      const roundNumbers = [87, 100, 50, 25, 75, 12, 23, 45, 67, 89];
      return roundNumbers.includes(value);
    }
    return false;
  });
  
  if (suspiciousValues.length > 0) {
    console.warn(`⚠️ Suspicious metrics in ${context}:`, suspiciousValues);
  }
  
  return suspiciousValues.length === 0;
};

/**
 * Runtime check to ensure no setTimeout delays in production
 */
export const validateNoArtificialDelays = () => {
  if (process.env.NODE_ENV === 'production') {
    const originalSetTimeout = window.setTimeout;
    (window as any).setTimeout = (callback: TimerHandler, delay?: number, ...args: any[]) => {
      if (delay && delay > 100) {
        console.warn(`⚠️ Artificial delay detected: ${delay}ms - this should be removed in production`);
      }
      return originalSetTimeout(callback, delay, ...args);
    };
  }
};

/**
 * Initialize mock data validation in development
 */
export const initializeMockDataValidation = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Mock data validation enabled');
    validateNoArtificialDelays();
    
    // Monitor global state for mock data
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('mock') || message.includes('static') || message.includes('fake')) {
        console.warn('🚨 Potential mock data usage detected:', ...args);
      }
      originalLog(...args);
    };
  }
};

/**
 * Component wrapper that validates props don't contain mock data
 */
export const withRealDataValidation = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
) => {
  return (props: T) => {
    if (process.env.NODE_ENV === 'development') {
      // Validate props don't contain mock data
      Object.entries(props || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          validateRealData(value, `${componentName}.${key}`);
        }
        if (typeof value === 'object' && value !== null) {
          validateRealMetrics(value, `${componentName}.${key}`);
        }
      });
    }
    
    return React.createElement(Component, props);
  };
};