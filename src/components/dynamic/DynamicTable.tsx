import { useQuery } from '@tanstack/react-query';
import { DataGrid, Column } from '../shared/DataGrid';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';
import { api } from '../../services/apiClient';

export interface TableDescriptor {
  title: string;
  endpoint: string;
  columns: Array<{
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'boolean';
    format?: (value: unknown) => string;
  }>;
  actions?: {
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    view?: boolean;
  };
  keyField?: string;
}

interface DynamicTableProps {
  descriptor: TableDescriptor;
  onAction?: (actionType: string, data?: unknown) => void;
}

export const DynamicTable = ({ descriptor, onAction }: DynamicTableProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [descriptor.endpoint],
    queryFn: () => api.get<unknown[]>(descriptor.endpoint),
  });

  const columns: Column<Record<string, unknown>>[] = descriptor.columns.map((col) => ({
    key: col.key,
    label: col.label,
    render: col.format
      ? (value: unknown) => col.format!(value)
      : col.type === 'date'
      ? (value: unknown) =>
          value ? new Date(value as string).toLocaleDateString() : ''
      : col.type === 'boolean'
      ? (value: unknown) => (value ? 'Yes' : 'No')
      : undefined,
  }));

  const keyExtractor = (item: Record<string, unknown>) =>
    String(item[descriptor.keyField || 'id']);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{descriptor.title}</CardTitle>
          {descriptor.actions?.create && (
            <Button
              onClick={() => onAction?.('create')}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-[var(--color-error)] text-center py-4">
            Error loading data: {(error as Error).message}
          </div>
        ) : (
          <DataGrid
            data={(data as Record<string, unknown>[]) || []}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={keyExtractor}
            onEdit={descriptor.actions?.edit ? (item) => onAction?.('edit', item) : undefined}
            onDelete={descriptor.actions?.delete ? (item) => onAction?.('delete', item) : undefined}
            onView={descriptor.actions?.view ? (item) => onAction?.('view', item) : undefined}
          />
        )}
      </CardContent>
    </Card>
  );
};
