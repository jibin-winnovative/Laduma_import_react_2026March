import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { employeesService } from '../../services/employeesService';
import { rolesService } from '../../services/rolesService';
import { Employee } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const employeeSchema = z.object({
  employeeCode: z
    .string()
    .min(1, 'Employee Code is required')
    .max(50, 'Employee Code must be 50 characters or less'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(100, 'Email must be 100 characters or less'),
  contactNo: z
    .string()
    .min(1, 'Contact No is required')
    .regex(/^\+?[0-9\s-]{8,20}$/, 'Invalid phone number format'),
  roleId: z.number().min(1, 'Role is required'),
  designation: z.union([z.string().max(100, 'Designation must be 100 characters or less'), z.literal('')]).optional(),
  address: z.union([z.string().max(200, 'Address must be 200 characters or less'), z.literal('')]).optional(),
  location: z.union([z.string().max(100, 'Location must be 100 characters or less'), z.literal('')]).optional(),
  password: z.union([
    z.string().min(6, 'Password must be at least 6 characters'),
    z.literal('')
  ]).optional(),
  confirmPassword: z.union([z.string(), z.literal('')]).optional(),
  isActive: z.boolean(),
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employeeId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EmployeeForm = ({ employeeId, onClose, onSuccess }: EmployeeFormProps) => {
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!employeeId);
  const [checkingCode, setCheckingCode] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const isEditMode = !!employeeId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    mode: 'onBlur',
    defaultValues: {
      employeeCode: '',
      name: '',
      email: '',
      contactNo: '',
      roleId: 0,
      designation: '',
      address: '',
      location: '',
      password: '',
      confirmPassword: '',
      isActive: true,
    },
  });

  const employeeCode = watch('employeeCode');
  const email = watch('email');

  useEffect(() => {
    const initializeForm = async () => {
      await fetchRoles();
      if (isEditMode && employeeId) {
        await fetchEmployeeData();
      }
    };
    initializeForm();
  }, [isEditMode, employeeId]);

  useEffect(() => {
    if (employeeCode && employeeCode.length > 0) {
      const timer = setTimeout(() => {
        checkEmployeeCodeUniqueness(employeeCode);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('employeeCode');
    }
  }, [employeeCode]);

  useEffect(() => {
    if (email && email.length > 0) {
      const timer = setTimeout(() => {
        checkEmailUniqueness(email);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('email');
    }
  }, [email]);

  const fetchRoles = async () => {
    try {
      const data = await rolesService.getAll({ isActive: true });
      setRoles(Array.isArray(data) ? data.map((r: any) => ({ id: r.roleId, name: r.roleName })) : []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setRoles([]);
    }
  };

  const fetchEmployeeData = async () => {
    if (!employeeId) return;
    setInitialLoading(true);
    try {
      const employee = await employeesService.getById(employeeId);
      setValue('employeeCode', employee.employeeCode || '');
      setValue('name', employee.name || '');
      setValue('email', employee.email || '');
      setValue('contactNo', employee.contactNo || '');
      setValue('roleId', employee.roleId || 0);
      setValue('designation', employee.designation || '');
      setValue('address', employee.address || '');
      setValue('location', employee.location || '');
      setValue('isActive', employee.isActive ?? true);
    } catch (error) {
      console.error('Failed to fetch employee data:', error);
      alert('Failed to load employee data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkEmployeeCodeUniqueness = async (code: string) => {
    if (!code || code.length === 0) return;
    setCheckingCode(true);
    try {
      const exists = await employeesService.checkCodeExists(code, employeeId);
      if (exists) {
        setError('employeeCode', {
          type: 'manual',
          message: 'Employee code already exists',
        });
      } else {
        clearErrors('employeeCode');
      }
    } catch (error) {
      console.error('Failed to check employee code:', error);
    } finally {
      setCheckingCode(false);
    }
  };

  const checkEmailUniqueness = async (emailValue: string) => {
    if (!emailValue || emailValue.length === 0) return;
    setCheckingEmail(true);
    try {
      const exists = await employeesService.checkEmailExists(emailValue, employeeId);
      if (exists) {
        setError('email', {
          type: 'manual',
          message: 'Email already exists',
        });
      } else {
        clearErrors('email');
      }
    } catch (error) {
      console.error('Failed to check email:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    if (!isEditMode && !data.password) {
      setError('password', {
        type: 'manual',
        message: 'Password is required for new employees',
      });
      return;
    }

    if (!isEditMode && !data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Confirm Password is required for new employees',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        employeeCode: data.employeeCode,
        name: data.name,
        email: data.email,
        contactNo: data.contactNo,
        roleId: data.roleId,
        designation: data.designation || null,
        address: data.address || null,
        location: data.location || null,
        isActive: data.isActive,
      };

      if (!isEditMode || (data.password && data.password.length > 0)) {
        payload.password = data.password;
      }

      if (isEditMode && employeeId) {
        await employeesService.update(employeeId, payload);
      } else {
        await employeesService.create(payload);
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Failed to save employee:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to save employee';
      alert(message);
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
      <div className="w-full max-w-[95vw] sm:max-w-5xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  {isEditMode ? 'Edit Employee' : 'Add New Employee'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {isEditMode ? 'Update employee information' : 'Create a new employee record'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Basic Information
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Code <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            {...register('employeeCode')}
                            autoFocus={!isEditMode}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                              errors.employeeCode ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter employee code"
                            disabled={loading}
                            autoComplete="off"
                          />
                          {checkingCode && (
                            <div className="absolute right-3 top-2.5">
                              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                        {errors.employeeCode && (
                          <p className="mt-1 text-sm text-red-500">{errors.employeeCode.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('name')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter employee name"
                          disabled={loading}
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Designation
                        </label>
                        <input
                          type="text"
                          {...register('designation')}
                          maxLength={100}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.designation ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter designation"
                          disabled={loading}
                        />
                        {errors.designation && (
                          <p className="mt-1 text-sm text-red-500">{errors.designation.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          {...register('location')}
                          maxLength={100}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.location ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter location"
                          disabled={loading}
                        />
                        {errors.location && (
                          <p className="mt-1 text-sm text-red-500">{errors.location.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('roleId', { valueAsNumber: true })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.roleId ? 'border-red-500' : 'border-gray-300'
                          }`}
                          disabled={loading}
                        >
                          <option value={0}>Select a role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        {errors.roleId && (
                          <p className="mt-1 text-sm text-red-500">{errors.roleId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <textarea
                          {...register('address')}
                          rows={3}
                          maxLength={200}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter address"
                          disabled={loading}
                        />
                        {errors.address && (
                          <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            {...register('isActive')}
                            id="isActive"
                            className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                            disabled={loading}
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Contact Information
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            {...register('email')}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                              errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter email address"
                            disabled={loading}
                            autoComplete="off"
                          />
                          {checkingEmail && (
                            <div className="absolute right-3 top-2.5">
                              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact No <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('contactNo')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.contactNo ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter contact number"
                          disabled={loading}
                        />
                        {errors.contactNo && (
                          <p className="mt-1 text-sm text-red-500">{errors.contactNo.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Security
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password {!isEditMode && <span className="text-red-500">*</span>}
                          {isEditMode && <span className="text-gray-500 text-xs ml-2">(leave blank to keep unchanged)</span>}
                        </label>
                        <input
                          type="password"
                          {...register('password')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.password ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder={isEditMode ? 'Enter new password' : 'Enter password'}
                          disabled={loading}
                          autoComplete="new-password"
                        />
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password {!isEditMode && <span className="text-red-500">*</span>}
                          {isEditMode && <span className="text-gray-500 text-xs ml-2">(leave blank to keep unchanged)</span>}
                        </label>
                        <input
                          type="password"
                          {...register('confirmPassword')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder={isEditMode ? 'Confirm new password' : 'Confirm password'}
                          disabled={loading}
                          autoComplete="new-password"
                        />
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <Button type="button" onClick={onClose} variant="secondary" className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || checkingCode || checkingEmail}
                  className="bg-[var(--color-primary)] hover:opacity-90 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span className="hidden sm:inline">{isEditMode ? 'Update Employee' : 'Create Employee'}</span>
                      <span className="sm:hidden">{isEditMode ? 'Update' : 'Create'}</span>
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
