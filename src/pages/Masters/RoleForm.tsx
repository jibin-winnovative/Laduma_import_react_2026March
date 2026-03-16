import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { rolesService, Role } from '../../services/rolesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const roleSchema = z.object({
  roleId: z.number().optional(),
  roleName: z
    .string()
    .min(1, 'Role Name is required')
    .max(50, 'Role Name must be 50 characters or less'),
  description: z.string().max(200, 'Description must be 200 characters or less').optional().or(z.literal('')),
  isActive: z.boolean(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  mode: 'add' | 'edit';
  roleId?: number;
  onClose: () => void;
  onSuccess?: (roleId?: number) => void;
}

export const RoleForm = ({ mode, roleId, onClose, onSuccess }: RoleFormProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [checkingName, setCheckingName] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      isActive: true,
      roleName: '',
      description: '',
    },
  });

  const roleName = watch('roleName');

  useEffect(() => {
    if (mode === 'edit' && roleId) {
      fetchRoleData();
    }
  }, [mode, roleId]);

  useEffect(() => {
    if (roleName && roleName.length > 0) {
      const timer = setTimeout(() => {
        checkNameUniqueness(roleName);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('roleName');
    }
  }, [roleName]);

  const fetchRoleData = async () => {
    if (!roleId) return;

    setInitialLoading(true);
    try {
      const role = await rolesService.getById(roleId);
      setValue('roleName', role.roleName);
      setValue('description', role.description || '');
      setValue('isActive', role.isActive);
    } catch (error) {
      console.error('Failed to fetch role data:', error);
      alert('Failed to load role data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkNameUniqueness = async (nameValue: string) => {
    if (!nameValue) return;

    setCheckingName(true);
    clearErrors('roleName');

    try {
      const exists = await rolesService.checkRoleNameExists(nameValue, mode === 'edit' ? roleId : undefined);

      if (exists) {
        setError('roleName', { message: 'This Role Name is already in use' });
      }
    } catch (error) {
      console.error('Failed to check role name:', error);
    } finally {
      setCheckingName(false);
    }
  };

  const onSubmit = async (data: RoleFormData) => {
    if (errors.roleName) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        roleName: data.roleName,
        description: data.description || null,
        isActive: data.isActive,
      };

      let createdRoleId: number | undefined;

      if (mode === 'add') {
        const createdRole = await rolesService.create(payload);
        createdRoleId = createdRole.roleId;
        alert('Role created successfully!');
      } else if (mode === 'edit' && roleId) {
        await rolesService.update(roleId, payload);
        alert('Role updated successfully!');
      }

      if (onSuccess) {
        onSuccess(createdRoleId);
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save role:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save role';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-2xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  {mode === 'add' ? 'Add New Role' : 'Edit Role'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add' ? 'Create a new role for the system' : 'Update role information'}
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="secondary"
                className="bg-gray-600 hover:bg-gray-700 text-white flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 md:p-8" style={{ backgroundColor: '#F9FAFB' }}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Role Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('roleName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter role name (e.g., Administrator, Manager)"
                          autoFocus
                        />
                        {checkingName && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                          </div>
                        )}
                      </div>
                      {errors.roleName && (
                        <p className="text-red-500 text-sm mt-1">{errors.roleName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Brief description of the role and its responsibilities"
                      />
                      {errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Status
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        {...register('isActive')}
                        className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                      />
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">
                          Active Status
                        </label>
                        <p className="text-xs text-gray-500">
                          Enable this to make the role active and available for assignment
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-300">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || checkingName || !!errors.roleName}
                  className="bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {mode === 'edit' ? 'Update' : 'Save'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};
