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

export interface ProcurementKpiWidget {
  key: string;
  title: string;
  value: number;
  displayValue: string;
  subtitle: string | null;
}

export interface ProcurementPurchaseOrder {
  purchaseOrderId: number;
  poNumber: string;
  poDate: string;
  supplierName: string;
  amount: number;
  status: string;
  ageInDays: number;
}

export interface ProcurementOverduePayment {
  purchaseOrderPaymentId: number;
  purchaseOrderId: number;
  poNumber: string;
  supplierName: string;
  description: string;
  expectedAmount: number;
  expectedDate: string;
  status: string;
  daysOverdue: number;
}

export interface ProcurementWorkspace {
  widgets: ProcurementKpiWidget[];
  poStatusFunnel: DashboardChartData;
  topSuppliersByAmount: DashboardChartData;
  approvedPoAging: DashboardChartData;
  poPaymentStatusDistribution: DashboardChartData;
  monthlyPoAmountTrend: DashboardChartData;
  poPaymentDueTrendByWeek: DashboardChartData;
  recentSubmittedPurchaseOrders: ProcurementPurchaseOrder[];
  approvedPurchaseOrdersAwaitingContainerAllocation: ProcurementPurchaseOrder[];
  highValuePurchaseOrders: ProcurementPurchaseOrder[];
  overduePurchaseOrderPayments: ProcurementOverduePayment[];
}

export interface LogisticsKpiWidget {
  key: string;
  title: string;
  value: number;
  displayValue: string;
  subtitle: string | null;
}

export interface LogisticsContainer {
  containerId: number;
  containerNumber: string;
  containerDate: string;
  etd: string;
  eta: string;
  status: string;
  hasTelexReleased: boolean;
  totalCBM: number;
  totalAmount: number;
  shippingCompanyName: string;
  oceanFreightCompanyName: string;
}

export interface LogisticsDelayedContainer {
  containerId: number;
  containerNumber: string;
  currentStatus: string;
  recommendedAction: string;
  reason: string;
  relevantDate: string;
}

export interface LogisticsWorkspace {
  widgets: LogisticsKpiWidget[];
  containerStatusDistribution: DashboardChartData;
  etaVsReceivedTrend: DashboardChartData;
  monthlyTotalCbmMoved: DashboardChartData;
  shippingCompanyBreakdown: DashboardChartData;
  oceanFreightCompanyBreakdown: DashboardChartData;
  recentlyUpdatedContainers: LogisticsContainer[];
  delayedContainers: LogisticsContainer[];
  containersRequiringNextWorkflowAction: LogisticsDelayedContainer[];
  paymentCompletionMilestones: unknown[];
}

export interface FinanceWorkspace {
  widgets: DashboardWidget[];
}

export interface PaymentModuleCardStat {
  key: string;
  title: string;
  value: number;
  displayValue: string;
  subtitle: string | null;
}

export interface PaymentModuleCard {
  module: string;
  cards: PaymentModuleCardStat[];
}

export interface PaymentOperationsWorkspace {
  moduleCards: PaymentModuleCard[];
  recentClearingPayments: PaymentOperationsItem[];
  recentOceanFreightPayments: PaymentOperationsItem[];
  recentLocalPayments: PaymentOperationsItem[];
  missingPaymentPerContainerExceptions: unknown[];
}

export interface PaymentOperationsItem {
  id: number;
  containerId: number;
  containerNumber: string;
  module: string;
  partyName: string;
  amount: number;
  paymentDate: string;
  status: string;
}

const DASHBOARD_TIMEOUT = 60000;

export const dashboardApi = {
  getOverview: () => apiClient.get<ExecutiveOverview>('/api/dashboard/overview', { timeout: DASHBOARD_TIMEOUT }),
  getNotifications: () => apiClient.get<NotificationCenter>('/api/dashboard/notifications', { timeout: DASHBOARD_TIMEOUT }),
  getProcurement: () => apiClient.get<ProcurementWorkspace>('/api/dashboard/procurement', { timeout: DASHBOARD_TIMEOUT }),
  getLogistics: () => apiClient.get<LogisticsWorkspace>('/api/dashboard/logistics', { timeout: DASHBOARD_TIMEOUT }),
  getFinance: () => apiClient.get<FinanceWorkspace>('/api/dashboard/finance', { timeout: DASHBOARD_TIMEOUT }),
  getPaymentOperations: () => apiClient.get<PaymentOperationsWorkspace>('/api/dashboard/payment-operations', { timeout: DASHBOARD_TIMEOUT }),
};
