# Application-Level Security Patches

## Critical Frontend & API Security Fixes

These patches address the application-level tenant isolation vulnerabilities identified in the security audit.

---

### Patch 1: Fix Dashboard Metrics Hook (CRITICAL)

**File:** `/src/hooks/useRealDashboardMetrics.tsx`

**Current vulnerable code:**
```typescript
// DANGEROUS: Aggregates ALL merchant data
supabase.from('merchants').select('id, created_at, plan_type'),
supabase.from('returns').select('id, total_amount, created_at, merchant_id')
```

**Security patch:**
```typescript
// Add merchant_id filtering to ALL queries
const { profile } = useMerchantProfile();
const merchantId = profile?.merchant_id;

if (!merchantId) {
  return { data: null, loading: false, error: 'No merchant context' };
}

// Secure queries with merchant scoping
const promises = [
  supabase.from('merchants')
    .select('id, created_at, plan_type')
    .eq('id', merchantId),  // ADD THIS LINE
  
  supabase.from('returns')
    .select('id, total_amount, created_at, merchant_id')
    .eq('merchant_id', merchantId),  // ADD THIS LINE
    
  supabase.from('orders')
    .select('id, total_amount, created_at')
    .eq('merchant_id', merchantId),  // ADD THIS LINE
    
  supabase.from('analytics_events')
    .select('event_type, created_at')
    .eq('merchant_id', merchantId)  // ADD THIS LINE
];
```

---

### Patch 2: Fix Master Admin Data Hook (CRITICAL)

**File:** `/src/hooks/useMasterAdminData.tsx`

**Current vulnerable code:**
```typescript
// EXPOSES ALL MERCHANT DATA
const { data: merchantsData } = await supabase
  .from('merchants')
  .select('*');

const { data: returnsData } = await supabase
  .from('returns')
  .select('total_amount, created_at');
```

**Security patch:**
```typescript
// Add proper authorization check
const { profile } = useMerchantProfile();

// Only allow system admins to access master admin data
if (profile?.role !== 'admin') {
  throw new Error('Unauthorized: Admin access required');
}

// Even admins should have scoped access in most cases
const { data: merchantsData } = await supabase
  .from('merchants')
  .select('id, shop_domain, plan_type, created_at')  // Limit fields
  .order('created_at', { ascending: false })
  .limit(100);  // Add reasonable limits

const { data: returnsData } = await supabase
  .from('returns')
  .select('total_amount, created_at, merchant_id')
  .order('created_at', { ascending: false })
  .limit(1000);  // Add reasonable limits
```

---

### Patch 3: Fix Customer Page Cross-Tenant Exposure (CRITICAL)

**File:** `/src/pages/Customers.tsx`

**Current vulnerable code:**
```typescript
// MISSING merchant_id filter
const { data: returns, error } = await supabase
  .from('returns')
  .select('customer_email, total_amount, created_at');
```

**Security patch:**
```typescript
// Add merchant scoping to ALL customer queries
const { profile } = useMerchantProfile();
const merchantId = profile?.merchant_id;

if (!merchantId) {
  throw new Error('No merchant context available');
}

const { data: returns, error } = await supabase
  .from('returns')
  .select('customer_email, total_amount, created_at, merchant_id')
  .eq('merchant_id', merchantId);  // ADD THIS LINE

// Also fix customer data fetching
const fetchCustomerData = async (email: string) => {
  const { data: customerReturns } = await supabase
    .from('returns')
    .select('*')
    .eq('customer_email', email)
    .eq('merchant_id', merchantId);  // ADD THIS LINE
    
  return customerReturns;
};
```

---

### Patch 4: Add Secure Query Wrapper Utility

**Create new file:** `/src/utils/secureQuery.ts`

```typescript
import { supabase } from "@/integrations/supabase/client";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";

/**
 * Secure query wrapper that automatically adds merchant_id filtering
 */
export class SecureQuery {
  private merchantId: string;

  constructor(merchantId: string) {
    if (!merchantId) {
      throw new Error('Merchant ID required for secure queries');
    }
    this.merchantId = merchantId;
  }

  /**
   * Create a query builder with automatic merchant scoping
   */
  from(table: string) {
    return supabase
      .from(table)
      .eq('merchant_id', this.merchantId);
  }

  /**
   * Query related tables through joins (for tables without direct merchant_id)
   */
  fromRelated(table: string, relationTable: string, relationField: string) {
    return supabase
      .from(table)
      .select(`*, ${relationTable}!inner(merchant_id)`)
      .eq(`${relationTable}.merchant_id`, this.merchantId);
  }
}

/**
 * Hook to get secure query instance
 */
export function useSecureQuery() {
  const { profile } = useMerchantProfile();
  
  if (!profile?.merchant_id) {
    throw new Error('No merchant context available');
  }
  
  return new SecureQuery(profile.merchant_id);
}

/**
 * Secure query for customer portal (email-based)
 */
export function useCustomerQuery(customerEmail: string) {
  return {
    orders: () => supabase
      .from('orders')
      .select('*')
      .eq('customer_email', customerEmail),
      
    returns: () => supabase
      .from('returns')
      .select('*')
      .eq('customer_email', customerEmail)
  };
}
```

---

### Patch 5: Fix Cache Keys (MEDIUM PRIORITY)

**Files affected:** All React Query/SWR usage

**Current vulnerable pattern:**
```typescript
// DANGEROUS: No merchant isolation in cache keys
const queryKey = ['products', filters];
const cacheKey = 'dashboard-metrics';
```

**Security patch:**
```typescript
// SECURE: Include merchant_id in all cache keys
const { profile } = useMerchantProfile();
const merchantId = profile?.merchant_id;

const queryKey = ['products', merchantId, filters];
const cacheKey = `dashboard-metrics-${merchantId}`;
const userCacheKey = `user-${auth.user?.id}-merchant-${merchantId}`;
```

---

### Patch 6: Add Empty State Components

**Create new file:** `/src/components/EmptyStates.tsx`

```typescript
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {icon && (
          <div className="mb-4 text-gray-400">
            {icon}
          </div>
        )}
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mb-4 text-sm text-gray-600 max-w-md">{description}</p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Specific empty states
export function NoProductsEmptyState() {
  return (
    <EmptyState
      title="No products found"
      description="Connect your Shopify store to start seeing your product data and return analytics."
      action={{
        label: "Connect Shopify",
        onClick: () => window.location.href = "/shopify/install"
      }}
    />
  );
}

export function NoCustomersEmptyState() {
  return (
    <EmptyState
      title="No customers yet"
      description="Your customer data will appear here once you connect your Shopify store and receive orders."
    />
  );
}

export function NoReturnsEmptyState() {
  return (
    <EmptyState
      title="No returns yet"
      description="Return requests will appear here as customers submit them through your store."
    />
  );
}
```

---

### Patch 7: Update Data Hooks with Secure Patterns

**Pattern for all data hooks:**

```typescript
// Example: useProducts hook
export function useProducts() {
  const { profile } = useMerchantProfile();
  const merchantId = profile?.merchant_id;

  return useQuery({
    queryKey: ['products', merchantId],
    queryFn: async () => {
      if (!merchantId) {
        throw new Error('No merchant context');
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Apply this pattern to:
// - useCustomersData.tsx
// - useOrdersData.tsx  
// - useReturnsData.tsx
// - useAnalyticsData.tsx
// - useAIInsights.tsx
```

---

### Patch 8: Fix Webhook Edge Function (CRITICAL)

**File:** `/supabase/functions/enhanced-shopify-webhook/index.ts`

**Current vulnerable code:**
```typescript
// MISSING merchant_id in order creation
const orderData = {
  shopify_order_id: payload.id.toString(),
  customer_email: payload.email || 'unknown@example.com',
  total_amount: parseFloat(payload.total_price || '0'),
  status: 'completed'
  // MISSING: merchant_id
};
```

**Security patch:**
```typescript
// ADD merchant_id to order creation
const orderData = {
  merchant_id: merchantId,  // ADD THIS LINE
  shopify_order_id: payload.id.toString(),
  customer_email: payload.email || payload.customer?.email || 'unknown@example.com',
  total_amount: parseFloat(payload.total_price || '0'),
  status: 'completed',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Validate merchant_id exists
if (!merchantId) {
  throw new Error('Merchant ID required for order creation');
}

// Add validation before inserting
if (!orderData.merchant_id) {
  console.error('❌ Order creation blocked: missing merchant_id');
  throw new Error('Invalid merchant context');
}
```

---

### Patch 9: Add Request Validation Middleware

**Create new file:** `/src/middleware/tenantValidation.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function validateTenantAccess(
  request: NextRequest,
  requestedMerchantId?: string
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get user's merchant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('merchant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.merchant_id) {
      return NextResponse.json(
        { error: 'No merchant context' },
        { status: 403 }
      );
    }

    // If specific merchant requested, validate access
    if (requestedMerchantId && requestedMerchantId !== profile.merchant_id) {
      // Only admins can access other merchants
      if (profile.role !== 'admin') {
        return NextResponse.json(
          { error: 'Cross-tenant access forbidden' },
          { status: 403 }
        );
      }
    }

    return {
      user,
      merchantId: profile.merchant_id,
      role: profile.role
    };

  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
```

---

### Patch 10: Update All Page Components

**Apply this pattern to all page components:**

```typescript
// Example: Products.tsx
import { NoProductsEmptyState } from "@/components/EmptyStates";
import { useSecureQuery } from "@/utils/secureQuery";

const Products = () => {
  const secureQuery = useSecureQuery();
  
  const { data: products, loading, error } = useQuery({
    queryKey: ['products', secureQuery.merchantId],
    queryFn: () => secureQuery.from('products').select('*'),
    enabled: !!secureQuery.merchantId
  });

  if (loading) return <ProductsSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!products?.length) return <NoProductsEmptyState />;

  return <ProductsGrid products={products} />;
};
```

---

## Implementation Priority

### 🚨 CRITICAL (Deploy Today)
1. **Patch 1-3**: Fix data leakage in hooks and pages
2. **Patch 8**: Fix webhook merchant_id insertion

### ⚡ HIGH (This Week)  
3. **Patch 4**: Implement secure query wrapper
4. **Patch 9**: Add tenant validation middleware
5. **Patch 5**: Fix cache key isolation

### 📋 MEDIUM (Next Sprint)
6. **Patch 6-7**: Add empty states and update hooks
7. **Patch 10**: Update all page components

---

## Testing After Patches

```bash
# 1. Run the SQL security patches first
psql -f security-patches.sql

# 2. Test API endpoints
bash api-security-tests.sh

# 3. Run database verification
psql -f security-repro-scripts.sql

# 4. Test frontend isolation
# - Login as different merchants
# - Verify no cross-tenant data visible
# - Test empty states show correctly
```

---

## Monitoring Post-Deployment

1. **Add logging to all data queries**:
```typescript
console.log('Data access:', {
  userId: user.id,
  merchantId: profile.merchant_id,
  resource: 'products',
  count: data.length
});
```

2. **Monitor for security violations**:
- Queries without merchant_id
- Cross-tenant access attempts  
- Unusual data access patterns

3. **Set up alerts for**:
- Failed authentication attempts
- Cross-tenant access violations
- Queries returning unusually large datasets

---

## Final Security Checklist

- [ ] All database queries include merchant_id filtering
- [ ] All cache keys include merchant context  
- [ ] Empty states render instead of other tenant data
- [ ] Webhook handlers validate merchant_id
- [ ] API endpoints reject cross-tenant access
- [ ] Customer portal scoped to customer email + merchant
- [ ] Admin functions properly restricted
- [ ] Security audit logging enabled
- [ ] All RLS policies enabled and tested
- [ ] Cross-tenant access attempts return 403/404