import { ReactNode } from 'react';
import { DynamicTable, TableDescriptor } from './DynamicTable';
import { DynamicForm, FormDescriptor } from './DynamicForm';

export type ComponentType = 'table' | 'form' | 'card' | 'chart';

export interface ComponentDescriptor {
  type: ComponentType;
  id: string;
  title?: string;
  descriptor: TableDescriptor | FormDescriptor | Record<string, unknown>;
}

interface DynamicRendererProps {
  components: ComponentDescriptor[];
  onAction?: (actionType: string, data: unknown) => void;
}

export const DynamicRenderer = ({ components, onAction }: DynamicRendererProps) => {
  const renderComponent = (component: ComponentDescriptor): ReactNode => {
    switch (component.type) {
      case 'table':
        return (
          <DynamicTable
            key={component.id}
            descriptor={component.descriptor as TableDescriptor}
            onAction={onAction}
          />
        );

      case 'form':
        return (
          <DynamicForm
            key={component.id}
            descriptor={component.descriptor as FormDescriptor}
            onSubmit={(data) => onAction?.('submit', data)}
          />
        );

      case 'card':
        return (
          <div
            key={component.id}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              {component.title || 'Card'}
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              Card rendering not yet implemented
            </p>
          </div>
        );

      case 'chart':
        return (
          <div
            key={component.id}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              {component.title || 'Chart'}
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              Chart rendering not yet implemented
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {components.map((component) => renderComponent(component))}
    </div>
  );
};
