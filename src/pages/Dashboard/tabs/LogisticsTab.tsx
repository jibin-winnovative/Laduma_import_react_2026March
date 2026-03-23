import { useNavigate } from 'react-router-dom';
import { DashboardChart } from '../components/DashboardChart';
import { Card } from '../../../components/ui/Card';
import type {
  LogisticsWorkspace,
  LogisticsContainer,
  LogisticsDelayedContainer,
} from '../../../services/dashboardService';

interface LogisticsTabProps {
  data: LogisticsWorkspace | null;
  loading: boolean;
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#374151' },
  booked: { bg: '#DBEAFE', text: '#1D4ED8' },
  'in transit': { bg: '#FED7AA', text: '#C2410C' },
  received: { bg: '#D1FAE5', text: '#047857' },
  canceled: { bg: '#FEE2E2', text: '#DC2626' },
};

const getBadgeStyle = (value: string) => {
  const key = (value || '').toLowerCase().trim();
  return BADGE_COLORS[key] || { bg: '#F3F4F6', text: '#374151' };
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ContainerTable = ({
  title,
  rows,
}: {
  title: string;
  rows: LogisticsContainer[];
}) => {
  const navigate = useNavigate();

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Container #</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">ETA</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Status</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">CBM</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Amount</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Shipping Co.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">No data available</td>
              </tr>
            ) : (
              rows.map((row) => {
                const badge = getBadgeStyle(row.status);
                return (
                  <tr
                    key={row.containerId}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/containers/${row.containerId}`)}
                  >
                    <td className="px-3 py-2 text-sm text-blue-600 font-medium whitespace-nowrap">{row.containerNumber}</td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">{formatDate(row.eta)}</td>
                    <td className="px-3 py-2">
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text)] text-right whitespace-nowrap">
                      {row.totalCBM.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text)] font-medium text-right whitespace-nowrap">
                      {formatCurrency(row.totalAmount)}
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)] max-w-[160px] truncate">
                      {row.shippingCompanyName}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const WorkflowActionTable = ({ rows }: { rows: LogisticsDelayedContainer[] }) => {
  const navigate = useNavigate();

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Containers Requiring Action</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Container #</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Current Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Recommended Action</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Reason</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Relevant Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">No actions required</td>
              </tr>
            ) : (
              rows.map((row) => {
                const badge = getBadgeStyle(row.currentStatus);
                return (
                  <tr
                    key={row.containerId}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/containers/${row.containerId}`)}
                  >
                    <td className="px-3 py-2 text-sm text-blue-600 font-medium whitespace-nowrap">{row.containerNumber}</td>
                    <td className="px-3 py-2">
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {row.currentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-amber-700 whitespace-nowrap">{row.recommendedAction}</td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)] max-w-[200px] truncate">{row.reason}</td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">{formatDate(row.relevantDate)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const LogisticsTab = ({ data, loading }: LogisticsTabProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <p className="text-sm">No logistics data available</p>
      </div>
    );
  }

  const KPI_COLORS: Record<string, string> = {
    containersDraft: '#6B7280',
    containersBooked: '#3B82F6',
    containersInTransit: '#F97316',
    containersReceived: '#10B981',
    containersCanceled: '#EF4444',
    containersTelexReleased: '#06B6D4',
    containersMissingClearingPayment: '#F59E0B',
    containersMissingOceanPayment: '#EF4444',
  };

  return (
    <div className="space-y-5">
      {data.widgets && data.widgets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {data.widgets.map((w) => {
            const color = KPI_COLORS[w.key] || '#3B82F6';
            return (
              <Card key={w.key} className="p-3">
                <p className="text-xs text-[var(--color-text-secondary)] leading-tight">{w.title}</p>
                <p className="text-2xl font-bold mt-1" style={{ color }}>{w.displayValue}</p>
                {w.subtitle && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{w.subtitle}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.containerStatusDistribution && <DashboardChart data={data.containerStatusDistribution} />}
        {data.etaVsReceivedTrend && <DashboardChart data={data.etaVsReceivedTrend} />}
        {data.monthlyTotalCbmMoved && <DashboardChart data={data.monthlyTotalCbmMoved} />}
        {data.shippingCompanyBreakdown && <DashboardChart data={data.shippingCompanyBreakdown} />}
        {data.oceanFreightCompanyBreakdown && <DashboardChart data={data.oceanFreightCompanyBreakdown} />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {data.recentlyUpdatedContainers && (
          <ContainerTable title="Recently Updated Containers" rows={data.recentlyUpdatedContainers} />
        )}
        {data.delayedContainers && data.delayedContainers.length > 0 && (
          <ContainerTable title="Delayed Containers" rows={data.delayedContainers} />
        )}
        {data.containersRequiringNextWorkflowAction && (
          <WorkflowActionTable rows={data.containersRequiringNextWorkflowAction} />
        )}
      </div>
    </div>
  );
};
