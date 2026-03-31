import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { clearingPaymentChargesService } from '../../services/clearingPaymentChargesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const clearingPaymentChargeSchema = z.object({
  chargeName: z
    .string()
    .min(1, 'Charge name is required')
    .max(150, 'Charge name must be 150 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  vat: z
    .string()
    .optional()
    .refine((val) => !val || val.trim() === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'VAT must be a valid non-negative number',
    }),
  isActive: z.boolean(),
});

type ClearingPaymentChargeFormData = z.infer<typeof clearingPaymentChargeSchema>;

interface ClearingPaymentChargeFormProps {
  mode: 'add' | 'edit';
  clearingPaymentChargeId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClearingPaymentChargeForm = ({
  mode,
  clearingPaymentChargeId,
  onClose,
  onSuccess,
}: ClearingPaymentChargeFormProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ClearingPaymentChargeFormData>({
    resolver: zodResolver(clearingPaymentChargeSchema),
    defaultValues: {
      isActive: true,
      chargeName: '',
      description: '',
      vat: '',
    },
  });

  useEffect(() => {
    if (mode === 'edit' && clearingPaymentChargeId) {
      fetchData();
    }
  }, [mode, clearingPaymentChargeId]);

  const fetchData = async () => {
    if (!clearingPaymentChargeId) return;

    setInitialLoading(true);
    try {
      const data = await clearingPaymentChargesService.getById(clearingPaymentChargeId);
      setValue('chargeName', data.chargeName);
      setValue('description', data.description || '');
      setValue('vat', data.vat != null ? String(data.vat) : '');
      setValue('isActive', data.isActive);
    } catch (error) {
      console.error('Failed to fetch clearing payment charge:', error);
      alert('Failed to load clearing payment charge data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: ClearingPaymentChargeFormData) => {
    setLoading(true);
    const vatValue = data.vat && data.vat.trim() !== '' ? parseFloat(data.vat) : null;

    try {
      if (mode === 'add') {
        await clearingPaymentChargesService.create({
          clearingPaymentChargeId: 0,
          chargeName: data.chargeName,
          description: data.description || '',
          vat: vatValue,
          isActive: true,
        });
        alert('Clearing payment charge created successfully!');
      } else if (mode === 'edit' && clearingPaymentChargeId) {
        await clearingPaymentChargesService.update(clearingPaymentChargeId, {
          clearingPaymentChargeId,
          chargeName: data.chargeName,
          description: data.description || '',
          vat: vatValue,
          isActive: data.isActive,
        });
        alert('Clearing payment charge updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save clearing payment charge:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save clearing payment charge';
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
                  {mode === 'add' ? 'Add New Clearing Payment Charge' : 'Edit Clearing Payment Charge'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add'
                    ? 'Create a new clearing payment charge record'
                    : 'Update clearing payment charge information'}
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
                        Charge Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('chargeName')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="e.g., Customs Service Fee, Port Handling"
                        autoFocus
                      />
                      {errors.chargeName && (
                        <p className="text-red-500 text-sm mt-1">{errors.chargeName.message}</p>
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
                        placeholder="Brief description of this clearing payment charge"
                      />
                      {errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        VAT (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('vat')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="e.g., 15.50"
                      />
                      {errors.vat && (
                        <p className="text-red-500 text-sm mt-1">{errors.vat.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {mode === 'edit' && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Status
                    </h3>

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
                          Enable this to make the clearing payment charge active
                        </p>
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
                  disabled={loading}
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
