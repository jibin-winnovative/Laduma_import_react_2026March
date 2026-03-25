import { DashboardChart } from '../components/DashboardChart';
import { Card } from '../../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import type {
  ProcurementWorkspace,
  ProcurementPurchaseOrder,
  ProcurementOverduePayment,
} from '../../../services/dashboardService';

interface ProcurementTabProps {
  data: ProcurementWorkspace | null;
  loading: boolean;
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#374151' },
  approved: { bg: '#D1FAE5', text: '#047857' },
  submitted: { bg: '#DBEAFE', text: '#1D4ED8' },
  pending: { bg: '#FEF3C7', text: '#92400E' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
  requested: { bg: '#E0E7FF', text: '#3730A3' },
};

const getBadgeStyle = (value: string) => {
  const key = (value || '').toLowerCase().trim();
  return BADGE_COLORS[key] || { bg: '#F3F4F6', text: '#374151' };
};

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

const POTable = ({
  title,
  rows,
  linkPath,
}: {
  title: string;
  rows: ProcurementPurchaseOrder[];
  linkPath: string;
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
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">PO #</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Supplier</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Date</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Amount</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Status</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Age</th>
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
                    key={row.purchaseOrderId}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(linkPath.replace(':id', String(row.purchaseOrderId)))}
                  >
                    <td className="px-3 py-2 text-sm text-blue-600 font-medium whitespace-nowrap">{row.poNumber}</td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text)] max-w-[180px] truncate">{row.supplierName}</td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">{formatDate(row.poDate)}</td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text)] font-medium text-right whitespace-nowrap">{formatCurrency(row.amount)}</td>
                    <td className="px-3 py-2">
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)] text-right whitespace-nowrap">
                      {row.ageInDays}d
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

const OverduePaymentsTable = ({ rows }: { rows: ProcurementOverduePayment[] }) => {
  const navigate = useNavigate();

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Overdue PO Payments</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">PO #</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Supplier</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Description</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Amount</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Due Date</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Status</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Overdue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">No overdue payments</td>
              </tr>
            ) : (
              rows.map((row) => {
                const badge = getBadgeStyle(row.status);
                return (
                  <tr
                    key={row.purchaseOrderPaymentId}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/purchase/purchase-orders/${row.purchaseOrderId}`)}
                  >
                    <td className="px-3 py-2 text-sm text-blue-600 font-medium whitespace-nowrap">{row.poNumber}</td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text)] max-w-[150px] truncate">{row.supplierName}</td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)] max-w-[150px] truncate">{row.description}</td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text)] font-medium text-right whitespace-nowrap">{formatCurrency(row.expectedAmount)}</td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">{formatDate(row.expectedDate)}</td>
                    <td className="px-3 py-2">
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-red-600 font-medium text-right whitespace-nowrap">
                      {row.daysOverdue}d
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

export const ProcurementTab = ({ data, loading }: ProcurementTabProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <p className="text-sm">No procurement data available</p>
      </div>
    );
  }

  const KPI_COLORS: Record<string, string> = {
    poDraft: '#6B7280',
    poSubmitted: '#3B82F6',
    poApproved: '#10B981',
    poRejected: '#EF4444',
    upcomingPoPaymentObligations: '#F59E0B',
  };

  return (
    <div className="space-y-5">
      {data.widgets && data.widgets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
        {data.poStatusFunnel && <DashboardChart data={data.poStatusFunnel} />}
        {data.topSuppliersByAmount && <DashboardChart data={data.topSuppliersByAmount} />}
        {data.approvedPoAging && <DashboardChart data={data.approvedPoAging} />}
        {data.poPaymentStatusDistribution && <DashboardChart data={data.poPaymentStatusDistribution} />}
        {data.monthlyPoAmountTrend && <DashboardChart data={data.monthlyPoAmountTrend} />}
        {data.poPaymentDueTrendByWeek && <DashboardChart data={data.poPaymentDueTrendByWeek} />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {data.recentSubmittedPurchaseOrders && (
          <POTable
            title="Recent Submitted Purchase Orders"
            rows={data.recentSubmittedPurchaseOrders}
            linkPath="/purchase/purchase-orders/:id"
          />
        )}
        {data.approvedPurchaseOrdersAwaitingContainerAllocation && (
          <POTable
            title="Approved POs Awaiting Container Allocation"
            rows={data.approvedPurchaseOrdersAwaitingContainerAllocation}
            linkPath="/purchase/purchase-orders/:id"
          />
        )}
        {data.highValuePurchaseOrders && (
          <POTable
            title="High Value Purchase Orders"
            rows={data.highValuePurchaseOrders}
            linkPath="/purchase/purchase-orders/:id"
          />
        )}
        {data.overduePurchaseOrderPayments && (
          <OverduePaymentsTable rows={data.overduePurchaseOrderPayments} />
        )}
      </div>
    </div>
  );
};
