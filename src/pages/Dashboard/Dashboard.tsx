import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Users, Building2, Ship, FileText, TrendingUp, Package } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: typeof Users;
  trend?: string;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, trend, color }: StatCardProps) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">{title}</p>
          <p className="text-3xl font-bold text-[var(--color-text)]">{value}</p>
          {trend && (
            <p className="text-sm text-[var(--color-success)] mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Employees',
      value: '124',
      icon: Users,
      trend: '+12% this month',
      color: 'bg-blue-500',
    },
    {
      title: 'Active Companies',
      value: '48',
      icon: Building2,
      trend: '+5% this month',
      color: 'bg-[var(--color-primary)]',
    },
    {
      title: 'Shipments',
      value: '89',
      icon: Ship,
      trend: '+18% this month',
      color: 'bg-[var(--color-accent)]',
    },
    {
      title: 'Documents',
      value: '432',
      icon: FileText,
      trend: '+24% this month',
      color: 'bg-[var(--color-secondary)]',
    },
  ];

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-sm md:text-base text-[var(--color-text-secondary)] mt-2">
          Here's what's happening with your imports today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New shipment added', time: '2 hours ago', icon: Ship },
                { action: 'Employee updated', time: '4 hours ago', icon: Users },
                { action: 'Company registered', time: '1 day ago', icon: Building2 },
                { action: 'Document uploaded', time: '2 days ago', icon: FileText },
              ].map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 pb-3 border-b border-[var(--color-border)] last:border-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--color-background)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {activity.action}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Add Employee', icon: Users, path: '/masters/employees' },
                { label: 'New Company', icon: Building2, path: '/masters/companies' },
                { label: 'Register Shipment', icon: Ship, path: '/masters/shipping-companies' },
                { label: 'Upload Document', icon: FileText, path: '/masters/import-docs' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="p-3 md:p-4 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-background)] transition-colors text-left"
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-[var(--color-primary)] mb-2" />
                    <p className="text-xs md:text-sm font-medium text-[var(--color-text)]">{action.label}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
