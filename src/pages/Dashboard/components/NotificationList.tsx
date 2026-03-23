import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronRight, Bell } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { NotificationCenter, Notification } from '../../../services/dashboardService';

interface NotificationListProps {
  data: NotificationCenter;
}

const normalizeSeverity = (s: string): 'critical' | 'warning' | 'info' => {
  const lower = s.toLowerCase();
  if (lower === 'critical') return 'critical';
  if (lower === 'warning') return 'warning';
  return 'info';
};

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    icon: AlertCircle,
    badgeBg: '#FEE2E2',
    badgeText: '#DC2626',
    rowBg: 'hover:bg-red-50',
    dot: 'bg-red-500',
    headerBg: 'bg-red-50',
    headerBorder: 'border-red-200',
    headerText: 'text-red-700',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    rowBg: 'hover:bg-yellow-50',
    dot: 'bg-yellow-500',
    headerBg: 'bg-yellow-50',
    headerBorder: 'border-yellow-200',
    headerText: 'text-yellow-700',
  },
  info: {
    label: 'Info',
    icon: Info,
    badgeBg: '#DBEAFE',
    badgeText: '#1D4ED8',
    rowBg: 'hover:bg-blue-50',
    dot: 'bg-blue-500',
    headerBg: 'bg-blue-50',
    headerBorder: 'border-blue-200',
    headerText: 'text-blue-700',
  },
};

interface NotificationGroupProps {
  severity: 'critical' | 'warning' | 'info';
  notifications: Notification[];
}

const NotificationGroup = ({ severity, notifications }: NotificationGroupProps) => {
  const [collapsed, setCollapsed] = useState(severity === 'info');
  const navigate = useNavigate();
  const config = SEVERITY_CONFIG[severity];
  const Icon = config.icon;

  if (notifications.length === 0) return null;

  return (
    <div className={`border rounded-lg overflow-hidden ${config.headerBorder}`}>
      <button
        className={`w-full flex items-center justify-between px-4 py-2.5 ${config.headerBg} ${config.headerText} transition-colors`}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-semibold">{config.label}</span>
          <span
            className="px-1.5 py-0.5 text-xs font-bold rounded-full"
            style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
          >
            {notifications.length}
          </span>
        </div>
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {!collapsed && (
        <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
          {notifications.map((n, idx) => (
            <div
              key={`${n.entityType}-${n.entityId}-${idx}`}
              className={`px-4 py-3 cursor-pointer transition-colors ${config.rowBg}`}
              onClick={() => n.actionPath && navigate(n.actionPath)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${config.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{n.title}</p>
                    {n.referenceNo && (
                      <span className="text-xs text-gray-400 flex-shrink-0 font-mono">{n.referenceNo}</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{n.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.eventDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const NotificationList = ({ data }: NotificationListProps) => {
  const groups = data.groups ?? [];
  const getItems = (sev: string) =>
    groups.find((g) => g.severity.toLowerCase() === sev)?.items ?? [];
  const criticals = getItems('critical');
  const warnings = getItems('warning');
  const infos = getItems('info');

  return (
    <Card padding="none" className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[var(--color-text)]" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">Notification Center</h2>
        </div>
        <div className="flex items-center gap-2">
          {data.criticalCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
              {data.criticalCount} critical
            </span>
          )}
          {data.warningCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">
              {data.warningCount} warnings
            </span>
          )}
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-600">
            {data.totalCount} total
          </span>
        </div>
      </div>

      {data.totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Bell className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          <NotificationGroup severity="critical" notifications={criticals} />
          <NotificationGroup severity="warning" notifications={warnings} />
          <NotificationGroup severity="info" notifications={infos} />
        </div>
      )}
    </Card>
  );
};
