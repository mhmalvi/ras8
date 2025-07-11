
# Manual QA Checklist - Returns Automation SaaS

## 🔐 Authentication & Security
- [ ] User can sign up with email/password
- [ ] User can sign in with valid credentials
- [ ] Invalid credentials show proper error messages
- [ ] User sessions persist across browser refreshes
- [ ] User can sign out successfully
- [ ] Protected routes redirect to auth when not logged in
- [ ] JWT tokens refresh automatically before expiry

## 🏪 Shopify Integration
- [ ] Merchant can connect Shopify store via OAuth
- [ ] Invalid store domains show error messages
- [ ] Shopify connection test works correctly
- [ ] Orders sync from Shopify to database
- [ ] Webhook endpoints validate HMAC signatures
- [ ] App handles Shopify app uninstall gracefully

## 📦 Order Lookup & Returns
- [ ] Customer can lookup orders with order number + email
- [ ] Case-insensitive email matching works
- [ ] Order not found shows helpful error message
- [ ] Customer can select items for return
- [ ] Return reasons are required and validated
- [ ] AI suggestions appear for eligible returns
- [ ] Return submission creates database records
- [ ] Success confirmation shows return ID

## 🤖 AI Features
- [ ] AI generates relevant exchange suggestions
- [ ] Fallback logic works when AI service fails
- [ ] Confidence scores display correctly
- [ ] Different return reasons trigger appropriate suggestions
- [ ] AI risk analysis identifies suspicious returns
- [ ] Custom AI messages generate properly

## 👨‍💼 Merchant Dashboard
- [ ] Returns table loads and displays data
- [ ] Search functionality filters returns
- [ ] Status filtering works correctly
- [ ] Merchant can approve/reject returns
- [ ] Bulk actions work for multiple returns
- [ ] Real-time updates appear when data changes
- [ ] Analytics dashboard shows accurate metrics

## 📊 Analytics & Reporting
- [ ] KPI cards show correct numbers
- [ ] Charts render properly with real data
- [ ] Time range filters affect displayed data
- [ ] Export functionality works for reports
- [ ] Return trends analysis is accurate
- [ ] Top return reasons are calculated correctly

## 💳 Billing & Subscription
- [ ] Stripe checkout session creates successfully
- [ ] Payment processing completes without errors
- [ ] Subscription status updates in database
- [ ] Usage limits are enforced correctly
- [ ] Plan upgrades/downgrades work
- [ ] Customer portal allows subscription management

## 📱 Responsive Design
- [ ] Mobile layout works on phones (< 640px)
- [ ] Tablet layout works (640px - 1024px)  
- [ ] Desktop layout works (> 1024px)
- [ ] Navigation menu collapses on mobile
- [ ] Tables become scrollable on small screens
- [ ] Forms are usable on touch devices

## 🔔 Notifications
- [ ] Email notifications send successfully
- [ ] Return status updates trigger emails
- [ ] AI suggestions are communicated clearly
- [ ] Error notifications appear for failures
- [ ] Success toasts show for completed actions
- [ ] Email templates render correctly

## ⚡ Performance
- [ ] Pages load within 2 seconds
- [ ] API responses are under 500ms average
- [ ] Images load progressively
- [ ] Large datasets paginate properly
- [ ] Search results appear quickly
- [ ] No memory leaks in long sessions

## 🛡️ Security
- [ ] RLS policies prevent cross-merchant data access
- [ ] API endpoints validate authentication
- [ ] Input sanitization prevents XSS
- [ ] SQL injection protection works
- [ ] CSRF tokens validate properly
- [ ] Sensitive data is encrypted

## 🔧 Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Database errors are logged properly
- [ ] Edge function timeouts are handled
- [ ] Invalid input validation works
- [ ] 404 pages display correctly
- [ ] Error boundaries catch React errors

## 🧪 Edge Cases
- [ ] Very large order values are handled
- [ ] Special characters in product names work
- [ ] Empty datasets display properly
- [ ] Concurrent user actions don't conflict
- [ ] Browser back/forward buttons work
- [ ] Page refreshes maintain state

## 📋 Test Data Scenarios

### Happy Path
1. Create merchant account
2. Connect Shopify store  
3. Sync sample orders
4. Submit return as customer
5. Process return as merchant
6. Verify analytics update

### Error Scenarios
1. Invalid Shopify credentials
2. Non-existent order lookup
3. Network timeouts
4. AI service unavailable
5. Payment failures
6. Database connection issues

### Edge Cases
1. Very long product names
2. Multiple simultaneous returns
3. Returns with $0 value
4. International characters
5. Large order quantities
6. Expired authentication tokens

## ✅ Acceptance Criteria
- [ ] All critical user flows complete successfully
- [ ] No console errors during normal usage
- [ ] Performance metrics meet targets
- [ ] Security vulnerabilities addressed
- [ ] Mobile experience is functional
- [ ] Error messages are helpful and actionable
