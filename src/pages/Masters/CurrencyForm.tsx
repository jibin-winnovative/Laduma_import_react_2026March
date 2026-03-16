import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { currencyService } from '../../services/currencyService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const currencySchema = z.object({
  currencyCode: z
    .string()
    .min(1, 'Currency code is required')
    .max(10, 'Code must be 10 characters or less'),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country must be 100 characters or less'),
  conversionRate: z
    .number({ invalid_type_error: 'Conversion rate must be a number' })
    .min(0.000001, 'Conversion rate must be greater than 0')
    .max(999999999, 'Conversion rate is too large'),
  isActive: z.boolean(),
});

type CurrencyFormData = z.infer<typeof currencySchema>;

interface CurrencyFormProps {
  mode: 'add' | 'edit';
  currencyId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CurrencyForm = ({ mode, currencyId, onClose, onSuccess }: CurrencyFormProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      isActive: true,
      currencyCode: '',
      country: '',
      conversionRate: 0,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && currencyId) {
      fetchData();
    }
  }, [mode, currencyId]);

  const fetchData = async () => {
    if (!currencyId) return;

    setInitialLoading(true);
    try {
      const data = await currencyService.getById(currencyId);
      setValue('currencyCode', data.currencyCode);
      setValue('country', data.country);
      setValue('conversionRate', data.conversionRate);
      setValue('isActive', data.isActive);
    } catch (error) {
      console.error('Failed to fetch currency:', error);
      alert('Failed to load currency data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: CurrencyFormData) => {
    setLoading(true);
    try {
      if (mode === 'add') {
        await currencyService.create({
          currencyCode: data.currencyCode,
          country: data.country,
          conversionRate: data.conversionRate,
        });
        alert('Currency created successfully!');
      } else if (mode === 'edit' && currencyId) {
        await currencyService.update(currencyId, {
          country: data.country,
          conversionRate: data.conversionRate,
          isActive: data.isActive,
        });
        alert('Currency updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save currency:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save currency';
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
                  {mode === 'add' ? 'Add New Currency' : 'Edit Currency'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add' ? 'Create a new currency record' : 'Update currency information'}
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
                        Currency Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('currencyCode')}
                        disabled={mode === 'edit'}
                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all ${
                          mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        placeholder="e.g., USD, INR, EUR"
                        autoFocus
                      />
                      {errors.currencyCode && (
                        <p className="text-red-500 text-sm mt-1">{errors.currencyCode.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('country')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="e.g., United States, India, European Union"
                      />
                      {errors.country && (
                        <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conversion Rate <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        {...register('conversionRate', { valueAsNumber: true })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="e.g., 83.250000"
                      />
                      {errors.conversionRate && (
                        <p className="text-red-500 text-sm mt-1">{errors.conversionRate.message}</p>
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
                          Enable this to make the currency active
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
