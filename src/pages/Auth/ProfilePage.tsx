import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) return null;

  const profileFields = [
    { icon: User, label: 'Username', value: user.username },
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Shield, label: 'Role', value: user.role },
    {
      icon: Calendar,
      label: 'Member Since',
      value: new Date(user.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-[var(--color-text)] mb-6">Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-[var(--color-primary)] text-3xl font-bold">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <CardTitle>{user.username}</CardTitle>
              <p className="text-[var(--color-text-secondary)] mt-1">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {profileFields.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
                <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
                  <p className="text-base font-medium text-[var(--color-text)]">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-[var(--color-background)] rounded-md">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Status: <span className={user.isActive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
