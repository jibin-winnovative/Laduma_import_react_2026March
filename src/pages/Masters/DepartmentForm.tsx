import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { departmentsService, Department } from '../../services/departmentsService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const departmentSchema = z.object({
  departmentId: z.number().optional(),
  departmentName: z
    .string()
    .min(1, 'Department Name is required')
    .max(200, 'Department Name must be 200 characters or less'),
  isActive: z.boolean(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  mode: 'add' | 'edit';
  departmentId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DepartmentForm = ({ mode, departmentId, onClose, onSuccess }: DepartmentFormProps) => {
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
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      isActive: true,
      departmentName: '',
    },
  });

  const departmentName = watch('departmentName');

  useEffect(() => {
    if (mode === 'edit' && departmentId) {
      fetchDepartmentData();
    }
  }, [mode, departmentId]);

  useEffect(() => {
    if (departmentName && departmentName.length > 0) {
      const timer = setTimeout(() => {
        checkNameUniqueness(departmentName);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('departmentName');
    }
  }, [departmentName]);

  const fetchDepartmentData = async () => {
    if (!departmentId) return;

    setInitialLoading(true);
    try {
      const department = await departmentsService.getById(departmentId);
      setValue('departmentName', department.departmentName);
      setValue('isActive', department.isActive);
    } catch (error) {
      console.error('Failed to fetch department data:', error);
      alert('Failed to load department data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkNameUniqueness = async (nameValue: string) => {
    if (!nameValue) return;

    setCheckingName(true);
    clearErrors('departmentName');

    try {
      const params: { name: string; excludeId?: number } = { name: nameValue };
      if (mode === 'edit' && departmentId) {
        params.excludeId = departmentId;
      }

      const exists = await departmentsService.checkNameExists(params.name, params.excludeId);

      if (exists) {
        setError('departmentName', { message: 'Department name already exists' });
      }
    } catch (error) {
      console.error('Failed to check name uniqueness:', error);
    } finally {
      setCheckingName(false);
    }
  };

  const onSubmit = async (data: DepartmentFormData) => {
    if (errors.departmentName) {
      return;
    }

    setLoading(true);
    try {
      if (mode === 'add') {
        await departmentsService.create({
          departmentName: data.departmentName,
        });
        alert('Department created successfully!');
      } else if (mode === 'edit' && departmentId) {
        await departmentsService.update(departmentId, {
          departmentName: data.departmentName,
          isActive: data.isActive,
        });
        alert('Department updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save department:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save department';
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
                  {mode === 'add' ? 'Add New Department' : 'Edit Department'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add'
                    ? 'Create a new department record'
                    : 'Update department information'}
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
                    Department Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('departmentName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter department name"
                          autoFocus
                        />
                        {checkingName && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                          </div>
                        )}
                      </div>
                      {errors.departmentName && (
                        <p className="text-red-500 text-sm mt-1">{errors.departmentName.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {mode === 'edit' && (
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
                            Enable this to make the department active
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                  disabled={loading || checkingName || !!errors.departmentName}
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
