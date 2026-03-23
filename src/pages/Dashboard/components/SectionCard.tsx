import { ReactNode } from 'react';
import { Card } from '../../../components/ui/Card';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export const SectionCard = ({ title, subtitle, children, className = '', action }: SectionCardProps) => (
  <Card padding="none" className={`p-4 ${className}`}>
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
    {children}
  </Card>
);
