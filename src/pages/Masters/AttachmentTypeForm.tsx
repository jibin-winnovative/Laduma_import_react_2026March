import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { attachmentTypesService, BELONGS_TO_OPTIONS } from '../../services/attachmentTypesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const schema = z.object({
  type: z.string().min(1, 'Type is required').max(200, 'Type must be 200 characters or less'),
  belongsTo: z.string().min(1, 'Belongs To is required'),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface AttachmentTypeFormProps {
  mode: 'add' | 'edit';
  attachmentTypeId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AttachmentTypeForm = ({ mode, attachmentTypeId, onClose, onSuccess }: AttachmentTypeFormProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [checkingExists, setCheckingExists] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: '', belongsTo: '', isActive: true },
  });

  const typeValue = watch('type');
  const belongsToValue = watch('belongsTo');

  useEffect(() => {
    if (mode === 'edit' && attachmentTypeId) {
      fetchData();
    }
  }, [mode, attachmentTypeId]);

  useEffect(() => {
    if (typeValue && belongsToValue) {
      const timer = setTimeout(() => {
        checkDuplicate(typeValue, belongsToValue);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('type');
    }
  }, [typeValue, belongsToValue]);

  const fetchData = async () => {
    if (!attachmentTypeId) return;
    setInitialLoading(true);
    try {
      const data = await attachmentTypesService.getById(attachmentTypeId);
      setValue('type', data.type);
      setValue('belongsTo', data.belongsTo);
      setValue('isActive', data.isActive);
    } catch (error) {
      console.error('Failed to fetch attachment type:', error);
      alert('Failed to load attachment type data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkDuplicate = async (type: string, belongsTo: string) => {
    if (!type || !belongsTo) return;
    setCheckingExists(true);
    clearErrors('type');
    try {
      const exists = await attachmentTypesService.checkExists(
        type,
        belongsTo,
        mode === 'edit' ? attachmentTypeId : undefined
      );
      if (exists) {
        setError('type', { message: 'This type already exists for the selected Belongs To' });
      }
    } catch (error) {
      console.error('Failed to check duplicate:', error);
    } finally {
      setCheckingExists(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (errors.type) return;
    setLoading(true);
    try {
      const payload = { type: data.type, belongsTo: data.belongsTo, isActive: data.isActive };
      if (mode === 'add') {
        await attachmentTypesService.create(payload);
        alert('Attachment type created successfully!');
      } else if (mode === 'edit' && attachmentTypeId) {
        await attachmentTypesService.update(attachmentTypeId, payload);
        alert('Attachment type updated successfully!');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save attachment type:', error);
      alert(error.response?.data?.message || 'Failed to save attachment type');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-lg mx-4 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-lg max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div
            className="border-b border-[var(--color-border)] px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0"
            style={{ backgroundColor: '#1B3A57' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                  {mode === 'add' ? 'Add Attachment Type' : 'Edit Attachment Type'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add' ? 'Create a new attachment type' : 'Update attachment type information'}
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
              className="p-4 sm:p-6"
              style={{ backgroundColor: '#F9FAFB' }}
            >
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Attachment Type Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        {...register('type')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="e.g., Invoice, Receipt"
                        autoFocus
                      />
                      {checkingExists && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                        </div>
                      )}
                    </div>
                    {errors.type && (
                      <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Belongs To <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('belongsTo')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                    >
                      <option value="">Select module</option>
                      {BELONGS_TO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.belongsTo && (
                      <p className="text-red-500 text-sm mt-1">{errors.belongsTo.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      {...register('isActive')}
                      className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                    />
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Active Status</label>
                      <p className="text-xs text-gray-500">Enable to make this attachment type active</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-300">
                <Button type="button" onClick={onClose} variant="secondary" disabled={loading} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || checkingExists || !!errors.type}
                  className="bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" />{mode === 'edit' ? 'Update' : 'Save'}</>
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
