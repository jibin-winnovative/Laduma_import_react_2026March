import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { DashboardTable, TableRow } from '../../../services/dashboardService';

interface DataTableProps {
  table: DashboardTable;
  compact?: boolean;
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#374151' },
  approved: { bg: '#D1FAE5', text: '#047857' },
  submitted: { bg: '#DBEAFE', text: '#1D4ED8' },
  pending: { bg: '#FEF3C7', text: '#92400E' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
  paid: { bg: '#D1FAE5', text: '#047857' },
  completed: { bg: '#D1FAE5', text: '#047857' },
  canceled: { bg: '#FEE2E2', text: '#DC2626' },
  received: { bg: '#D1FAE5', text: '#047857' },
  booked: { bg: '#DBEAFE', text: '#1D4ED8' },
  'in transit': { bg: '#FED7AA', text: '#C2410C' },
  overdue: { bg: '#FEE2E2', text: '#DC2626' },
};

const getBadgeStyle = (value: string) => {
  const key = (value || '').toLowerCase().trim();
  return BADGE_COLORS[key] || { bg: '#F3F4F6', text: '#374151' };
};

const formatCellValue = (value: TableRow[string], type?: string): string => {
  if (value === null || value === undefined) return '—';
  if (type === 'currency') {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return '—';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (type === 'date') {
    try {
      return new Date(String(value)).toLocaleDateString();
    } catch {
      return String(value);
    }
  }
  return String(value);
};

export const DataTable = ({ table, compact = false }: DataTableProps) => {
  const navigate = useNavigate();

  const handleRowClick = (row: TableRow) => {
    if (table.linkKey && table.linkPath && row[table.linkKey]) {
      const path = table.linkPath.replace(':id', String(row[table.linkKey]));
      navigate(path);
    }
  };

  const isClickable = !!(table.linkKey && table.linkPath);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{table.title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              {table.columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
                >
                  {col.label}
                </th>
              ))}
              {isClickable && <th className={compact ? 'px-3 py-2' : 'px-4 py-3'} />}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.columns.length + (isClickable ? 1 : 0)}
                  className="px-4 py-6 text-center text-sm text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              table.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={`hover:bg-gray-50 transition-colors ${isClickable ? 'cursor-pointer' : ''}`}
                  onClick={() => handleRowClick(row)}
                >
                  {table.columns.map((col) => (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap text-sm ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
                    >
                      {col.type === 'badge' ? (
                        <span
                          className="px-2 py-0.5 text-xs font-semibold rounded"
                          style={(() => {
                            const style = getBadgeStyle(String(row[col.key] ?? ''));
                            return { backgroundColor: style.bg, color: style.text };
                          })()}
                        >
                          {formatCellValue(row[col.key], col.type)}
                        </span>
                      ) : col.type === 'link' ? (
                        <span className="text-blue-600 font-medium">
                          {formatCellValue(row[col.key], col.type)}
                        </span>
                      ) : col.type === 'currency' ? (
                        <span className="text-[var(--color-text)] font-medium">
                          {formatCellValue(row[col.key], col.type)}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text)]">
                          {formatCellValue(row[col.key], col.type)}
                        </span>
                      )}
                    </td>
                  ))}
                  {isClickable && (
                    <td className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
