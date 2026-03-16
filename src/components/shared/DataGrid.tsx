import { ReactNode } from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '../ui/Button';

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: unknown, item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
}

export const DataGrid = <T,>({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
  emptyMessage = 'No data available',
  keyExtractor,
}: DataGridProps<T>) => {
  const hasActions = !!(onEdit || onDelete || onView);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-text-secondary)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-left py-2 md:py-3 px-3 md:px-4 text-xs md:text-sm font-semibold text-[var(--color-text)]"
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
            {hasActions && (
              <th className="text-left py-2 md:py-3 px-3 md:px-4 text-xs md:text-sm font-semibold text-[var(--color-text)] w-24 md:w-32">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors"
            >
              {columns.map((column) => {
                const value = (item as Record<string, unknown>)[column.key];
                return (
                  <td key={column.key} className="py-2 md:py-3 px-3 md:px-4 text-xs md:text-sm text-[var(--color-text)]">
                    {column.render ? column.render(value, item) : String(value ?? '')}
                  </td>
                );
              })}
              {hasActions && (
                <td className="py-2 md:py-3 px-3 md:px-4">
                  <div className="flex items-center gap-1 md:gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        className="p-1 text-[var(--color-info)] hover:bg-[var(--color-border)] rounded transition-colors"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-[var(--color-primary)] hover:bg-[var(--color-border)] rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1 text-[var(--color-error)] hover:bg-[var(--color-border)] rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
