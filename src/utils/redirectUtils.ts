/**
 * Redirect Utilities - Helper functions for managing redirects and preventing loops
 */

const REDIRECT_HISTORY_KEY = 'redirect_history';
const MAX_REDIRECT_TIME = 30000; // 30 seconds

export interface RedirectEntry {
  from: string;
  to: string;
  reason: string;
  timestamp: number;
}

/**
 * Clear redirect history to reset circuit breaker
 */
export function clearRedirectHistory(): void {
  localStorage.removeItem(REDIRECT_HISTORY_KEY);
  console.log('🧹 Redirect history cleared');
}

/**
 * Get current redirect history
 */
export function getRedirectHistory(): RedirectEntry[] {
  try {
    const history = localStorage.getItem(REDIRECT_HISTORY_KEY);
    if (!history) return [];
    
    const entries = JSON.parse(history) as RedirectEntry[];
    const now = Date.now();
    
    // Filter out old entries
    const recentEntries = entries.filter(entry => now - entry.timestamp < MAX_REDIRECT_TIME);
    
    // Update storage with cleaned history
    if (recentEntries.length !== entries.length) {
      localStorage.setItem(REDIRECT_HISTORY_KEY, JSON.stringify(recentEntries));
    }
    
    return recentEntries;
  } catch (e) {
    console.warn('Error reading redirect history:', e);
    return [];
  }
}

/**
 * Check if we're in a redirect loop
 */
export function isRedirectLoop(maxRedirects = 3): boolean {
  const history = getRedirectHistory();
  return history.length >= maxRedirects;
}

/**
 * Add redirect to history
 */
export function addRedirectToHistory(from: string, to: string, reason: string): void {
  const history = getRedirectHistory();
  const entry: RedirectEntry = {
    from,
    to,
    reason,
    timestamp: Date.now()
  };
  
  history.push(entry);
  localStorage.setItem(REDIRECT_HISTORY_KEY, JSON.stringify(history));
  
  console.log('📝 Redirect recorded:', entry);
}

/**
 * Debug function to log redirect loop information
 */
export function logRedirectLoopInfo(): void {
  const history = getRedirectHistory();
  console.log('🔄 Redirect History Debug:', {
    totalRedirects: history.length,
    isLoop: isRedirectLoop(),
    history: history.map(entry => ({
      ...entry,
      age: Date.now() - entry.timestamp
    }))
  });
}

/**
 * Emergency redirect breaker - use as last resort
 */
export function emergencyRedirectBreaker(): string {
  clearRedirectHistory();
  console.warn('🚨 Emergency redirect breaker activated');
  
  // Try to determine safe fallback route
  const currentPath = window.location.pathname;
  
  if (currentPath === '/auth') return '/dashboard';
  if (currentPath === '/dashboard') return '/auth';
  if (currentPath === '/connect-shopify') return '/dashboard';
  
  return '/';
}