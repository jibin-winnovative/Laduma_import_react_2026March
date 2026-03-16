import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { localTransportCompaniesService, LocalTransportCompany } from '../../services/localTransportCompaniesService';
import { mastersService } from '../../services/mastersService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const localTransportCompanySchema = z.object({
  localTransportCompanyId: z.number().optional(),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be 50 characters or less'),
  companyName: z
    .string()
    .min(1, 'Company Name is required')
    .max(200, 'Company Name must be 200 characters or less'),
  vatNumber: z
    .string()
    .min(1, 'VAT Number is required')
    .max(50, 'VAT Number must be 50 characters or less'),
  contactPerson: z
    .string()
    .min(1, 'Contact Person is required')
    .max(100, 'Contact Person must be 100 characters or less'),
  email: z.string().min(1, 'Email is required').email('Invalid email format').max(100, 'Email must be 100 characters or less'),
  phoneNumber: z
    .string()
    .min(1, 'Phone Number is required')
    .regex(/^\+?[0-9\s-]{8,20}$/, 'Invalid phone number format'),
  country: z.string().min(1, 'Country is required'),
  address: z.string().max(500, 'Address must be 500 characters or less').optional().or(z.literal('')),
  faxNumber: z
    .string()
    .max(20, 'Fax Number must be 20 characters or less')
    .refine((val) => !val || /^\+?[0-9\s-]{8,20}$/.test(val), 'Invalid fax number format')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .max(100, 'Website must be 100 characters or less')
    .refine((val) => !val || /^https?:\/\/.+/.test(val), 'Invalid URL format')
    .optional()
    .or(z.literal('')),
  alternateContactPerson: z.string().max(100, 'Alternate Contact Person must be 100 characters or less').optional().or(z.literal('')),
  alternateEmail: z
    .string()
    .max(100, 'Alternate Email must be 100 characters or less')
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Invalid email format')
    .optional()
    .or(z.literal('')),
  alternatePhoneNumber: z
    .string()
    .max(20, 'Alternate Phone Number must be 20 characters or less')
    .refine((val) => !val || /^\+?[0-9\s-]{8,20}$/.test(val), 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  serviceArea: z.string().max(200, 'Service Area must be 200 characters or less').optional().or(z.literal('')),
  vehicleTypes: z.string().max(200, 'Vehicle Types must be 200 characters or less').optional().or(z.literal('')),
  remarks: z.string().max(500, 'Remarks must be 500 characters or less').optional().or(z.literal('')),
  isActive: z.boolean(),
});

type LocalTransportCompanyFormData = z.infer<typeof localTransportCompanySchema>;

interface LocalTransportCompanyFormProps {
  mode: 'add' | 'edit';
  companyId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LocalTransportCompanyForm = ({ mode, companyId, onClose, onSuccess }: LocalTransportCompanyFormProps) => {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [checkingCode, setCheckingCode] = useState(false);
  const [checkingVat, setCheckingVat] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<LocalTransportCompanyFormData>({
    resolver: zodResolver(localTransportCompanySchema),
    mode: 'onBlur',
    defaultValues: {
      isActive: true,
      code: '',
      companyName: '',
      vatNumber: '',
      contactPerson: '',
      email: '',
      phoneNumber: '',
      country: '',
      address: '',
      faxNumber: '',
      website: '',
      alternateContactPerson: '',
      alternateEmail: '',
      alternatePhoneNumber: '',
      serviceArea: '',
      vehicleTypes: '',
      remarks: '',
    },
  });

  const code = watch('code');
  const vatNumber = watch('vatNumber');
  const companyName = watch('companyName');
  const email = watch('email');

  useEffect(() => {
    const initializeForm = async () => {
      await fetchCountries();
      if (mode === 'edit' && companyId) {
        await fetchCompanyData();
      }
    };
    initializeForm();
  }, [mode, companyId]);

  useEffect(() => {
    if (code && code.length > 0) {
      const timer = setTimeout(() => {
        checkCodeUniqueness(code);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('code');
    }
  }, [code]);

  useEffect(() => {
    if (vatNumber && vatNumber.length > 0) {
      const timer = setTimeout(() => {
        checkVatUniqueness(vatNumber);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('vatNumber');
    }
  }, [vatNumber]);

  useEffect(() => {
    if (companyName && companyName.length > 0) {
      const timer = setTimeout(() => {
        checkCompanyNameUniqueness(companyName);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('companyName');
    }
  }, [companyName]);

  useEffect(() => {
    if (email && email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const timer = setTimeout(() => {
        checkEmailUniqueness(email);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('email');
    }
  }, [email]);

  const fetchCountries = async () => {
    try {
      const data = await mastersService.getCountries();
      setCountries(data);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const fetchCompanyData = async () => {
    if (!companyId) return;

    setInitialLoading(true);
    try {
      const company = await localTransportCompaniesService.getById(companyId);
      setValue('code', company.code);
      setValue('companyName', company.companyName);
      setValue('vatNumber', company.vatNumber);
      setValue('contactPerson', company.contactPerson);
      setValue('email', company.email);
      setValue('phoneNumber', company.phoneNumber);
      setValue('country', company.country);
      setValue('address', company.address || '');
      setValue('faxNumber', company.faxNumber || '');
      setValue('website', company.website || '');
      setValue('alternateContactPerson', company.alternateContactPerson || '');
      setValue('alternateEmail', company.alternateEmail || '');
      setValue('alternatePhoneNumber', company.alternatePhoneNumber || '');
      setValue('serviceArea', company.serviceArea || '');
      setValue('vehicleTypes', company.vehicleTypes || '');
      setValue('remarks', company.remarks || '');
      setValue('isActive', company.isActive);
    } catch (error) {
      console.error('Failed to fetch company data:', error);
      alert('Failed to load company data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkCodeUniqueness = async (codeValue: string) => {
    if (!codeValue) return;

    setCheckingCode(true);
    clearErrors('code');

    try {
      const params: { code: string; excludeId?: number } = { code: codeValue };
      if (mode === 'edit' && companyId) {
        params.excludeId = companyId;
      }

      const exists = await localTransportCompaniesService.checkCodeExists(params.code, params.excludeId);

      if (exists) {
        setError('code', {
          type: 'manual',
          message: 'This Code is already in use'
        });
      }
    } catch (error) {
      console.error('Failed to check code:', error);
    } finally {
      setCheckingCode(false);
    }
  };

  const checkVatUniqueness = async (vat: string) => {
    if (!vat) return;

    setCheckingVat(true);
    clearErrors('vatNumber');

    try {
      const params: { vatNumber: string; excludeId?: number } = { vatNumber: vat };
      if (mode === 'edit' && companyId) {
        params.excludeId = companyId;
      }

      const exists = await localTransportCompaniesService.checkVatExists(params.vatNumber, params.excludeId);

      if (exists) {
        setError('vatNumber', {
          type: 'manual',
          message: 'This VAT Number is already in use'
        });
      }
    } catch (error) {
      console.error('Failed to check VAT:', error);
    } finally {
      setCheckingVat(false);
    }
  };

  const checkCompanyNameUniqueness = async (name: string) => {
    if (!name) return;

    setCheckingName(true);
    clearErrors('companyName');

    try {
      const params: { name: string; excludeId?: number } = { name };
      if (mode === 'edit' && companyId) {
        params.excludeId = companyId;
      }

      const exists = await localTransportCompaniesService.checkNameExists(params.name, params.excludeId);

      if (exists) {
        setError('companyName', {
          type: 'manual',
          message: 'This Company Name is already in use'
        });
      }
    } catch (error) {
      console.error('Failed to check company name:', error);
    } finally {
      setCheckingName(false);
    }
  };

  const checkEmailUniqueness = async (email: string) => {
    if (!email) return;

    setCheckingEmail(true);
    clearErrors('email');

    try {
      const params: { email: string; excludeId?: number } = { email };
      if (mode === 'edit' && companyId) {
        params.excludeId = companyId;
      }

      const exists = await localTransportCompaniesService.checkEmailExists(params.email, params.excludeId);

      if (exists) {
        setError('email', {
          type: 'manual',
          message: 'This Email is already in use'
        });
      }
    } catch (error) {
      console.error('Failed to check email:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const onSubmit = async (data: LocalTransportCompanyFormData) => {
    if (errors.code || errors.vatNumber || errors.companyName || errors.email) {
      return;
    }

    if (checkingCode || checkingVat || checkingName || checkingEmail) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: data.code,
        companyName: data.companyName,
        vatNumber: data.vatNumber,
        contactPerson: data.contactPerson,
        email: data.email,
        phoneNumber: data.phoneNumber,
        country: data.country,
        address: data.address || null,
        faxNumber: data.faxNumber || null,
        website: data.website || null,
        alternateContactPerson: data.alternateContactPerson || null,
        alternateEmail: data.alternateEmail || null,
        alternatePhoneNumber: data.alternatePhoneNumber || null,
        serviceArea: data.serviceArea || null,
        vehicleTypes: data.vehicleTypes || null,
        remarks: data.remarks || null,
        isActive: data.isActive,
      };

      if (mode === 'add') {
        await localTransportCompaniesService.create(payload);
        alert('Local Transport Company created successfully!');
      } else if (mode === 'edit' && companyId) {
        await localTransportCompaniesService.update(companyId, payload);
        alert('Local Transport Company updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save company:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save local transport company';
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
                  {mode === 'add' ? 'Add New Local Transport Company' : 'Edit Local Transport Company'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add'
                    ? 'Create a new local transport company record'
                    : 'Update local transport company information'}
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
                          Code <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            {...register('code')}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            placeholder="Enter company code"
                            autoFocus
                          />
                          {checkingCode && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                            </div>
                          )}
                        </div>
                        {errors.code && (
                          <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('companyName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter company name"
                        />
                        {errors.companyName && (
                          <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          VAT Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            {...register('vatNumber')}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            placeholder="Enter VAT number"
                          />
                          {checkingVat && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                            </div>
                          )}
                        </div>
                        {errors.vatNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.vatNumber.message}</p>
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
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Primary Contact
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Person <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('contactPerson')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter contact person name"
                        />
                        {errors.contactPerson && (
                          <p className="text-red-500 text-sm mt-1">{errors.contactPerson.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('phoneNumber')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="+1234567890"
                        />
                        {errors.phoneNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fax Number
                        </label>
                        <input
                          type="text"
                          {...register('faxNumber')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Fax number"
                        />
                        {errors.faxNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.faxNumber.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Alternate Contact
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alternate Contact Person
                        </label>
                        <input
                          type="text"
                          {...register('alternateContactPerson')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter alternate contact person"
                        />
                        {errors.alternateContactPerson && (
                          <p className="text-red-500 text-sm mt-1">{errors.alternateContactPerson.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alternate Email
                        </label>
                        <input
                          type="email"
                          {...register('alternateEmail')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="alternate@example.com"
                        />
                        {errors.alternateEmail && (
                          <p className="text-red-500 text-sm mt-1">{errors.alternateEmail.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alternate Phone Number
                        </label>
                        <input
                          type="text"
                          {...register('alternatePhoneNumber')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="+1234567890"
                        />
                        {errors.alternatePhoneNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.alternatePhoneNumber.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Service Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Service Area
                        </label>
                        <input
                          type="text"
                          {...register('serviceArea')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="e.g., Johannesburg, Cape Town"
                        />
                        {errors.serviceArea && (
                          <p className="text-red-500 text-sm mt-1">{errors.serviceArea.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Types
                        </label>
                        <input
                          type="text"
                          {...register('vehicleTypes')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="e.g., Trucks, Vans, Flatbeds"
                        />
                        {errors.vehicleTypes && (
                          <p className="text-red-500 text-sm mt-1">{errors.vehicleTypes.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Additional Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <textarea
                          {...register('address')}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter full address"
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website
                        </label>
                        <input
                          type="text"
                          {...register('website')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="https://www.example.com"
                        />
                        {errors.website && (
                          <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Remarks
                        </label>
                        <textarea
                          {...register('remarks')}
                          rows={2}
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
                            Enable this to make the company active
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
                  disabled={loading || checkingCode || checkingVat || checkingName || checkingEmail}
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
