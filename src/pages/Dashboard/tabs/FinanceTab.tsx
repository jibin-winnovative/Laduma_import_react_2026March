import { useNavigate } from 'react-router-dom';
import { DashboardChart } from '../components/DashboardChart';
import { Card } from '../../../components/ui/Card';
import type { FinanceWorkspace, FinancePaymentRequest } from '../../../services/dashboardService';

interface FinanceTabProps {
  data: FinanceWorkspace | null;
  loading: boolean;
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  requested: { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#DBEAFE', text: '#1D4ED8' },
  paid: { bg: '#D1FAE5', text: '#047857' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

const getBadgeStyle = (status: string) => {
  const key = (status || '').toLowerCase().trim();
  return STATUS_BADGE[key] || { bg: '#F3F4F6', text: '#374151' };
};

const MODULE_LABELS: Record<string, string> = {
  Purchase: 'Purchase',
  OceanFreightPayment: 'Ocean Freight',
  LocalPayment: 'Local Payment',
  ClearingPayment: 'Clearing',
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

const SOURCE_MODULE_ROUTES: Record<string, string> = {
  Purchase: '/purchase-orders',
  OceanFreightPayment: '/ocean-freight',
  LocalPayment: '/local-payments',
  ClearingPayment: '/clearing-payments',
};

interface RequestTableProps {
  title: string;
  rows: FinancePaymentRequest[];
  showOverdue?: boolean;
}

const RequestTable = ({ title, rows, showOverdue }: RequestTableProps) => {
  const navigate = useNavigate();

  const handleRowClick = (row: FinancePaymentRequest) => {
    const base = SOURCE_MODULE_ROUTES[row.sourceModule];
    if (base && row.paymentRequestId) {
      navigate(`/accounts-payable/${row.paymentRequestId}`);
    }
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Vendor</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Module</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Amount</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Due Date</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Status</th>
              {showOverdue && (
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">Days Overdue</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showOverdue ? 6 : 5} className="px-4 py-6 text-center text-sm text-gray-400">
                  No data available
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const badge = getBadgeStyle(row.status);
                const moduleLabel = MODULE_LABELS[row.sourceModule] || row.sourceModule;
                return (
                  <tr
                    key={`${row.paymentRequestId}-${idx}`}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(row)}
                  >
                    <td className="px-3 py-2 text-sm text-[var(--color-text)] font-medium max-w-[160px] truncate">
                      {row.vendorName}
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                      {moduleLabel}
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text)] font-semibold text-right whitespace-nowrap">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                      {formatDate(row.dueDate)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {row.status}
                      </span>
                    </td>
                    {showOverdue && (
                      <td className="px-3 py-2 text-sm font-semibold text-right whitespace-nowrap">
                        {row.daysOverdue != null ? (
                          <span className="text-red-600">{row.daysOverdue}d</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
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

export const FinanceTab = ({ data, loading }: FinanceTabProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <p className="text-sm">No finance data available</p>
      </div>
    );
  }

  const KPI_COLORS: Record<string, string> = {
    paymentRequestsPendingApproval: '#F59E0B',
    paymentRequestsApprovedUnpaid: '#3B82F6',
    paymentRequestsPaidThisMonth: '#10B981',
    paymentRequestsRejectedThisMonth: '#EF4444',
    paymentRequestsApprovedUnpaidAmount: '#0EA5E9',
    paymentRequestsOverdueAmount: '#DC2626',
  };

  const isAmount = (key: string) => key.toLowerCase().includes('amount');

  return (
    <div className="space-y-5">
      {data.widgets && data.widgets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.widgets.map((w) => {
            const color = KPI_COLORS[w.key] || '#3B82F6';
            return (
              <Card key={w.key} className="p-3">
                <p className="text-xs text-[var(--color-text-secondary)] leading-tight">{w.title}</p>
                <p className="text-xl font-bold mt-1 truncate" style={{ color }}>
                  {isAmount(w.key) ? `$${w.displayValue}` : w.displayValue}
                </p>
                {w.subtitle && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{w.subtitle}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.paymentRequestStatusDistribution && <DashboardChart data={data.paymentRequestStatusDistribution} />}
        {data.payableTrend && <DashboardChart data={data.payableTrend} />}
        {data.payableBySourceModule && <DashboardChart data={data.payableBySourceModule} />}
        {data.vendorExposure && <DashboardChart data={data.vendorExposure} />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {data.pendingApprovalRequests && (
          <RequestTable title="Pending Approval" rows={data.pendingApprovalRequests} />
        )}
        {data.approvedUnpaidRequests && (
          <RequestTable title="Approved — Awaiting Payment" rows={data.approvedUnpaidRequests} />
        )}
        {data.overdueRequests && (
          <RequestTable title="Overdue Requests" rows={data.overdueRequests} showOverdue />
        )}
        {data.recentlyPaidRequests && (
          <RequestTable title="Recently Paid" rows={data.recentlyPaidRequests} />
        )}
      </div>
    </div>
  );
};
