import { Card } from '../../../components/ui/Card';
import type { PaymentOperationsWorkspace, PaymentOperationsItem } from '../../../services/dashboardService';

interface PaymentOperationsTabProps {
  data: PaymentOperationsWorkspace | null;
  loading: boolean;
}

const MODULE_COLORS: Record<string, { header: string; bg: string }> = {
  'Clearing Payments': { header: 'bg-blue-500', bg: 'bg-blue-50' },
  'Ocean Freight Payments': { header: 'bg-teal-500', bg: 'bg-teal-50' },
  'Local Payments': { header: 'bg-orange-500', bg: 'bg-orange-50' },
};

const STAT_COLORS: Record<string, string> = {
  pending: 'text-yellow-600',
  requested: 'text-orange-600',
  approved: 'text-blue-600',
  paid: 'text-green-600',
  rejected: 'text-red-600',
};

const Stat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex flex-col items-center py-2 px-3">
    <span className={`text-xl font-bold ${color}`}>{(value ?? 0).toLocaleString()}</span>
    <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">{label}</span>
  </div>
);

const PaymentTable = ({ title, items }: { title: string; items: PaymentOperationsItem[] }) => {
  if (!items || items.length === 0) return null;
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--color-surface-secondary)]">
              <th className="text-left px-3 py-2 text-[var(--color-text-secondary)] font-medium">Container</th>
              <th className="text-left px-3 py-2 text-[var(--color-text-secondary)] font-medium">Party</th>
              <th className="text-right px-3 py-2 text-[var(--color-text-secondary)] font-medium">Amount</th>
              <th className="text-left px-3 py-2 text-[var(--color-text-secondary)] font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--color-surface-hover)]">
                <td className="px-3 py-2 font-mono text-[var(--color-text)]">{item.containerNumber}</td>
                <td className="px-3 py-2 text-[var(--color-text)]">{item.partyName}</td>
                <td className="px-3 py-2 text-right text-[var(--color-text)]">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STAT_COLORS[item.status.toLowerCase()] ?? 'text-gray-600'}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const PaymentOperationsTab = ({ data, loading }: PaymentOperationsTabProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <p className="text-sm">No payment operations data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.moduleCards && data.moduleCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.moduleCards.map((mod, i) => {
            const colors = MODULE_COLORS[mod.module] || { header: 'bg-gray-500', bg: 'bg-gray-50' };
            const cols = mod.cards?.length || 1;
            return (
              <Card key={i} padding="none" className="overflow-hidden">
                <div className={`${colors.header} px-4 py-2.5`}>
                  <h3 className="text-sm font-semibold text-white">{mod.module}</h3>
                </div>
                <div className={`${colors.bg} grid divide-x divide-gray-200`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {(mod.cards ?? []).map((card) => (
                    <Stat
                      key={card.key}
                      label={card.title}
                      value={card.value}
                      color={STAT_COLORS[card.key] ?? 'text-gray-700'}
                    />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PaymentTable title="Recent Clearing Payments" items={data.recentClearingPayments} />
        <PaymentTable title="Recent Ocean Freight Payments" items={data.recentOceanFreightPayments} />
        <PaymentTable title="Recent Local Payments" items={data.recentLocalPayments} />
      </div>
    </div>
  );
};
