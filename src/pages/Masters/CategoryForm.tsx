import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { categoriesService, Category } from '../../services/categoriesService';
import { departmentsService } from '../../services/departmentsService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const categorySchema = z.object({
  categoryId: z.number().optional(),
  categoryName: z
    .string()
    .min(1, 'Category Name is required')
    .max(200, 'Category Name must be 200 characters or less'),
  departmentId: z.number().min(1, 'Department is required'),
  description: z.string().max(200, 'Description must be 200 characters or less').optional().or(z.literal('')),
  isActive: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  mode: 'add' | 'edit';
  categoryId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Department {
  departmentId: number;
  departmentName: string;
  isActive?: boolean;
}

export const CategoryForm = ({ mode, categoryId, onClose, onSuccess }: CategoryFormProps) => {
  const [departments, setDepartments] = useState<Department[]>([]);
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
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      isActive: true,
      categoryName: '',
      departmentId: 0,
      description: '',
    },
  });

  const categoryName = watch('categoryName');
  const departmentId = watch('departmentId');

  useEffect(() => {
    const initializeForm = async () => {
      if (mode === 'add') {
        await fetchActiveDepartments();
      } else {
        await fetchAllDepartments();
      }

      if (mode === 'edit' && categoryId) {
        await fetchCategoryData();
      }
    };
    initializeForm();
  }, [mode, categoryId]);

  useEffect(() => {
    if (categoryName && categoryName.length > 0 && departmentId > 0) {
      const timer = setTimeout(() => {
        checkNameUniqueness(categoryName, departmentId);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('categoryName');
    }
  }, [categoryName, departmentId]);

  const fetchActiveDepartments = async () => {
    try {
      const data = await departmentsService.getActive();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to fetch active departments:', error);
    }
  };

  const fetchAllDepartments = async () => {
    try {
      const response = await departmentsService.getList({ page: 1, pageSize: 1000 });
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchCategoryData = async () => {
    if (!categoryId) return;

    setInitialLoading(true);
    try {
      const category = await categoriesService.getById(categoryId);
      setValue('categoryName', category.categoryName);
      setValue('departmentId', category.departmentId);
      setValue('description', category.description || '');
      setValue('isActive', category.isActive);
    } catch (error) {
      console.error('Failed to fetch category data:', error);
      alert('Failed to load category data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkNameUniqueness = async (nameValue: string, deptId: number) => {
    if (!nameValue || !deptId) return;

    setCheckingName(true);
    clearErrors('categoryName');

    try {
      const excludeId = mode === 'edit' && categoryId ? categoryId : undefined;
      const exists = await categoriesService.checkNameExists(nameValue, deptId, excludeId);

      if (exists) {
        setError('categoryName', { message: 'This Category Name already exists in the selected Department' });
      }
    } catch (error) {
      console.error('Failed to check category name:', error);
    } finally {
      setCheckingName(false);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    if (errors.categoryName) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        categoryName: data.categoryName,
        departmentId: data.departmentId,
        description: data.description || null,
        isActive: data.isActive,
      };

      if (mode === 'add') {
        await categoriesService.create(payload);
        alert('Category created successfully!');
      } else if (mode === 'edit' && categoryId) {
        await categoriesService.update(categoryId, payload);
        alert('Category updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save category';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-3xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  {mode === 'add' ? 'Add New Category' : 'Edit Category'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add' ? 'Create a new category record' : 'Update category information'}
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
                    Basic Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('departmentId', { valueAsNumber: true })}
                        autoFocus
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                      >
                        <option value={0}>Select department</option>
                        {departments.map((dept) => (
                          <option key={dept.departmentId} value={dept.departmentId}>
                            {dept.departmentName}
                            {dept.isActive === false ? ' (Inactive)' : ''}
                          </option>
                        ))}
                      </select>
                      {errors.departmentId && (
                        <p className="text-red-500 text-sm mt-1">{errors.departmentId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('categoryName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter category name"
                        />
                        {checkingName && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                          </div>
                        )}
                      </div>
                      {errors.categoryName && (
                        <p className="text-red-500 text-sm mt-1">{errors.categoryName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        maxLength={200}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter category description"
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
                          Enable this to make the category active
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
                  disabled={loading || checkingName || !!errors.categoryName || !departmentId}
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
