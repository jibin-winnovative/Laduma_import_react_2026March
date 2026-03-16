import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { clearingAgentsService } from '../../services/clearingAgentsService';
import { mastersService } from '../../services/mastersService';
import { ClearingAgent } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const clearingAgentSchema = z.object({
  agentCode: z
    .string()
    .min(1, 'Agent Code is required')
    .max(50, 'Agent Code must be 50 characters or less'),
  agentName: z
    .string()
    .min(1, 'Agent Name is required')
    .max(200, 'Agent Name must be 200 characters or less'),
  vatNumber: z.string().max(50, 'VAT Number must be 50 characters or less').optional().or(z.literal('')),
  contactPerson: z
    .string()
    .min(1, 'Contact Person is required')
    .max(100, 'Contact Person must be 100 characters or less'),
  email: z.string().min(1, 'Email is required').email('Invalid email format').max(100, 'Email must be 100 characters or less'),
  phoneNumber: z
    .string()
    .min(1, 'Phone Number is required')
    .regex(/^\+?[0-9\s-]{8,20}$/, 'Invalid phone number format'),
  address: z.string().max(500, 'Address must be 500 characters or less').optional().or(z.literal('')),
  country: z.string().min(1, 'Country is required'),
  faxNumber: z.string().max(20, 'Fax Number must be 20 characters or less').optional().or(z.literal('')),
  website: z
    .string()
    .max(100, 'Website must be 100 characters or less')
    .refine((val) => !val || /^https?:\/\/.+/.test(val), 'Invalid URL format')
    .optional()
    .or(z.literal('')),
  remarks: z.string().max(500, 'Remarks must be 500 characters or less').optional().or(z.literal('')),
  isActive: z.boolean(),
});

type ClearingAgentFormData = z.infer<typeof clearingAgentSchema>;

interface ClearingAgentFormProps {
  mode: 'add' | 'edit';
  agentId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClearingAgentForm = ({ mode, agentId, onClose, onSuccess }: ClearingAgentFormProps) => {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [checkingCode, setCheckingCode] = useState(false);
  const [checkingVat, setCheckingVat] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<ClearingAgentFormData>({
    resolver: zodResolver(clearingAgentSchema),
    mode: 'onBlur',
    defaultValues: {
      agentCode: '',
      agentName: '',
      vatNumber: '',
      contactPerson: '',
      email: '',
      phoneNumber: '',
      address: '',
      country: '',
      faxNumber: '',
      website: '',
      remarks: '',
      isActive: true,
    },
  });

  const agentCode = watch('agentCode');
  const vatNumber = watch('vatNumber');

  useEffect(() => {
    const initializeForm = async () => {
      await fetchCountries();
      if (mode === 'edit' && agentId) {
        await fetchAgentData();
      }
    };
    initializeForm();
  }, [mode, agentId]);

  useEffect(() => {
    if (agentCode && agentCode.length > 0) {
      const timer = setTimeout(() => {
        checkAgentCodeUniqueness(agentCode);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('agentCode');
    }
  }, [agentCode]);

  useEffect(() => {
    if (vatNumber && vatNumber.length > 0) {
      const timer = setTimeout(() => {
        checkVatNumberUniqueness(vatNumber);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('vatNumber');
    }
  }, [vatNumber]);

  const fetchCountries = async () => {
    try {
      const data = await mastersService.getCountries();
      setCountries(data);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const fetchAgentData = async () => {
    if (!agentId) return;

    setInitialLoading(true);
    try {
      const agent = await clearingAgentsService.getById(agentId);
      setValue('agentCode', agent.agentCode);
      setValue('agentName', agent.agentName);
      setValue('vatNumber', agent.vatNumber || '');
      setValue('contactPerson', agent.contactPerson);
      setValue('email', agent.email);
      setValue('phoneNumber', agent.phoneNumber);
      setValue('address', agent.address || '');
      setValue('country', agent.country);
      setValue('faxNumber', agent.faxNumber || '');
      setValue('website', agent.website || '');
      setValue('remarks', agent.remarks || '');
      setValue('isActive', agent.isActive);
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
      alert('Failed to load agent data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkAgentCodeUniqueness = async (code: string) => {
    if (!code) return;

    setCheckingCode(true);
    clearErrors('agentCode');

    try {
      const params: { code: string; excludeId?: number } = { code };
      if (mode === 'edit' && agentId) {
        params.excludeId = agentId;
      }

      const exists = await clearingAgentsService.checkCodeExists(params.code, params.excludeId);

      if (exists) {
        setError('agentCode', {
          type: 'manual',
          message: 'This Agent Code is already in use'
        });
      }
    } catch (error) {
      console.error('Failed to check agent code:', error);
    } finally {
      setCheckingCode(false);
    }
  };

  const checkVatNumberUniqueness = async (vatNumber: string) => {
    if (!vatNumber) return;

    setCheckingVat(true);
    clearErrors('vatNumber');

    try {
      const params: { vatNumber: string; excludeId?: number } = { vatNumber };
      if (mode === 'edit' && agentId) {
        params.excludeId = agentId;
      }

      const exists = await clearingAgentsService.checkVatExists(params.vatNumber, params.excludeId);

      if (exists) {
        setError('vatNumber', {
          type: 'manual',
          message: 'This VAT Number is already in use'
        });
      }
    } catch (error) {
      console.error('Failed to check VAT number:', error);
    } finally {
      setCheckingVat(false);
    }
  };

  const onSubmit = async (data: ClearingAgentFormData) => {
    if (errors.agentCode || errors.vatNumber) {
      return;
    }

    if (checkingCode || checkingVat) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        agentCode: data.agentCode,
        agentName: data.agentName,
        vatNumber: data.vatNumber || null,
        contactPerson: data.contactPerson,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address || null,
        country: data.country,
        faxNumber: data.faxNumber || null,
        website: data.website || null,
        remarks: data.remarks || null,
        isActive: data.isActive,
      };

      if (mode === 'add') {
        await clearingAgentsService.create(payload);
        alert('Clearing Agent created successfully!');
      } else if (mode === 'edit' && agentId) {
        await clearingAgentsService.update(agentId, payload);
        alert('Clearing Agent updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save agent:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save clearing agent';
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
                  {mode === 'add' ? 'Add New Clearing Agent' : 'Edit Clearing Agent'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add'
                    ? 'Create a new clearing agent record'
                    : 'Update clearing agent information'}
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
                        Agent Code <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('agentCode')}
                          autoFocus={mode === 'add'}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.agentCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter agent code"
                          disabled={loading}
                          autoComplete="off"
                        />
                        {checkingCode && (
                          <div className="absolute right-3 top-2.5">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                      {errors.agentCode && (
                        <p className="mt-1 text-sm text-red-500">{errors.agentCode.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agent Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('agentName')}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                          errors.agentName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter agent name"
                        disabled={loading}
                      />
                      {errors.agentName && (
                        <p className="mt-1 text-sm text-red-500">{errors.agentName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        VAT Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('vatNumber')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.vatNumber ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter VAT number"
                          disabled={loading}
                          autoComplete="off"
                        />
                        {checkingVat && (
                          <div className="absolute right-3 top-2.5">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                      {errors.vatNumber && (
                        <p className="mt-1 text-sm text-red-500">{errors.vatNumber.message}</p>
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
                        <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Address & Country
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('country')}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                          errors.country ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={loading}
                      >
                        <option value="">Select a country</option>
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                      {errors.country && (
                        <p className="mt-1 text-sm text-red-500">{errors.country.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        {...register('address')}
                        rows={4}
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
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Contact Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('contactPerson')}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                          errors.contactPerson ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter contact person name"
                        disabled={loading}
                      />
                      {errors.contactPerson && (
                        <p className="mt-1 text-sm text-red-500">{errors.contactPerson.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter email address"
                        disabled={loading}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        {...register('phoneNumber')}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                          errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="+27 12 345 6789"
                        disabled={loading}
                      />
                      {errors.phoneNumber && (
                        <p className="mt-1 text-sm text-red-500">{errors.phoneNumber.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fax Number
                      </label>
                      <input
                        type="tel"
                        {...register('faxNumber')}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                          errors.faxNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter fax number"
                        disabled={loading}
                      />
                      {errors.faxNumber && (
                        <p className="mt-1 text-sm text-red-500">{errors.faxNumber.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Other Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="text"
                        {...register('website')}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                          errors.website ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="https://example.com"
                        disabled={loading}
                      />
                      {errors.website && (
                        <p className="mt-1 text-sm text-red-500">{errors.website.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <textarea
                        {...register('remarks')}
                        rows={4}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                          errors.remarks ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter any additional remarks"
                        disabled={loading}
                      />
                      {errors.remarks && (
                        <p className="mt-1 text-sm text-red-500">{errors.remarks.message}</p>
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
                  disabled={loading || checkingCode || checkingVat || !!errors.agentCode || !!errors.vatNumber}
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
                      <span className="hidden sm:inline">{mode === 'add' ? 'Create Agent' : 'Update Agent'}</span>
                      <span className="sm:hidden">{mode === 'add' ? 'Create' : 'Update'}</span>
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
