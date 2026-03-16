import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { companiesService } from '../../services/companiesService';
import { mastersService } from '../../services/mastersService';
import { Company } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const companySchema = z.object({
  companyCode: z
    .string()
    .min(1, 'Company Code is required')
    .max(50, 'Company Code must be 50 characters or less'),
  companyName: z
    .string()
    .min(1, 'Company Name is required')
    .max(200, 'Company Name must be 200 characters or less'),
  regNo: z
    .string()
    .min(1, 'Registration No is required')
    .max(100, 'Registration No must be 100 characters or less'),
  vatNo: z
    .string()
    .min(1, 'VAT No is required')
    .max(50, 'VAT No must be 50 characters or less'),
  importExportCode: z.string().max(100, 'Import Export Code must be 100 characters or less').optional().or(z.literal('')),
  country: z.string().min(1, 'Country is required'),
  address: z.string().max(500, 'Address must be 500 characters or less').optional().or(z.literal('')),
  contactPerson: z
    .string()
    .min(1, 'Contact Person is required')
    .max(100, 'Contact Person must be 100 characters or less'),
  email: z.string().min(1, 'Email is required').email('Invalid email format').max(100, 'Email must be 100 characters or less'),
  phoneNumber: z
    .string()
    .min(1, 'Phone Number is required')
    .regex(/^\+?[0-9\s-]{8,20}$/, 'Invalid phone number format'),
  faxNumber: z.string().max(20, 'Fax Number must be 20 characters or less').optional().or(z.literal('')),
  website: z
    .string()
    .max(100, 'Website must be 100 characters or less')
    .refine(
      (val) => !val || /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(val),
      'Invalid URL format. Must start with http:// or https://'
    )
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
  companyType: z.string().max(100, 'Company Type must be 100 characters or less').optional().or(z.literal('')),
  industry: z.string().max(100, 'Industry must be 100 characters or less').optional().or(z.literal('')),
  remarks: z.string().max(500, 'Remarks must be 500 characters or less').optional().or(z.literal('')),
  isActive: z.boolean(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormProps {
  mode: 'add' | 'edit';
  companyId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CompanyForm = ({ mode, companyId, onClose, onSuccess }: CompanyFormProps) => {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [checkingCode, setCheckingCode] = useState(false);
  const [checkingRegNo, setCheckingRegNo] = useState(false);
  const [checkingVatNo, setCheckingVatNo] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    mode: 'onBlur',
    defaultValues: {
      companyCode: '',
      companyName: '',
      regNo: '',
      vatNo: '',
      importExportCode: '',
      country: '',
      address: '',
      contactPerson: '',
      email: '',
      phoneNumber: '',
      faxNumber: '',
      website: '',
      alternateContactPerson: '',
      alternateEmail: '',
      alternatePhoneNumber: '',
      companyType: '',
      industry: '',
      remarks: '',
      isActive: true,
    },
  });

  const companyCode = watch('companyCode');
  const regNo = watch('regNo');
  const vatNo = watch('vatNo');
  const email = watch('email');

  useEffect(() => {
    fetchCountries();
    if (mode === 'edit' && companyId) {
      fetchCompanyData();
    }
  }, [mode, companyId]);

  useEffect(() => {
    if (companyCode && companyCode.length > 0) {
      const timer = setTimeout(() => {
        checkCompanyCodeUniqueness(companyCode);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('companyCode');
    }
  }, [companyCode]);

  useEffect(() => {
    if (regNo && regNo.length > 0) {
      const timer = setTimeout(() => {
        checkRegNoUniqueness(regNo);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('regNo');
    }
  }, [regNo]);

  useEffect(() => {
    if (vatNo && vatNo.length > 0) {
      const timer = setTimeout(() => {
        checkVatNoUniqueness(vatNo);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('vatNo');
    }
  }, [vatNo]);

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
      const company = await companiesService.getById(companyId);
      setValue('companyCode', company.companyCode);
      setValue('companyName', company.companyName);
      setValue('regNo', company.regNo);
      setValue('vatNo', company.vatNo);
      setValue('importExportCode', company.importExportCode || '');
      setValue('country', company.country);
      setValue('address', company.address || '');
      setValue('contactPerson', company.contactPerson);
      setValue('email', company.email);
      setValue('phoneNumber', company.phoneNumber);
      setValue('faxNumber', company.faxNumber || '');
      setValue('website', company.website || '');
      setValue('alternateContactPerson', company.alternateContactPerson || '');
      setValue('alternateEmail', company.alternateEmail || '');
      setValue('alternatePhoneNumber', company.alternatePhoneNumber || '');
      setValue('companyType', company.companyType || '');
      setValue('industry', company.industry || '');
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

  const checkCompanyCodeUniqueness = async (code: string) => {
    if (!code) return;

    setCheckingCode(true);
    clearErrors('companyCode');

    try {
      const params: { code: string; excludeId?: number } = { code };
      if (mode === 'edit' && companyId) {
        params.excludeId = companyId;
      }

      const exists = await companiesService.checkCodeExists(params.code, params.excludeId);

      if (exists) {
        setError('companyCode', { message: 'This Company Code is already in use' });
      }
    } catch (error) {
      console.error('Failed to check company code:', error);
    } finally {
      setCheckingCode(false);
    }
  };

  const checkRegNoUniqueness = async (regNo: string) => {
    if (!regNo) return;

    setCheckingRegNo(true);
    clearErrors('regNo');

    try {
      const params: { regNo: string; excludeId?: number } = { regNo };
      if (mode === 'edit' && companyId) {
        params.excludeId = companyId;
      }

      const exists = await companiesService.checkRegNoExists(params.regNo, params.excludeId);

      if (exists) {
        setError('regNo', {
          type: 'manual',
          message: 'This Registration No is already in use'
        });
      }
    } catch (error) {
      console.error('Failed to check registration no:', error);
    } finally {
      setCheckingRegNo(false);
    }
  };

  const checkVatNoUniqueness = async (vatNo: string) => {
    if (!vatNo) return;

    setCheckingVatNo(true);
    clearErrors('vatNo');

    try {
      const params: { vatNo: string; excludeId?: number } = { vatNo };
      if (mode === 'edit' && companyId) {
        params.excludeId = companyId;
      }

      const exists = await companiesService.checkVatNoExists(params.vatNo, params.excludeId);

      if (exists) {
        setError('vatNo', {
          type: 'manual',
          message: 'This VAT No is already in use'
        });
      }
    } catch (error) {
      console.error('Failed to check VAT no:', error);
    } finally {
      setCheckingVatNo(false);
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

      const exists = await companiesService.checkEmailExists(params.email, params.excludeId);

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

  const onSubmit = async (data: CompanyFormData) => {
    if (errors.companyCode || errors.regNo || errors.vatNo || errors.email) {
      return;
    }

    if (checkingCode || checkingRegNo || checkingVatNo || checkingEmail) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        companyCode: data.companyCode,
        companyName: data.companyName,
        regNo: data.regNo,
        vatNo: data.vatNo,
        importExportCode: data.importExportCode || null,
        country: data.country,
        address: data.address || null,
        contactPerson: data.contactPerson,
        email: data.email,
        phoneNumber: data.phoneNumber,
        faxNumber: data.faxNumber || null,
        website: data.website || null,
        alternateContactPerson: data.alternateContactPerson || null,
        alternateEmail: data.alternateEmail || null,
        alternatePhoneNumber: data.alternatePhoneNumber || null,
        companyType: data.companyType || null,
        industry: data.industry || null,
        remarks: data.remarks || null,
        isActive: data.isActive,
      };

      if (mode === 'add') {
        await companiesService.create(payload);
        alert('Company created successfully!');
      } else if (mode === 'edit' && companyId) {
        await companiesService.update(companyId, payload);
        alert('Company updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save company:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save company';
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
                  {mode === 'add' ? 'Add New Company' : 'Edit Company'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add'
                    ? 'Create a new company record'
                    : 'Update company information'}
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
                          Company Code <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            {...register('companyCode')}
                            autoFocus={mode === 'add'}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                              errors.companyCode ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter company code"
                            disabled={loading}
                            autoComplete="off"
                          />
                          {checkingCode && (
                            <div className="absolute right-3 top-2.5">
                              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                        {errors.companyCode && (
                          <p className="mt-1 text-sm text-red-500">{errors.companyCode.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('companyName')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.companyName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter company name"
                          disabled={loading}
                        />
                        {errors.companyName && (
                          <p className="mt-1 text-sm text-red-500">{errors.companyName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration No <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            {...register('regNo')}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                              errors.regNo ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter registration number"
                            disabled={loading}
                            autoComplete="off"
                          />
                          {checkingRegNo && (
                            <div className="absolute right-3 top-2.5">
                              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                        {errors.regNo && (
                          <p className="mt-1 text-sm text-red-500">{errors.regNo.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          VAT No <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            {...register('vatNo')}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                              errors.vatNo ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter VAT number"
                            disabled={loading}
                            autoComplete="off"
                          />
                          {checkingVatNo && (
                            <div className="absolute right-3 top-2.5">
                              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                        {errors.vatNo && (
                          <p className="mt-1 text-sm text-red-500">{errors.vatNo.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Import Export Code
                        </label>
                        <input
                          type="text"
                          {...register('importExportCode')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.importExportCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter import/export code"
                          disabled={loading}
                        />
                        {errors.importExportCode && (
                          <p className="mt-1 text-sm text-red-500">{errors.importExportCode.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Type
                        </label>
                        <input
                          type="text"
                          {...register('companyType')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.companyType ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter company type"
                          disabled={loading}
                        />
                        {errors.companyType && (
                          <p className="mt-1 text-sm text-red-500">{errors.companyType.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Industry
                        </label>
                        <input
                          type="text"
                          {...register('industry')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.industry ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter industry"
                          disabled={loading}
                        />
                        {errors.industry && (
                          <p className="mt-1 text-sm text-red-500">{errors.industry.message}</p>
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

                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Location
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          {...register('website')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.website ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="https://www.example.com"
                          disabled={loading}
                        />
                        {errors.website && (
                          <p className="mt-1 text-sm text-red-500">{errors.website.message}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Must include http:// or https://</p>
                      </div>
                    </div>
                  </div>

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
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.alternateContactPerson ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter alternate contact person"
                          disabled={loading}
                        />
                        {errors.alternateContactPerson && (
                          <p className="mt-1 text-sm text-red-500">{errors.alternateContactPerson.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alternate Email
                        </label>
                        <input
                          type="email"
                          {...register('alternateEmail')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.alternateEmail ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter alternate email"
                          disabled={loading}
                        />
                        {errors.alternateEmail && (
                          <p className="mt-1 text-sm text-red-500">{errors.alternateEmail.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alternate Phone Number
                        </label>
                        <input
                          type="tel"
                          {...register('alternatePhoneNumber')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                            errors.alternatePhoneNumber ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="+27 12 345 6789"
                          disabled={loading}
                        />
                        {errors.alternatePhoneNumber && (
                          <p className="mt-1 text-sm text-red-500">{errors.alternatePhoneNumber.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Additional Information
                    </h3>

                    <div className="space-y-4">
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
                  disabled={loading || checkingCode || checkingRegNo || checkingVatNo || checkingEmail}
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
                      <span className="hidden sm:inline">{mode === 'add' ? 'Create Company' : 'Update Company'}</span>
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
