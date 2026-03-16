import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sessionExpired = searchParams.get('sessionExpired') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('🚀 LoginPage: Submitting login form...');
      setError('');
      await login(data);
      console.log('✅ LoginPage: Login successful');

      const from = (location.state as any)?.from?.pathname || '/dashboard';
      console.log('✅ LoginPage: Navigating to:', from);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('❌ LoginPage: Login error:', err);
      setError((err as Error).message || 'Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] rounded-lg shadow-xl w-full max-w-md p-6 md:p-8">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-[var(--color-secondary)] rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <LogIn className="w-7 h-7 md:w-8 md:h-8 text-[var(--color-primary)]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">Welcome Back</h1>
          <p className="text-sm md:text-base text-[var(--color-text-secondary)] mt-2">
            Sign in to Import Management System
          </p>
        </div>

        {sessionExpired && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-400 rounded-md">
            <p className="text-xs md:text-sm text-yellow-800">
              Your session has expired. Please sign in again.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-[var(--color-error)] rounded-md">
            <p className="text-xs md:text-sm text-[var(--color-error)]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-[var(--color-text)] mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 text-sm md:text-base border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)]"
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs md:text-sm text-[var(--color-error)]">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-[var(--color-text)] mb-1">
              Password
            </label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 text-sm md:text-base border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)]"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-xs md:text-sm text-[var(--color-error)]">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" fullWidth disabled={isSubmitting} className="mt-6 text-sm md:text-base">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 md:mt-6 text-center text-xs md:text-sm text-[var(--color-text-secondary)]">
          <p>Laduma Hardware Import Management</p>
        </div>
      </div>
    </div>
  );
};
