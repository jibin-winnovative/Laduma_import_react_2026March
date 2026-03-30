import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { banksService } from '../../services/banksService';
import { Bank } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const bankSchema = z.object({
  name: z.string().min(1, 'Bank Name is required').max(200, 'Bank Name must be 200 characters or less'),
  accountNumber: z
    .string()
    .min(1, 'Account Number is required')
    .max(100, 'Account Number must be 100 characters or less'),
  branchCode: z.string().max(50, 'Branch Code must be 50 characters or less').optional().or(z.literal('')),
  branch: z.string().max(200, 'Branch must be 200 characters or less').optional().or(z.literal('')),
  address: z.string().max(500, 'Address must be 500 characters or less').optional().or(z.literal('')),
  contactNumber: z.string().max(50, 'Contact Number must be 50 characters or less').optional().or(z.literal('')),
  isActive: z.boolean(),
});

type BankFormData = z.infer<typeof bankSchema>;

interface BankFormProps {
  mode: 'add' | 'edit';
  bankId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BankForm = ({ mode, bankId, onClose, onSuccess }: BankFormProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [checkingAccountNumber, setCheckingAccountNumber] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<BankFormData>({
    resolver: zodResolver(bankSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      accountNumber: '',
      branchCode: '',
      branch: '',
      address: '',
      contactNumber: '',
      isActive: true,
    },
  });

  const accountNumber = watch('accountNumber');

  useEffect(() => {
    if (mode === 'edit' && bankId) {
      fetchBankData();
    }
  }, [mode, bankId]);

  const fetchBankData = async () => {
    if (!bankId) return;
    setInitialLoading(true);
    try {
      const bank = await banksService.getById(bankId);
      setValue('name', bank.name);
      setValue('accountNumber', bank.accountNumber);
      setValue('branchCode', bank.branchCode || '');
      setValue('branch', bank.branch || '');
      setValue('address', bank.address || '');
      setValue('contactNumber', bank.contactNumber || '');
      setValue('isActive', bank.isActive);
    } catch (error) {
      console.error('Failed to fetch bank data:', error);
      alert('Failed to load bank data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkAccountNumberUniqueness = async (accNum: string) => {
    if (!accNum) return;
    setCheckingAccountNumber(true);
    clearErrors('accountNumber');
    try {
      const exists = await banksService.checkAccountNumberExists(
        accNum,
        mode === 'edit' && bankId ? bankId : undefined
      );
      if (exists) {
        setError('accountNumber', { type: 'manual', message: 'Account number already exists' });
      }
    } catch (error) {
      console.error('Failed to check account number:', error);
    } finally {
      setCheckingAccountNumber(false);
    }
  };

  const onSubmit = async (data: BankFormData) => {
    if (errors.accountNumber || checkingAccountNumber) return;

    setLoading(true);
    try {
      const payload = {
        name: data.name,
        accountNumber: data.accountNumber,
        branchCode: data.branchCode || undefined,
        branch: data.branch || undefined,
        address: data.address || undefined,
        contactNumber: data.contactNumber || undefined,
        isActive: data.isActive,
      };

      if (mode === 'add') {
        await banksService.create(payload);
        alert('Bank created successfully!');
      } else if (mode === 'edit' && bankId) {
        await banksService.update(bankId, payload);
        alert('Bank updated successfully!');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save bank:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save bank';
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
          <div
            className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0"
            style={{ backgroundColor: '#1B3A57' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  {mode === 'add' ? 'Add New Bank' : 'Edit Bank'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add' ? 'Create a new bank record' : 'Update bank information'}
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
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-4 sm:p-6 md:p-8 space-y-6"
              style={{ backgroundColor: '#F9FAFB' }}
            >
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Bank Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      autoFocus={mode === 'add'}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter bank name"
                      disabled={loading}
                      autoComplete="off"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        {...register('accountNumber')}
                        onBlur={(e) => {
                          if (e.target.value) checkAccountNumberUniqueness(e.target.value);
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                          errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter account number"
                        disabled={loading}
                        autoComplete="off"
                      />
                      {checkingAccountNumber && (
                        <div className="absolute right-3 top-2.5">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    {errors.accountNumber && (
                      <p className="mt-1 text-sm text-red-500">{errors.accountNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                    <input
                      type="text"
                      {...register('branchCode')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                        errors.branchCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter branch code"
                      disabled={loading}
                    />
                    {errors.branchCode && (
                      <p className="mt-1 text-sm text-red-500">{errors.branchCode.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                    <input
                      type="text"
                      {...register('branch')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                        errors.branch ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter branch name"
                      disabled={loading}
                    />
                    {errors.branch && <p className="mt-1 text-sm text-red-500">{errors.branch.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      {...register('contactNumber')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                        errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter contact number"
                      disabled={loading}
                    />
                    {errors.contactNumber && (
                      <p className="mt-1 text-sm text-red-500">{errors.contactNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        {...register('isActive')}
                        id="isActive"
                        className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                        disabled={loading}
                      />
                      <label htmlFor="isActive" className="text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      {...register('address')}
                      rows={3}
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

              <div className="pt-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <Button type="button" onClick={onClose} variant="secondary" className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || checkingAccountNumber || !!errors.accountNumber}
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
                      <span>{mode === 'add' ? 'Create Bank' : 'Update Bank'}</span>
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
