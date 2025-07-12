import { supabase } from '@/integrations/supabase/client';
import type { SystemMetrics, TenantMetric, AuditLog, MasterAdminProfile } from '@/types/MasterAdmin';

export class MasterAdminService {
  /**
   * Get system-wide metrics for master admin dashboard
   */
  static async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get merchant counts
      const { data: merchants, error: merchantError } = await supabase
        .from('merchants')
        .select('id, shop_domain, plan_type, created_at, updated_at');

      if (merchantError) throw merchantError;

      // Get returns data
      const { data: returns, error: returnsError } = await supabase
        .from('returns')
        .select('id, merchant_id, total_amount, created_at, updated_at');

      if (returnsError) throw returnsError;

      // Calculate metrics
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const activeMerchants = merchants?.filter(m => {
        const updated = new Date(m.updated_at);
        const daysSinceUpdate = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate <= 30;
      }) || [];

      const returnsThisMonth = returns?.filter(r => 
        new Date(r.created_at) >= currentMonth
      ) || [];

      const totalRevenue = returns?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;
      const revenueThisMonth = returnsThisMonth.reduce((sum, r) => sum + Number(r.total_amount), 0);

      // Generate tenant metrics
      const tenantMetrics: TenantMetric[] = merchants?.map(merchant => {
        const merchantReturns = returns?.filter(r => r.merchant_id === merchant.id) || [];
        const merchantRevenue = merchantReturns.reduce((sum, r) => sum + Number(r.total_amount), 0);
        
        return {
          merchant_id: merchant.id,
          shop_domain: merchant.shop_domain,
          plan_type: merchant.plan_type || 'starter',
          returns_count: merchantReturns.length,
          revenue_impact: merchantRevenue,
          last_activity: merchant.updated_at,
          status: activeMerchants.includes(merchant) ? 'active' : 'inactive'
        };
      }) || [];

      return {
        total_merchants: merchants?.length || 0,
        active_merchants: activeMerchants.length,
        total_returns: returns?.length || 0,
        returns_this_month: returnsThisMonth.length,
        total_revenue: totalRevenue,
        revenue_this_month: revenueThisMonth,
        system_health: {
          database_status: 'healthy',
          api_status: 'healthy', 
          ai_service_status: 'healthy',
          uptime_percentage: 99.9
        },
        tenant_metrics: tenantMetrics
      };
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw error;
    }
  }

  /**
   * Log admin action for audit trail
   */
  static async logAdminAction(
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: 'master_admin_action',
          event_data: {
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging admin action:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for master admin
   */
  static async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'master_admin_action')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(log => {
        // Type guard to check if event_data is an object
        const eventData = log.event_data as Record<string, any> | null;
        
        return {
          id: log.id,
          admin_user_id: log.merchant_id || '',
          action: eventData?.action || '',
          resource_type: eventData?.resource_type || '',
          resource_id: eventData?.resource_id || '',
          details: eventData?.details || {},
          ip_address: eventData?.ip_address || '',
          user_agent: eventData?.user_agent || '',
          timestamp: log.created_at
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Suspend/unsuspend merchant
   */
  static async toggleMerchantStatus(merchantId: string, suspend: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('merchants')
        .update({ 
          settings: { suspended: suspend },
          updated_at: new Date().toISOString()
        })
        .eq('id', merchantId);

      if (error) throw error;

      await this.logAdminAction(
        suspend ? 'suspend_merchant' : 'unsuspend_merchant',
        'merchant',
        merchantId,
        { action: suspend ? 'suspended' : 'unsuspended' }
      );
    } catch (error) {
      console.error('Error toggling merchant status:', error);
      throw error;
    }
  }
}
