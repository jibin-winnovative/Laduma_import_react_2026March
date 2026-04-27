import { useState, useEffect } from 'react';
import { supplierCouponDiscountsService, type SupplierCouponDiscount } from '../../services/supplierCouponDiscountsService';
import { Button } from '../../components/ui/Button';

interface Props {
  id: number;
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0">
    <span className="text-sm text-gray-500 sm:w-48 shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
);

export const ViewSupplierCouponDiscount = ({ id, onClose }: Props) => {
  const [data, setData] = useState<SupplierCouponDiscount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierCouponDiscountsService.getById(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (!data) return <p className="text-center text-gray-500 py-8">Record not found.</p>;

  const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString() : '—';
  const formatAmount = (n: number) => `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Row label="Supplier" value={data.supplierName} />
        <Row label="Nature" value={data.nature} />
        <Row label="Date" value={formatDate(data.couponDate)} />
        <Row label="Status" value={
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${data.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {data.isActive ? 'Active' : 'Inactive'}
          </span>
        } />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Total Amount</p>
          <p className="text-lg font-bold text-blue-700">{formatAmount(data.amountUsd)}</p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
          <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">Used Amount</p>
          <p className="text-lg font-bold text-orange-700">{formatAmount(data.usedAmountUsd)}</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Remaining</p>
          <p className="text-lg font-bold text-green-700">{formatAmount(data.remainingAmountUsd)}</p>
        </div>
      </div>
      {data.remarks && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remarks</p>
          <p className="text-sm text-gray-800">{data.remarks}</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500">
        <div className="grid grid-cols-2 gap-2">
          <span>Created By: <span className="text-gray-700">{data.createdBy || '—'}</span></span>
          <span>Created At: <span className="text-gray-700">{formatDate(data.createdAt)}</span></span>
          <span>Updated By: <span className="text-gray-700">{data.updatedBy || '—'}</span></span>
          <span>Updated At: <span className="text-gray-700">{formatDate(data.updatedAt)}</span></span>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};
