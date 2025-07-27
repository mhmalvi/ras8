# Production Environment Hardening - Implementation Guide

## 🚨 Critical Production Setup Requirements

### 1. Stripe Webhook Configuration

#### A. Configure Webhook Secret
You need to add the `STRIPE_WEBHOOK_SECRET` to your Supabase edge function secrets:

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Create a new webhook endpoint pointing to: `https://[your-project-id].supabase.co/functions/v1/stripe-webhook-handler`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.created`
   - `customer.updated`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret and add it to Supabase secrets

#### B. Production Webhook URLs
- Main webhook: `https://pvadajelvewdazwmvppk.supabase.co/functions/v1/stripe-webhook-handler`
- Health check: `https://pvadajelvewdazwmvppk.supabase.co/functions/v1/system-health-check`

### 2. Sentry Error Monitoring

#### A. Setup Sentry Account
1. Create account at https://sentry.io
2. Create new React project
3. Copy the DSN URL
4. Replace the placeholder DSN in `src/utils/sentry.ts`

#### B. Required Sentry Configuration
Update the DSN in `src/utils/sentry.ts`:
```typescript
dsn: 'https://your-actual-dsn@o[orgid].ingest.sentry.io/[projectid]'
```

### 3. Database Backup Configuration

Supabase provides automated backups, but you should verify the configuration:

#### A. Backup Settings (Via Supabase Dashboard)
1. Navigate to: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/settings/database
2. Verify backup frequency and retention
3. Test point-in-time recovery capability

#### B. Backup Monitoring
The backup manager edge function provides:
- Backup status monitoring
- Configuration management
- Restore initiation

## 🔧 Implementation Status

### ✅ Completed
- Stripe webhook handler edge function
- System health check endpoint
- Sentry integration setup
- Backup manager functionality
- Error monitoring infrastructure

### ⚠️ Requires User Action
- Add `STRIPE_WEBHOOK_SECRET` to Supabase secrets
- Configure Stripe webhook endpoints
- Replace Sentry DSN with actual project DSN
- Verify database backup settings

## 🚀 Next Steps

1. **Immediate (Critical)**:
   - Configure Stripe webhook secret
   - Set up Sentry DSN
   - Test webhook endpoints

2. **Within 24 hours**:
   - Test backup and restore procedures
   - Configure alerting rules
   - Set up monitoring dashboards

3. **Within 1 week**:
   - Implement automated deployment pipelines
   - Configure SSL certificates
   - Performance optimization

## 📊 Monitoring & Alerting

### Health Check Endpoints
- System Health: `/functions/v1/system-health-check`
- Backup Status: `/functions/v1/backup-manager`

### Key Metrics to Monitor
- Database response times
- API error rates
- Webhook processing success
- User authentication failures
- AI service availability

## 🔐 Security Checklist

### Production Security Requirements
- [ ] Stripe webhook signature verification
- [ ] Database RLS policies active
- [ ] API rate limiting configured
- [ ] Error logs sanitized (no sensitive data)
- [ ] Access tokens encrypted at rest
- [ ] CORS policies properly configured
- [ ] HTTPS enforced across all endpoints

### Recommended Security Monitoring
- Unusual API access patterns
- Failed authentication attempts
- Webhook signature failures
- Database query anomalies
- Excessive error rates