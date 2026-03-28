import { useState, useEffect } from 'react';
import { X, AlertCircle, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { POItemForAllocation } from '../../services/containersService';

export interface AllocatedItemData {
  purchaseOrderItemId: number;
  productId: number;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  loadedQty: number;
  remainingQty: number;
  loadQty: number;
  uom: string;
  price: number;
  cbm: number;
  amount: number;
  extraFreight: number;
  totalCBM: number;
}

interface POItemAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (items: AllocatedItemData[]) => void;
  poNumber: string;
  supplierName: string;
  availableItems: POItemForAllocation[];
  selectedItems: AllocatedItemData[];
  isViewMode?: boolean;
}

export const POItemAllocationModal = ({
  isOpen,
  onClose,
  onSave,
  poNumber,
  supplierName,
  availableItems,
  selectedItems,
  isViewMode = false,
}: POItemAllocationModalProps) => {
  const [items, setItems] = useState<AllocatedItemData[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const mergedItems = availableItems.map((availItem) => {
        const existingItem = selectedItems.find(
          (s) => s.purchaseOrderItemId === availItem.purchaseOrderItemId
        );
        if (existingItem) {
          return {
            ...existingItem,
            remainingQty: availItem.remainingQty + existingItem.loadQty,
          };
        }
        return { ...availItem };
      });
      setItems(mergedItems);

      const initialSelected = new Set<number>();
      selectedItems.forEach((item) => {
        if (item.loadQty > 0) {
          initialSelected.add(item.purchaseOrderItemId);
        }
      });
      setSelectedRowIds(initialSelected);
    }
  }, [isOpen, availableItems, selectedItems]);

  const handleRowSelect = (itemId: number, isSelected: boolean) => {
    setSelectedRowIds((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(itemId);
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.purchaseOrderItemId === itemId && item.loadQty === 0
              ? { ...item, loadQty: item.remainingQty }
              : item
          )
        );
      } else {
        newSet.delete(itemId);
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.purchaseOrderItemId === itemId
              ? { ...item, loadQty: 0, extraFreight: 0 }
              : item
          )
        );
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = new Set(items.map((item) => item.purchaseOrderItemId));
      setSelectedRowIds(allIds);
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.loadQty === 0 ? { ...item, loadQty: item.remainingQty } : item
        )
      );
    } else {
      setSelectedRowIds(new Set());
      setItems((prevItems) =>
        prevItems.map((item) => ({ ...item, loadQty: 0, extraFreight: 0 }))
      );
    }
  };

  const handleUpdateItem = (
    itemId: number,
    field: 'loadQty' | 'extraFreight',
    value: number
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.purchaseOrderItemId === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCBM = (cbm: number) => {
    return cbm.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const calculateAmount = (item: AllocatedItemData) => {
    return item.loadQty * item.price;
  };

  const calculateTotalCBM = (item: AllocatedItemData) => {
    return item.loadQty * item.cbm;
  };

  const getValidationError = (item: AllocatedItemData) => {
    const isSelected = selectedRowIds.has(item.purchaseOrderItemId);
    if (isSelected && item.loadQty <= 0) return 'Load quantity must be greater than 0';
    if (item.loadQty < 0) return 'Load quantity cannot be negative';
    if (item.loadQty > item.remainingQty) return 'Load quantity exceeds remaining quantity';
    return null;
  };

  const hasValidationErrors = items.some((item) => getValidationError(item) !== null);

  const selectedItems_ = items.filter((item) => selectedRowIds.has(item.purchaseOrderItemId));
  const hasSelectedWithZeroLoadQty = selectedItems_.some((item) => item.loadQty <= 0);

  const totals = items.reduce(
    (acc, item) => ({
      amount: acc.amount + calculateAmount(item),
      totalCBM: acc.totalCBM + calculateTotalCBM(item),
      extraFreight: acc.extraFreight + (item.extraFreight || 0),
    }),
    { amount: 0, totalCBM: 0, extraFreight: 0 }
  );

  const handleSave = () => {
    if (hasValidationErrors || hasSelectedWithZeroLoadQty) return;
    onSave(items);
    onClose();
  };

  const isAllSelected = items.length > 0 && selectedRowIds.size === items.length;
  const isSomeSelected = selectedRowIds.size > 0 && selectedRowIds.size < items.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-[90vw] max-w-6xl max-h-[90vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div
            className="border-b border-[var(--color-border)] px-6 py-4 flex-shrink-0"
            style={{ backgroundColor: '#1B3A57' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isViewMode ? 'View Items' : 'Edit Item Allocation'}
                </h2>
                <p className="text-sm text-gray-300 mt-1">
                  {poNumber} - {supplierName}
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="secondary"
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-6" style={{ backgroundColor: '#F9FAFB' }}>
            {!isViewMode && (
              <div className="mb-3 text-sm text-gray-600">
                Select items to allocate. Only selected rows can be edited.
              </div>
            )}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {!isViewMode && (
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeSelected;
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item Code
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item Name
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Ordered Qty
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Loaded Qty
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Remaining Qty
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Load Qty
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      UOM
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      CBM
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Extra Freight
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total CBM
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => {
                    const error = getValidationError(item);
                    const isSelected = selectedRowIds.has(item.purchaseOrderItemId);
                    return (
                      <tr
                        key={item.purchaseOrderItemId}
                        className={
                          error
                            ? 'bg-red-50'
                            : isSelected && !isViewMode
                            ? 'bg-blue-50'
                            : ''
                        }
                      >
                        {!isViewMode && (
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                handleRowSelect(item.purchaseOrderItemId, e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                        )}
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">
                          {item.itemCode}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.itemName}</td>
                        <td className="px-3 py-2 text-sm text-right text-gray-900">
                          {item.orderedQty.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-right text-gray-900">
                          {item.loadedQty.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900">
                          {item.remainingQty.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-right">
                          {isViewMode ? (
                            <span className="font-semibold">{item.loadQty.toLocaleString()}</span>
                          ) : (
                            <div className="relative">
                              <input
                                type="number"
                                value={item.loadQty}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.purchaseOrderItemId,
                                    'loadQty',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                disabled={!isSelected}
                                className={`w-24 px-2 py-1 text-right border rounded ${
                                  error ? 'border-red-500' : 'border-gray-300'
                                } ${!isSelected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
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
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-center text-gray-900">
                          {item.uom}
                        </td>
                        <td className="px-3 py-2 text-sm text-right text-gray-900">
                          ${formatCurrency(item.price)}
                        </td>
                        <td className="px-3 py-2 text-sm text-right text-gray-900">
                          {formatCBM(item.cbm)}
                        </td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900">
                          ${formatCurrency(calculateAmount(item))}
                        </td>
                        <td className="px-3 py-2 text-sm text-right">
                          {isViewMode ? (
                            <span>${formatCurrency(item.extraFreight)}</span>
                          ) : (
                            <input
                              type="number"
                              value={item.extraFreight}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.purchaseOrderItemId,
                                  'extraFreight',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              disabled={!isSelected}
                              className={`w-24 px-2 py-1 text-right border border-gray-300 rounded ${
                                !isSelected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                              }`}
                              min="0"
                              step="0.01"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900">
                          {formatCBM(calculateTotalCBM(item))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan={isViewMode ? 9 : 10} className="px-3 py-3 text-sm font-bold text-right text-gray-900">
                      Totals:
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-gray-900">
                      ${formatCurrency(totals.amount)}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-gray-900">
                      ${formatCurrency(totals.extraFreight)}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-gray-900">
                      {formatCBM(totals.totalCBM)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 bg-white flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button
                type="button"
                onClick={handleSave}
                disabled={hasValidationErrors || hasSelectedWithZeroLoadQty}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
