import { DashboardChart } from '../components/DashboardChart';
import { DataTable } from '../components/DataTable';
import type { LogisticsWorkspace } from '../../../services/dashboardService';

interface LogisticsTabProps {
  data: LogisticsWorkspace | null;
  loading: boolean;
}

export const LogisticsTab = ({ data, loading }: LogisticsTabProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
        ))}
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

  const charts = data.widgets.filter((w) => w.widgetType === 'chart' && w.chart);
  const tables = data.widgets.filter((w) => w.widgetType === 'table' && w.table);

  return (
    <div className="space-y-4">
      {charts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {charts.map((w) => w.chart && <DashboardChart key={w.widgetId} data={w.chart} />)}
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
