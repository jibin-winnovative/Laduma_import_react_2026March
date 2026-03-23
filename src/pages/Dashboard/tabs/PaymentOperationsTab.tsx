import { Card } from '../../../components/ui/Card';
import { DataTable } from '../components/DataTable';
import type { PaymentOperationsWorkspace } from '../../../services/dashboardService';

interface PaymentOperationsTabProps {
  data: PaymentOperationsWorkspace | null;
  loading: boolean;
}

const MODULE_COLORS: Record<string, { header: string; bg: string }> = {
  'Clearing Payments': { header: 'bg-blue-500', bg: 'bg-blue-50' },
  'Ocean Freight Payments': { header: 'bg-teal-500', bg: 'bg-teal-50' },
  'Local Payments': { header: 'bg-orange-500', bg: 'bg-orange-50' },
};

const Stat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex flex-col items-center py-2 px-3">
    <span className={`text-xl font-bold ${color}`}>{value.toLocaleString()}</span>
    <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">{label}</span>
  </div>
);

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
        <p className="text-sm">No payment operations data available</p>
      </div>
    );
  }

  const tables = data.widgets?.filter((w) => w.widgetType === 'table' && w.table) || [];

  return (
    <div className="space-y-4">
      {data.moduleCards && data.moduleCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.moduleCards.map((mod, i) => {
            const colors = MODULE_COLORS[mod.moduleName] || { header: 'bg-gray-500', bg: 'bg-gray-50' };
            return (
              <Card key={i} padding="none" className="overflow-hidden">
                <div className={`${colors.header} px-4 py-2.5`}>
                  <h3 className="text-sm font-semibold text-white">{mod.moduleName}</h3>
                </div>
                <div className={`${colors.bg} grid grid-cols-4 divide-x divide-gray-200`}>
                  <Stat label="Pending" value={mod.pending} color="text-yellow-600" />
                  <Stat label="Approved" value={mod.approved} color="text-blue-600" />
                  <Stat label="Paid" value={mod.paid} color="text-green-600" />
                  <Stat label="Rejected" value={mod.rejected} color="text-red-600" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tables.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {tables.map((w) => w.table && <DataTable key={w.widgetId} table={w.table} compact />)}
        </div>
      )}
    </div>
  );
};
