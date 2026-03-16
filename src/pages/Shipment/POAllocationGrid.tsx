import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export interface POAllocationSummary {
  purchaseOrderId: number;
  poNumber: string;
  poDate: string;
  supplierName: string;
  poAmount: number;
  ciAmount: number;
  totalCBM: number;
  extraFreight: number;
}

interface POAllocationGridProps {
  allocatedPOs: POAllocationSummary[];
  onView: (poId: number) => void;
  onEdit: (poId: number) => void;
  onDelete: (poId: number) => void;
}

export const POAllocationGrid = ({
  allocatedPOs,
  onView,
  onEdit,
  onDelete,
}: POAllocationGridProps) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCBM = (cbm: number) => {
    return cbm.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const totals = allocatedPOs.reduce(
    (acc, po) => ({
      poAmount: acc.poAmount + po.poAmount,
      ciAmount: acc.ciAmount + po.ciAmount,
      totalCBM: acc.totalCBM + po.totalCBM,
      extraFreight: acc.extraFreight + po.extraFreight,
    }),
    { poAmount: 0, ciAmount: 0, totalCBM: 0, extraFreight: 0 }
  );

  if (allocatedPOs.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="px-4 py-8 text-center text-gray-500">
          No purchase orders added. Click "Add PO" to select purchase orders.
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CI Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total CBM
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extra Freight
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allocatedPOs.map((po) => (
              <tr key={po.purchaseOrderId} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                  {po.poNumber}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                  {formatDate(po.poDate)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                  {po.supplierName}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                  ${formatCurrency(po.poAmount)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                  ${formatCurrency(po.ciAmount)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                  {formatCBM(po.totalCBM)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                  ${formatCurrency(po.extraFreight)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onView(po.purchaseOrderId)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(po.purchaseOrderId)}
                      className="p-1 text-[var(--color-primary)] hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(po.purchaseOrderId)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-right text-[var(--color-text)]">
                Totals:
              </td>
              <td className="px-4 py-3 text-sm font-bold text-[var(--color-text)]">
                ${formatCurrency(totals.poAmount)}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-[var(--color-text)]">
                ${formatCurrency(totals.ciAmount)}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-[var(--color-text)]">
                {formatCBM(totals.totalCBM)}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-[var(--color-text)]">
                ${formatCurrency(totals.extraFreight)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
};
