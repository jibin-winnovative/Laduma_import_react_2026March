import { Trash2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { POItemForAllocation } from '../../services/containersService';

export type AllocatedItem = POItemForAllocation;

export interface AllocatedPO {
  purchaseOrderId: number;
  poNumber: string;
  supplierName: string;
  items: AllocatedItem[];
}

interface POItemAllocationGridProps {
  allocatedPOs: AllocatedPO[];
  onUpdateItem: (poId: number, itemId: number, field: 'loadQty' | 'extraFreight', value: number) => void;
  onRemovePO: (poId: number) => void;
}

export const POItemAllocationGrid = ({
  allocatedPOs,
  onUpdateItem,
  onRemovePO,
}: POItemAllocationGridProps) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCBM = (cbm: number) => {
    return cbm.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const calculateAmount = (item: AllocatedItem) => {
    return item.loadQty * item.price;
  };

  const calculateTotalCBM = (item: AllocatedItem) => {
    return item.loadQty * item.cbm;
  };

  const getValidationError = (item: AllocatedItem) => {
    if (item.loadQty < 0) return 'Load quantity cannot be negative';
    if (item.loadQty > item.remainingQty) return 'Load quantity exceeds remaining quantity';
    return null;
  };

  const calculatePOTotals = (po: AllocatedPO) => {
    const totalAmount = po.items.reduce((sum, item) => sum + calculateAmount(item), 0);
    const totalCBM = po.items.reduce((sum, item) => sum + calculateTotalCBM(item), 0);
    const totalExtraFreight = po.items.reduce((sum, item) => sum + (item.extraFreight || 0), 0);
    return { totalAmount, totalCBM, totalExtraFreight };
  };

  if (allocatedPOs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[var(--color-text-secondary)]">
          No purchase orders added. Click "Add PO" to select purchase orders.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {allocatedPOs.map((po) => {
        const totals = calculatePOTotals(po);
        return (
          <Card key={po.purchaseOrderId} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">{po.poNumber}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{po.supplierName}</p>
              </div>
              <button
                onClick={() => onRemovePO(po.purchaseOrderId)}
                className="text-red-600 hover:text-red-900"
                title="Remove PO"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      Item Code
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      Item Name
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      Ordered Qty
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      Loaded Qty
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      Remaining Qty
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      Load Qty
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      UOM
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      Price
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      CBM
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      Extra Freight
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                      Total CBM
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {po.items.map((item) => {
                    const error = getValidationError(item);
                    return (
                      <tr key={item.purchaseOrderItemId} className={error ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2 text-sm font-medium text-[var(--color-text)]">
                          {item.itemCode}
                        </td>
                        <td className="px-3 py-2 text-sm text-[var(--color-text)]">
                          {item.itemName}
                        </td>
                        <td className="px-3 py-2 text-sm text-right text-[var(--color-text)]">
                          {item.orderedQty.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-right text-[var(--color-text)]">
                          {item.loadedQty.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-[var(--color-text)]">
                          {item.remainingQty.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-right">
                          <div className="relative">
                            <input
                              type="number"
                              value={item.loadQty}
                              onChange={(e) =>
                                onUpdateItem(
                                  po.purchaseOrderId,
                                  item.purchaseOrderItemId,
                                  'loadQty',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className={`w-24 px-2 py-1 text-right border rounded ${
                                error ? 'border-red-500' : 'border-gray-300'
                              }`}
                              min="0"
                              max={item.remainingQty}
                              step="1"
                            />
                            {error && (
                              <div className="absolute top-full left-0 mt-1 z-10">
                                <div className="bg-red-100 border border-red-300 text-red-700 px-2 py-1 rounded text-xs whitespace-nowrap flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {error}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-center text-[var(--color-text)]">
                          {item.uom}
                        </td>
                        <td className="px-3 py-2 text-sm text-right text-[var(--color-text)]">
                          ${formatCurrency(item.price)}
                        </td>
                        <td className="px-3 py-2 text-sm text-right text-[var(--color-text)]">
                          {formatCBM(item.cbm)}
                        </td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-[var(--color-text)]">
                          ${formatCurrency(calculateAmount(item))}
                        </td>
                        <td className="px-3 py-2 text-sm text-right">
                          <input
                            type="number"
                            value={item.extraFreight}
                            onChange={(e) =>
                              onUpdateItem(
                                po.purchaseOrderId,
                                item.purchaseOrderItemId,
                                'extraFreight',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 px-2 py-1 text-right border border-gray-300 rounded"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-[var(--color-text)]">
                          {formatCBM(calculateTotalCBM(item))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <td colSpan={9} className="px-3 py-3 text-sm font-bold text-right text-[var(--color-text)]">
                      PO Totals:
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-[var(--color-text)]">
                      ${formatCurrency(totals.totalAmount)}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-[var(--color-text)]">
                      ${formatCurrency(totals.totalExtraFreight)}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-[var(--color-text)]">
                      {formatCBM(totals.totalCBM)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        );
      })}

      <Card className="p-4 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Container Totals</h3>
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-sm text-white/80">Total Amount</p>
              <p className="text-xl font-bold">
                $
                {formatCurrency(
                  allocatedPOs.reduce((sum, po) => sum + calculatePOTotals(po).totalAmount, 0)
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">Total Extra Freight</p>
              <p className="text-xl font-bold">
                $
                {formatCurrency(
                  allocatedPOs.reduce((sum, po) => sum + calculatePOTotals(po).totalExtraFreight, 0)
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">Total CBM</p>
              <p className="text-xl font-bold">
                {formatCBM(allocatedPOs.reduce((sum, po) => sum + calculatePOTotals(po).totalCBM, 0))}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
