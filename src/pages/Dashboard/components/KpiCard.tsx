import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { KpiCard as KpiCardType } from '../../../services/dashboardService';

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  teal: 'bg-teal-500',
  gray: 'bg-gray-500',
  primary: 'bg-[var(--color-primary)]',
  secondary: 'bg-[var(--color-secondary)]',
  accent: 'bg-[var(--color-accent)]',
};

interface KpiCardProps {
  kpi: KpiCardType;
}

export const KpiCard = ({ kpi }: KpiCardProps) => {
  const bgClass = COLOR_MAP[kpi.color || 'blue'] || 'bg-blue-500';

  const TrendIcon =
    kpi.trendDirection === 'up'
      ? TrendingUp
      : kpi.trendDirection === 'down'
      ? TrendingDown
      : Minus;

  const trendColor =
    kpi.trendDirection === 'up'
      ? 'text-green-600'
      : kpi.trendDirection === 'down'
      ? 'text-red-600'
      : 'text-gray-500';

  return (
    <Card padding="none" className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--color-text-secondary)] truncate">{kpi.title}</p>
          <p className="text-2xl font-bold text-[var(--color-text)] mt-1 truncate">
            {kpi.displayValue || kpi.value}
          </p>
          {kpi.subtitle && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{kpi.subtitle}</p>
          )}
          {kpi.trend && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{kpi.trend}</span>
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClass}`}>
          <span className="text-white text-base font-bold select-none">
            {kpi.title.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </Card>
  );
};
