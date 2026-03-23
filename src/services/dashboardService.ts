import apiClient from './apiClient';

export interface KpiCard {
  id: string;
  title: string;
  value: string | number;
  displayValue: string;
  subtitle?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: string;
  color?: string;
}

export interface ChartPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartSeries {
  name: string;
  points: ChartPoint[];
  color?: string;
}

export interface DashboardChartData {
  chartType: 'bar' | 'line' | 'donut' | 'funnel';
  title: string;
  series: ChartSeries[];
}

export interface Notification {
  severity: string;
  module: string;
  title: string;
  description: string;
  entityType: string;
  entityId: number;
  referenceNo?: string;
  eventDate: string;
  actionPath?: string;
}

export interface NotificationGroup {
  severity: string;
  count: number;
  items: Notification[];
}

export interface NotificationCenter {
  totalCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  groups: NotificationGroup[];
}

export interface ExecutiveOverview {
  kpis: KpiCard[];
  cashExposureChart: DashboardChartData;
  shipmentFlowChart: DashboardChartData;
  operationalBlockersChart: DashboardChartData;
}

export interface TableRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface DashboardTable {
  title: string;
  columns: { key: string; label: string; type?: 'text' | 'currency' | 'date' | 'badge' | 'link' }[];
  rows: TableRow[];
  linkKey?: string;
  linkPath?: string;
}

export interface DashboardWidget {
  widgetId: string;
  widgetType: 'chart' | 'table' | 'kpi';
  title: string;
  chart?: DashboardChartData;
  table?: DashboardTable;
}

export interface ProcurementWorkspace {
  widgets: DashboardWidget[];
}

export interface LogisticsWorkspace {
  widgets: DashboardWidget[];
}

export interface FinanceWorkspace {
  widgets: DashboardWidget[];
}

export interface PaymentModuleCard {
  moduleName: string;
  pending: number;
  approved: number;
  paid: number;
  rejected: number;
}

export interface PaymentOperationsWorkspace {
  moduleCards: PaymentModuleCard[];
  widgets: DashboardWidget[];
}

export interface FunctionalWorkspace {
  procurement: ProcurementWorkspace;
  logistics: LogisticsWorkspace;
  finance: FinanceWorkspace;
  paymentOperations: PaymentOperationsWorkspace;
}

export interface DashboardData {
  executiveOverview: ExecutiveOverview;
  notificationCenter: NotificationCenter;
  functionalWorkspace: FunctionalWorkspace;
}

const DASHBOARD_TIMEOUT = 60000;

export const dashboardApi = {
  getAll: () => apiClient.get<DashboardData>('/api/dashboard', { timeout: DASHBOARD_TIMEOUT }),
  getOverview: () => apiClient.get<ExecutiveOverview>('/api/dashboard/overview', { timeout: DASHBOARD_TIMEOUT }),
  getNotifications: () => apiClient.get<NotificationCenter>('/api/dashboard/notifications', { timeout: DASHBOARD_TIMEOUT }),
  getProcurement: () => apiClient.get<ProcurementWorkspace>('/api/dashboard/procurement', { timeout: DASHBOARD_TIMEOUT }),
  getLogistics: () => apiClient.get<LogisticsWorkspace>('/api/dashboard/logistics', { timeout: DASHBOARD_TIMEOUT }),
  getFinance: () => apiClient.get<FinanceWorkspace>('/api/dashboard/finance', { timeout: DASHBOARD_TIMEOUT }),
  getPaymentOperations: () => apiClient.get<PaymentOperationsWorkspace>('/api/dashboard/payment-operations', { timeout: DASHBOARD_TIMEOUT }),
};
