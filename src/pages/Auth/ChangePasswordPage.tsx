import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { authService } from '../../services/authService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .min(6, 'Password must be at least 6 characters'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const ChangePasswordPage = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setError('');
      setSuccess(false);
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
      reset();
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err: any) {
      console.error('Change password error:', err);

      // Handle API error response format: { success, message, data, errors }
      if (err.response?.data) {
        const errorData = err.response.data;

        // If errors array exists, join them
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          setError(errorData.errors.join('. '));
        }
        // Otherwise use the message field
        else if (errorData.message) {
          setError(errorData.message);
        }
        // Fallback to generic error
        else {
          setError('Failed to change password');
        }
      }
      // Handle other error types
      else if (err.message) {
        setError(err.message);
      }
      else {
        setError('Failed to change password');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-[var(--color-text)] mb-6">Change Password</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-[var(--color-primary)]" />
            <CardTitle>Update Your Password</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-[var(--color-error)] rounded-md">
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-[var(--color-success)] rounded-md">
              <p className="text-sm text-[var(--color-success)]">
                Password changed successfully! Redirecting...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Current Password
              </label>
              <input
                type="password"
                {...register('currentPassword')}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)]"
                placeholder="Enter current password"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-[var(--color-error)]">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                New Password
              </label>
              <input
                type="password"
                {...register('newPassword')}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)]"
                placeholder="Enter new password"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-[var(--color-error)]">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)]"
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-[var(--color-error)]">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => navigate('/profile')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
