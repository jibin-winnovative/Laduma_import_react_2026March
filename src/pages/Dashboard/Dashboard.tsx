import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, Ship, DollarSign, Package } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { KpiCard } from './components/KpiCard';
import { DashboardChart } from './components/DashboardChart';
import { NotificationList } from './components/NotificationList';
import { TabPanel } from './components/TabPanel';
import { ProcurementTab } from './tabs/ProcurementTab';
import { LogisticsTab } from './tabs/LogisticsTab';
import { FinanceTab } from './tabs/FinanceTab';
import { PaymentOperationsTab } from './tabs/PaymentOperationsTab';
import {
  dashboardApi,
  type DashboardData,
  type ProcurementWorkspace,
  type LogisticsWorkspace,
  type FinanceWorkspace,
  type PaymentOperationsWorkspace,
} from '../../services/dashboardService';

const TABS = [
  { id: 'procurement', label: 'Procurement', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'logistics', label: 'Logistics', icon: <Ship className="w-4 h-4" /> },
  { id: 'finance', label: 'Finance', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'payment-operations', label: 'Payment Operations', icon: <Package className="w-4 h-4" /> },
];

const SkeletonCard = () => (
  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 animate-pulse">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-7 bg-gray-200 rounded w-16" />
        <div className="h-2 bg-gray-200 rounded w-32" />
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

const SkeletonChart = () => (
  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 animate-pulse">
    <div className="h-3 bg-gray-200 rounded w-32 mb-4" />
    <div className="h-32 bg-gray-200 rounded" />
  </div>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('procurement');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lazyData, setLazyData] = useState<{
    procurement: ProcurementWorkspace | null;
    logistics: LogisticsWorkspace | null;
    finance: FinanceWorkspace | null;
    paymentOperations: PaymentOperationsWorkspace | null;
  }>({
    procurement: null,
    logistics: null,
    finance: null,
    paymentOperations: null,
  });
  const [lazyLoading, setLazyLoading] = useState<Record<string, boolean>>({});
  const [lazyLoaded, setLazyLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, dashboardData]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getAll();
      setDashboardData(res.data);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: string) => {
    if (lazyLoaded[tab]) return;

    if (dashboardData?.functionalWorkspace) {
      const ws = dashboardData.functionalWorkspace;
      setLazyData({
        procurement: ws.procurement || null,
        logistics: ws.logistics || null,
        finance: ws.finance || null,
        paymentOperations: ws.paymentOperations || null,
      });
      setLazyLoaded({ procurement: true, logistics: true, finance: true, 'payment-operations': true });
      return;
    }

    setLazyLoading((prev) => ({ ...prev, [tab]: true }));
    try {
      if (tab === 'procurement') {
        const res = await dashboardApi.getProcurement();
        setLazyData((prev) => ({ ...prev, procurement: res.data }));
      } else if (tab === 'logistics') {
        const res = await dashboardApi.getLogistics();
        setLazyData((prev) => ({ ...prev, logistics: res.data }));
      } else if (tab === 'finance') {
        const res = await dashboardApi.getFinance();
        setLazyData((prev) => ({ ...prev, finance: res.data }));
      } else if (tab === 'payment-operations') {
        const res = await dashboardApi.getPaymentOperations();
        setLazyData((prev) => ({ ...prev, paymentOperations: res.data }));
      }
      setLazyLoaded((prev) => ({ ...prev, [tab]: true }));
    } catch {
      setLazyLoaded((prev) => ({ ...prev, [tab]: true }));
    } finally {
      setLazyLoading((prev) => ({ ...prev, [tab]: false }));
    }
  };

  const overview = dashboardData?.executiveOverview;
  const notifications = dashboardData?.notificationCenter;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Here's your procurement and logistics overview.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}{' '}
          <button className="underline font-medium" onClick={loadDashboard}>
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : (overview?.kpis || []).map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </div>

      {(loading || overview) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonChart key={i} />)
          ) : (
            <>
              {overview?.cashExposureChart && (
                <DashboardChart data={overview.cashExposureChart} />
              )}
              {overview?.shipmentFlowChart && (
                <DashboardChart data={overview.shipmentFlowChart} />
              )}
              {overview?.operationalBlockersChart && (
                <DashboardChart data={overview.operationalBlockersChart} />
              )}
            </>
          )}
        </div>
      )}

      {(loading || notifications) && (
        <>
          {loading ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          ) : notifications ? (
            <NotificationList data={notifications} />
          ) : null}
        </>
      )}

      <Card padding="none">
        <TabPanel tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === 'procurement' && (
            <div className="px-4 pb-4">
              <ProcurementTab
                data={lazyData.procurement}
                loading={loading || !!lazyLoading['procurement']}
              />
            </div>
          )}
          {activeTab === 'logistics' && (
            <div className="px-4 pb-4">
              <LogisticsTab
                data={lazyData.logistics}
                loading={loading || !!lazyLoading['logistics']}
              />
            </div>
          )}
          {activeTab === 'finance' && (
            <div className="px-4 pb-4">
              <FinanceTab
                data={lazyData.finance}
                loading={loading || !!lazyLoading['finance']}
              />
            </div>
          )}
          {activeTab === 'payment-operations' && (
            <div className="px-4 pb-4">
              <PaymentOperationsTab
                data={lazyData.paymentOperations}
                loading={loading || !!lazyLoading['payment-operations']}
              />
            </div>
          )}
        </TabPanel>
      </Card>
    </div>
  );
};
