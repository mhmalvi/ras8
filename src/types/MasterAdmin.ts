
export interface MasterAdminProfile {
  id: string;
  user_id: string;
  permissions: MasterAdminPermission[];
  ip_restrictions: string[];
  mfa_enabled: boolean;
  last_login: string;
  session_timeout: number;
  created_at: string;
  updated_at: string;
}

export interface MasterAdminPermission {
  resource: 'merchants' | 'users' | 'billing' | 'analytics' | 'system' | 'security';
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[];
}

export interface SystemMetrics {
  total_merchants: number;
  active_merchants: number;
  total_returns: number;
  returns_this_month: number;
  total_revenue: number;
  revenue_this_month: number;
  system_health: {
    database_status: 'healthy' | 'warning' | 'critical';
    api_status: 'healthy' | 'warning' | 'critical';
    ai_service_status: 'healthy' | 'warning' | 'critical';
    uptime_percentage: number;
  };
  tenant_metrics: TenantMetric[];
}

export interface TenantMetric {
  merchant_id: string;
  shop_domain: string;
  plan_type: string;
  returns_count: number;
  revenue_impact: number;
  last_activity: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}
