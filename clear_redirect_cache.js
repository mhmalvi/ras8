// Utility script to clear redirect cache and fix authentication loops
// Run this in browser console if experiencing redirect loops

(function clearAuthCaches() {
  console.log('🧹 Clearing authentication caches...');
  
  // Clear redirect history
  localStorage.removeItem('redirect_history');
  console.log('✅ Cleared redirect history');
  
  // Clear preserved embedded context that might be stale
  localStorage.removeItem('preserved_embedded_context');
  console.log('✅ Cleared preserved embedded context');
  
  // Clear any stale landing decisions
  localStorage.removeItem('last_landing_decision');
  console.log('✅ Cleared last landing decision');
  
  // Clear pending embedded context
  localStorage.removeItem('pending_embedded_context');
  console.log('✅ Cleared pending embedded context');
  
  console.log('🎉 Authentication caches cleared! Please refresh the page.');
  
  // Optionally auto-refresh
  if (confirm('Refresh the page now?')) {
    window.location.reload();
  }
})();