import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { subTypesService, SubType } from '../../services/subTypesService';
import { productTypesService } from '../../services/productTypesService';
import { categoriesService } from '../../services/categoriesService';
import { departmentsService } from '../../services/departmentsService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const subTypeSchema = z.object({
  subTypeId: z.number().optional(),
  subTypeName: z
    .string()
    .min(1, 'Sub Type Name is required')
    .max(200, 'Sub Type Name must be 200 characters or less'),
  typeId: z.number().min(1, 'Product Type is required'),
  categoryId: z.number().min(1, 'Category is required'),
  departmentId: z.number().min(1, 'Department is required'),
  description: z.string().max(200, 'Description must be 200 characters or less').optional().or(z.literal('')),
  isActive: z.boolean(),
});

type SubTypeFormData = z.infer<typeof subTypeSchema>;

interface SubTypeFormProps {
  mode: 'add' | 'edit';
  subTypeId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Department {
  departmentId: number;
  departmentName: string;
  isActive?: boolean;
}

interface Category {
  categoryId: number;
  categoryName: string;
  departmentId: number;
  isActive?: boolean;
}

interface ProductType {
  typeId: number;
  typeName: string;
  categoryId: number;
  isActive?: boolean;
}

export const SubTypeForm = ({ mode, subTypeId, onClose, onSuccess }: SubTypeFormProps) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
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
  } = useForm<SubTypeFormData>({
    resolver: zodResolver(subTypeSchema),
    defaultValues: {
      isActive: true,
      subTypeName: '',
      typeId: 0,
      categoryId: 0,
      departmentId: 0,
      description: '',
    },
  });

  const subTypeName = watch('subTypeName');
  const typeId = watch('typeId');
  const categoryId = watch('categoryId');
  const departmentId = watch('departmentId');

  useEffect(() => {
    if (mode === 'add') {
      fetchActiveDepartments();
    } else {
      fetchAllDepartments();
    }

    if (mode === 'edit' && subTypeId) {
      fetchSubTypeData();
    }
  }, [mode, subTypeId]);

  useEffect(() => {
    if (departmentId > 0) {
      fetchCategoriesByDepartment(departmentId);
    } else {
      setCategories([]);
      setValue('categoryId', 0);
    }
  }, [departmentId]);

  useEffect(() => {
    if (categoryId > 0) {
      fetchProductTypesByCategory(categoryId);
    } else {
      setProductTypes([]);
      setValue('typeId', 0);
    }
  }, [categoryId]);

  useEffect(() => {
    if (subTypeName && subTypeName.length > 0 && typeId > 0) {
      const timer = setTimeout(() => {
        checkNameUniqueness(subTypeName, typeId);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('subTypeName');
    }
  }, [subTypeName, typeId]);

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

  const fetchCategoriesByDepartment = async (deptId: number) => {
    try {
      if (mode === 'add') {
        const data = await categoriesService.getActiveByDepartment(deptId);
        setCategories(data);
      } else {
        const data = await categoriesService.getByDepartment(deptId);
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const fetchProductTypesByCategory = async (catId: number) => {
    try {
      if (mode === 'add') {
        const data = await productTypesService.getActiveByCategory(catId);
        setProductTypes(data);
      } else {
        const data = await productTypesService.getByCategory(catId);
        setProductTypes(data);
      }
    } catch (error) {
      console.error('Failed to fetch product types:', error);
      setProductTypes([]);
    }
  };

  const fetchSubTypeData = async () => {
    if (!subTypeId) return;

    setInitialLoading(true);
    try {
      const subType = await subTypesService.getById(subTypeId);
      setValue('subTypeName', subType.subTypeName);
      setValue('typeId', subType.typeId);
      setValue('categoryId', subType.categoryId || 0);
      setValue('departmentId', subType.departmentId || 0);
      setValue('description', subType.description || '');
      setValue('isActive', subType.isActive);

      if (subType.departmentId) {
        await fetchCategoriesByDepartment(subType.departmentId);
      }
      if (subType.categoryId) {
        await fetchProductTypesByCategory(subType.categoryId);
      }
    } catch (error) {
      console.error('Failed to fetch sub type data:', error);
      alert('Failed to load sub type data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkNameUniqueness = async (nameValue: string, productTypeId: number) => {
    if (!nameValue || !productTypeId) return;

    setCheckingName(true);
    clearErrors('subTypeName');

    try {
      const excludeId = mode === 'edit' && subTypeId ? subTypeId : undefined;
      const exists = await subTypesService.checkNameExists(nameValue, productTypeId, excludeId);

      if (exists) {
        setError('subTypeName', { message: 'This Sub Type Name already exists in the selected Product Type' });
      }
    } catch (error) {
      console.error('Failed to check sub type name:', error);
    } finally {
      setCheckingName(false);
    }
  };

  const onSubmit = async (data: SubTypeFormData) => {
    if (errors.subTypeName) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        subTypeName: data.subTypeName,
        typeId: data.typeId,
        description: data.description || null,
        isActive: data.isActive,
      };

      if (mode === 'add') {
        await subTypesService.create(payload);
        alert('Sub Type created successfully!');
      } else if (mode === 'edit' && subTypeId) {
        await subTypesService.update(subTypeId, payload);
        alert('Sub Type updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save sub type:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save sub type';
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
                  {mode === 'add' ? 'Add New Sub Type' : 'Edit Sub Type'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add' ? 'Create a new sub type record' : 'Update sub type information'}
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        autoFocus
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
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('categoryId', { valueAsNumber: true })}
                        disabled={!departmentId || departmentId === 0}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value={0}>
                          {departmentId ? 'Select category' : 'First select a department'}
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.categoryId} value={cat.categoryId}>
                            {cat.categoryName}
                            {cat.isActive === false ? ' (Inactive)' : ''}
                          </option>
                        ))}
                      </select>
                      {errors.categoryId && (
                        <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('typeId', { valueAsNumber: true })}
                        disabled={!categoryId || categoryId === 0}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value={0}>
                          {categoryId ? 'Select product type' : 'First select a category'}
                        </option>
                        {productTypes.map((type) => (
                          <option key={type.typeId} value={type.typeId}>
                            {type.typeName}
                            {type.isActive === false ? ' (Inactive)' : ''}
                          </option>
                        ))}
                      </select>
                      {errors.typeId && (
                        <p className="text-red-500 text-sm mt-1">{errors.typeId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sub Type Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('subTypeName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter sub type name"
                        />
                        {checkingName && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                          </div>
                        )}
                      </div>
                      {errors.subTypeName && (
                        <p className="text-red-500 text-sm mt-1">{errors.subTypeName.message}</p>
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
                        placeholder="Enter sub type description"
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
                          Enable this to make the sub type active
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
                  disabled={loading || checkingName || !!errors.subTypeName || !typeId}
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
