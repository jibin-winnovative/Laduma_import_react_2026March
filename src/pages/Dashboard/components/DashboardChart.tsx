import { Card } from '../../../components/ui/Card';
import type { DashboardChartData } from '../../../services/dashboardService';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280',
];

interface DashboardChartProps {
  data: DashboardChartData;
  className?: string;
}

const BarChart = ({ data }: { data: DashboardChartData }) => {
  const allPoints = data.series.flatMap((s) => s.points);
  const maxValue = Math.max(...allPoints.map((p) => p.value), 1);

  if (data.series.length === 1) {
    const points = data.series[0].points;
    return (
      <div className="space-y-2 mt-2">
        {points.map((point, i) => {
          const pct = Math.max((point.value / maxValue) * 100, 2);
          const color = point.color || data.series[0].color || COLORS[i % COLORS.length];
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-secondary)] w-28 truncate text-right flex-shrink-0">
                {point.label}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center px-2 transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                >
                  <span className="text-white text-xs font-medium truncate">{point.value.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const labels = data.series[0]?.points.map((p) => p.label) || [];
  return (
    <div className="mt-2">
      <div className="flex items-end gap-1 h-32">
        {labels.map((label, li) => (
          <div key={li} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex items-end justify-center gap-0.5" style={{ height: '100px' }}>
              {data.series.map((series, si) => {
                const point = series.points[li];
                if (!point) return null;
                const pct = Math.max((point.value / maxValue) * 100, 2);
                const color = series.color || COLORS[si % COLORS.length];
                return (
                  <div
                    key={si}
                    className="flex-1 rounded-t transition-all duration-500"
                    style={{ height: `${pct}%`, backgroundColor: color }}
                    title={`${series.name}: ${point.value.toLocaleString()}`}
                  />
                );
              })}
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] truncate w-full text-center">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {data.series.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color || COLORS[i % COLORS.length] }} />
            <span className="text-xs text-[var(--color-text-secondary)]">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChart = ({ data }: { data: DashboardChartData }) => {
  const allValues = data.series.flatMap((s) => s.points.map((p) => p.value));
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const range = maxValue - minValue || 1;
  const HEIGHT = 80;
  const labels = data.series[0]?.points.map((p) => p.label) || [];

  return (
    <div className="mt-2">
      <svg width="100%" height={HEIGHT + 20} viewBox={`0 0 300 ${HEIGHT + 20}`} preserveAspectRatio="none">
        {data.series.map((series, si) => {
          const color = series.color || COLORS[si % COLORS.length];
          const pts = series.points;
          if (pts.length < 2) return null;
          const step = 300 / (pts.length - 1);
          const points = pts.map((p, i) => {
            const x = i * step;
            const y = HEIGHT - ((p.value - minValue) / range) * HEIGHT;
            return `${x},${y}`;
          });
          const polyline = points.join(' ');
          const areaPoints = `0,${HEIGHT} ${polyline} ${300},${HEIGHT}`;
          return (
            <g key={si}>
              <polyline
                points={areaPoints}
                fill={color}
                fillOpacity="0.08"
                stroke="none"
              />
              <polyline
                points={polyline}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.map((p, i) => {
                const x = i * step;
                const y = HEIGHT - ((p.value - minValue) / range) * HEIGHT;
                return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
              })}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {labels.map((l, i) => (
          <span key={i} className="text-xs text-[var(--color-text-secondary)] truncate">{l}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-1">
        {data.series.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color || COLORS[i % COLORS.length] }} />
            <span className="text-xs text-[var(--color-text-secondary)]">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DonutChart = ({ data }: { data: DashboardChartData }) => {
  const allPoints = data.series.flatMap((s) => s.points);
  const total = allPoints.reduce((sum, p) => sum + p.value, 0) || 1;
  const SIZE = 100;
  const R = 38;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  let cumAngle = -Math.PI / 2;

  const slices = allPoints.map((p, i) => {
    const angle = (p.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cumAngle);
    const y1 = cy + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + R * Math.cos(cumAngle);
    const y2 = cy + R * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const color = p.color || COLORS[i % COLORS.length];
    return { x1, y1, x2, y2, largeArc, color, label: p.label, value: p.value };
  });

  return (
    <div className="mt-2 flex items-center gap-4">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="flex-shrink-0">
        {slices.map((s, i) => (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${s.x1} ${s.y1} A ${R} ${R} 0 ${s.largeArc} 1 ${s.x2} ${s.y2} Z`}
            fill={s.color}
            stroke="white"
            strokeWidth="1"
          />
        ))}
        <circle cx={cx} cy={cy} r={R * 0.55} fill="white" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="bold" fill="#374151">
          {total.toLocaleString()}
        </text>
      </svg>
      <div className="flex-1 space-y-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-[var(--color-text-secondary)] truncate flex-1">{s.label}</span>
            <span className="text-xs font-semibold text-[var(--color-text)]">{s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FunnelChart = ({ data }: { data: DashboardChartData }) => {
  const points = data.series[0]?.points || [];
  const maxValue = Math.max(...points.map((p) => p.value), 1);

  return (
    <div className="space-y-1.5 mt-2">
      {points.map((point, i) => {
        const pct = Math.max((point.value / maxValue) * 100, 8);
        const color = point.color || COLORS[i % COLORS.length];
        const marginPct = (100 - pct) / 2;
        return (
          <div key={i} className="flex flex-col items-center">
            <div
              className="h-7 rounded flex items-center justify-center transition-all duration-500"
              style={{ width: `${pct}%`, marginLeft: `${marginPct}%`, marginRight: `${marginPct}%`, backgroundColor: color }}
            >
              <span className="text-white text-xs font-medium truncate px-2">
                {point.label}: {point.value.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const DashboardChart = ({ data, className = '' }: DashboardChartProps) => {
  if (!data) return null;

  return (
    <Card padding="none" className={`p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">{data.title}</h3>
      {data.chartType === 'bar' && <BarChart data={data} />}
      {data.chartType === 'line' && <LineChart data={data} />}
      {data.chartType === 'donut' && <DonutChart data={data} />}
      {data.chartType === 'funnel' && <FunnelChart data={data} />}
    </Card>
  );
};
