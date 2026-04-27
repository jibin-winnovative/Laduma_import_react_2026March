import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import {
  supplierCouponDiscountsService,
  NATURE_OPTIONS,
  type CreateSupplierCouponDiscountRequest,
} from '../../services/supplierCouponDiscountsService';
import { suppliersService } from '../../services/suppliersService';

const schema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  nature: z.string().min(1, 'Nature is required'),
  amountUsd: z.string().min(1, 'Amount is required'),
  remarks: z.string().optional(),
  couponDate: z.string().min(1, 'Date is required'),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  mode: 'add' | 'edit';
  id?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplierCouponDiscountForm = ({ mode, id, onClose, onSuccess }: Props) => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [suppliers, setSuppliers] = useState<{ supplierId: number; supplierName: string }[]>([]);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierId: '',
      nature: '',
      amountUsd: '',
      remarks: '',
      couponDate: new Date().toISOString().split('T')[0],
      isActive: true,
    },
  });

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await suppliersService.getAll();
        setSuppliers(Array.isArray(data) ? data : (data as any)?.data ?? []);
      } catch {
        setSuppliers([]);
      }
    };
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && id) {
      const load = async () => {
        try {
          const data = await supplierCouponDiscountsService.getById(id);
          setValue('supplierId', data.supplierId.toString());
          setValue('nature', data.nature);
          setValue('amountUsd', data.amountUsd.toString());
          setValue('remarks', data.remarks ?? '');
          setValue('couponDate', data.couponDate ? data.couponDate.split('T')[0] : '');
          setValue('isActive', data.isActive);
        } catch {
          setError('Failed to load record.');
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [mode, id, setValue]);

  const onSubmit = async (data: FormData) => {
    const amount = parseFloat(data.amountUsd);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload: CreateSupplierCouponDiscountRequest = {
        supplierId: parseInt(data.supplierId, 10),
        nature: data.nature,
        amountUsd: amount,
        remarks: data.remarks ?? '',
        couponDate: data.couponDate,
        isActive: data.isActive,
      };

      if (mode === 'edit' && id) {
        await supplierCouponDiscountsService.update({ ...payload, supplierCouponDiscountId: id });
      } else {
        await supplierCouponDiscountsService.create(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier <span className="text-red-500">*</span>
          </label>
          <select {...register('supplierId')} className={fieldClass(!!errors.supplierId)}>
            <option value="">Select Supplier</option>
            {suppliers.map((s) => (
              <option key={s.supplierId} value={s.supplierId}>
                {s.supplierName}
              </option>
            ))}
          </select>
          {errors.supplierId && <p className="text-red-500 text-xs mt-1">{errors.supplierId.message}</p>}
        </div>

        {/* Nature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nature <span className="text-red-500">*</span>
          </label>
          <select {...register('nature')} className={fieldClass(!!errors.nature)}>
            <option value="">Select Nature</option>
            {NATURE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {errors.nature && <p className="text-red-500 text-xs mt-1">{errors.nature.message}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (USD) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            {...register('amountUsd')}
            placeholder="0.00"
            className={fieldClass(!!errors.amountUsd)}
          />
          {errors.amountUsd && <p className="text-red-500 text-xs mt-1">{errors.amountUsd.message}</p>}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('couponDate')}
            className={fieldClass(!!errors.couponDate)}
          />
          {errors.couponDate && <p className="text-red-500 text-xs mt-1">{errors.couponDate.message}</p>}
        </div>

        {/* Remarks */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            {...register('remarks')}
            rows={3}
            placeholder="Enter remarks..."
            className={fieldClass(false)}
          />
        </div>

        {/* Is Active */}
        <div className="md:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            {...register('isActive')}
            className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
