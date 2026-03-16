import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { portsService, Port } from '../../services/portsService';
import { mastersService } from '../../services/mastersService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const portSchema = z.object({
  portId: z.number().optional(),
  portCode: z
    .string()
    .min(1, 'Port Code is required')
    .max(50, 'Port Code must be 50 characters or less'),
  portName: z
    .string()
    .min(1, 'Port Name is required')
    .max(200, 'Port Name must be 200 characters or less'),
  country: z.string().min(1, 'Country is required'),
  region: z.string().max(100, 'Region must be 100 characters or less').optional().or(z.literal('')),
  portType: z.string().max(50, 'Port Type must be 50 characters or less').optional().or(z.literal('')),
  portDirection: z.enum(['Import', 'Export'], { required_error: 'Port Direction is required' }),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().or(z.literal('')),
  contactNumber: z
    .string()
    .max(100, 'Contact Number must be 100 characters or less')
    .refine((val) => !val || /^\+?[0-9\s-]{8,20}$/.test(val), 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .max(100, 'Email must be 100 characters or less')
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Invalid email format')
    .optional()
    .or(z.literal('')),
  address: z.string().max(500, 'Address must be 500 characters or less').optional().or(z.literal('')),
  remarks: z.string().max(500, 'Remarks must be 500 characters or less').optional().or(z.literal('')),
  isActive: z.boolean(),
});

type PortFormData = z.infer<typeof portSchema>;

interface PortFormProps {
  mode: 'add' | 'edit';
  portId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PortForm = ({ mode, portId, onClose, onSuccess }: PortFormProps) => {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [checkingCode, setCheckingCode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<PortFormData>({
    resolver: zodResolver(portSchema),
    defaultValues: {
      isActive: true,
      portCode: '',
      portName: '',
      country: '',
      region: '',
      portType: '',
      portDirection: 'Import' as 'Import' | 'Export',
      description: '',
      contactNumber: '',
      email: '',
      address: '',
      remarks: '',
    },
  });

  const portCode = watch('portCode');

  useEffect(() => {
    fetchCountries();
    if (mode === 'edit' && portId) {
      fetchPortData();
    }
  }, [mode, portId]);

  useEffect(() => {
    if (portCode && portCode.length > 0) {
      const timer = setTimeout(() => {
        checkCodeUniqueness(portCode);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('portCode');
    }
  }, [portCode]);

  const fetchCountries = async () => {
    try {
      const data = await mastersService.getCountries();
      setCountries(data);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const fetchPortData = async () => {
    if (!portId) return;

    setInitialLoading(true);
    try {
      const port = await portsService.getById(portId);
      setValue('portCode', port.portCode);
      setValue('portName', port.portName);
      setValue('country', port.country);
      setValue('region', port.region || '');
      setValue('portType', port.portType || '');
      setValue('portDirection', port.portDirection as 'Import' | 'Export');
      setValue('description', port.description || '');
      setValue('contactNumber', port.contactNumber || '');
      setValue('email', port.email || '');
      setValue('address', port.address || '');
      setValue('remarks', port.remarks || '');
      setValue('isActive', port.isActive);
    } catch (error) {
      console.error('Failed to fetch port data:', error);
      alert('Failed to load port data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkCodeUniqueness = async (codeValue: string) => {
    if (!codeValue) return;

    setCheckingCode(true);
    clearErrors('portCode');

    try {
      const params: { code: string; excludeId?: number } = { code: codeValue };
      if (mode === 'edit' && portId) {
        params.excludeId = portId;
      }

      const exists = await portsService.checkCodeExists(params.code, params.excludeId);

      if (exists) {
        setError('portCode', { message: 'This Port Code is already in use' });
      }
    } catch (error) {
      console.error('Failed to check port code:', error);
    } finally {
      setCheckingCode(false);
    }
  };

  const onSubmit = async (data: PortFormData) => {
    if (errors.portCode) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        portCode: data.portCode,
        portName: data.portName,
        country: data.country,
        region: data.region || null,
        portType: data.portType || null,
        portDirection: data.portDirection,
        description: data.description || null,
        contactNumber: data.contactNumber || null,
        email: data.email || null,
        address: data.address || null,
        remarks: data.remarks || null,
        isActive: data.isActive,
      };

      if (mode === 'add') {
        await portsService.create(payload);
        alert('Port created successfully!');
      } else if (mode === 'edit' && portId) {
        await portsService.update(portId, payload);
        alert('Port updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save port:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save port';
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
      <div className="w-full max-w-[95vw] sm:max-w-5xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  {mode === 'add' ? 'Add New Port' : 'Edit Port'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add' ? 'Create a new port record' : 'Update port information'}
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
                          Port Code <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            {...register('portCode')}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            placeholder="Enter port code"
                            autoFocus
                          />
                          {checkingCode && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                            </div>
                          )}
                        </div>
                        {errors.portCode && (
                          <p className="text-red-500 text-sm mt-1">{errors.portCode.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Port Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('portName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter port name"
                        />
                        {errors.portName && (
                          <p className="text-red-500 text-sm mt-1">{errors.portName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('country')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        >
                          <option value="">Select country</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                        {errors.country && (
                          <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Region
                        </label>
                        <input
                          type="text"
                          {...register('region')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="e.g., Southern, Northern"
                        />
                        {errors.region && (
                          <p className="text-red-500 text-sm mt-1">{errors.region.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Port Type
                        </label>
                        <input
                          type="text"
                          {...register('portType')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="e.g., Seaport, Airport"
                        />
                        {errors.portType && (
                          <p className="text-red-500 text-sm mt-1">{errors.portType.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Port Direction <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('portDirection')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        >
                          <option value="Import">Import</option>
                          <option value="Export">Export</option>
                        </select>
                        {errors.portDirection && (
                          <p className="text-red-500 text-sm mt-1">{errors.portDirection.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Contact Information
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          {...register('contactNumber')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="+1234567890"
                        />
                        {errors.contactNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.contactNumber.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          {...register('email')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="email@example.com"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Additional Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          {...register('description')}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Port description"
                        />
                        {errors.description && (
                          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <textarea
                          {...register('address')}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter full address"
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Remarks
                        </label>
                        <textarea
                          {...register('remarks')}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Additional notes"
                        />
                        {errors.remarks && (
                          <p className="text-red-500 text-sm mt-1">{errors.remarks.message}</p>
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
                            Enable this to make the port active
                          </p>
                        </div>
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
                  disabled={loading || checkingCode || !!errors.portCode}
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
