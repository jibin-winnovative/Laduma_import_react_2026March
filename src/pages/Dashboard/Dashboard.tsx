import { useState, useEffect, useRef } from 'react';
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
  type ExecutiveOverview,
  type NotificationCenter,
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

const SkeletonNotifications = () => (
  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);

type TabId = 'procurement' | 'logistics' | 'finance' | 'payment-operations';

interface TabData {
  procurement: ProcurementWorkspace | null;
  logistics: LogisticsWorkspace | null;
  finance: FinanceWorkspace | null;
  'payment-operations': PaymentOperationsWorkspace | null;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('procurement');

  const [overview, setOverview] = useState<ExecutiveOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(false);

  const [notifications, setNotifications] = useState<NotificationCenter | null>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const [tabData, setTabData] = useState<TabData>({
    procurement: null,
    logistics: null,
    finance: null,
    'payment-operations': null,
  });
  const [tabLoading, setTabLoading] = useState<Partial<Record<TabId, boolean>>>({});
  const loadedTabs = useRef<Partial<Record<TabId, boolean>>>({});

  useEffect(() => {
    loadOverview();
    loadNotifications();
    loadTab('procurement');
  }, []);

  const loadOverview = async () => {
    setOverviewLoading(true);
    setOverviewError(false);
    try {
      const res = await dashboardApi.getOverview();
      setOverview(res.data);
    } catch {
      setOverviewError(true);
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const res = await dashboardApi.getNotifications();
      setNotifications(res.data);
    } catch {
      // silently fail — notifications are non-critical
    } finally {
      setNotificationsLoading(false);
    }
  };

  const loadTab = async (tab: TabId) => {
    if (loadedTabs.current[tab]) return;
    loadedTabs.current[tab] = true;
    setTabLoading((prev) => ({ ...prev, [tab]: true }));
    try {
      if (tab === 'procurement') {
        const res = await dashboardApi.getProcurement();
        setTabData((prev) => ({ ...prev, procurement: res.data }));
      } else if (tab === 'logistics') {
        const res = await dashboardApi.getLogistics();
        setTabData((prev) => ({ ...prev, logistics: res.data }));
      } else if (tab === 'finance') {
        const res = await dashboardApi.getFinance();
        setTabData((prev) => ({ ...prev, finance: res.data }));
      } else if (tab === 'payment-operations') {
        const res = await dashboardApi.getPaymentOperations();
        setTabData((prev) => ({ ...prev, 'payment-operations': res.data }));
      }
    } catch {
      // keep loadedTabs[tab] = true so we don't spam on every switch
    } finally {
      setTabLoading((prev) => ({ ...prev, [tab]: false }));
    }
  };

  const handleTabChange = (tab: string) => {
    const t = tab as TabId;
    setActiveTab(t);
    loadTab(t);
  };

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

      {overviewError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          Failed to load overview data.{' '}
          <button className="underline font-medium" onClick={loadOverview}>
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {overviewLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : (overview?.kpis || []).map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overviewLoading ? (
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

      {notificationsLoading ? (
        <SkeletonNotifications />
      ) : notifications ? (
        <NotificationList data={notifications} />
      ) : null}

      <Card padding="none">
        <TabPanel tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
          {activeTab === 'procurement' && (
            <div className="px-4 pb-4">
              <ProcurementTab
                data={tabData.procurement}
                loading={!!tabLoading['procurement']}
              />
            </div>
          )}
          {activeTab === 'logistics' && (
            <div className="px-4 pb-4">
              <LogisticsTab
                data={tabData.logistics}
                loading={!!tabLoading['logistics']}
              />
            </div>
          )}
          {activeTab === 'finance' && (
            <div className="px-4 pb-4">
              <FinanceTab
                data={tabData.finance}
                loading={!!tabLoading['finance']}
              />
            </div>
          )}
          {activeTab === 'payment-operations' && (
            <div className="px-4 pb-4">
              <PaymentOperationsTab
                data={tabData['payment-operations']}
                loading={!!tabLoading['payment-operations']}
              />
            </div>
          )}
        </TabPanel>
      </Card>
    </div>
  );
};
