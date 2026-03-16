import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { POForSelection } from '../../services/containersService';

interface POSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedPOs: POForSelection[]) => void;
  availablePOs: POForSelection[];
  alreadySelectedPOIds: number[];
}

export const POSelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  availablePOs,
  alreadySelectedPOIds,
}: POSelectionModalProps) => {
  const [searchText, setSearchText] = useState('');
  const [selectedPOs, setSelectedPOs] = useState<Set<number>>(new Set());
  const [filteredPOs, setFilteredPOs] = useState<POForSelection[]>([]);

  useEffect(() => {
    const filtered = availablePOs.filter(
      (po) =>
        !alreadySelectedPOIds.includes(po.purchaseOrderId) &&
        (po.poNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          po.supplierName.toLowerCase().includes(searchText.toLowerCase()))
    );
    setFilteredPOs(filtered);
  }, [searchText, availablePOs, alreadySelectedPOIds]);

  const handleToggle = (poId: number) => {
    const newSelected = new Set(selectedPOs);
    if (newSelected.has(poId)) {
      newSelected.delete(poId);
    } else {
      newSelected.add(poId);
    }
    setSelectedPOs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPOs.size === filteredPOs.length) {
      setSelectedPOs(new Set());
    } else {
      setSelectedPOs(new Set(filteredPOs.map((po) => po.purchaseOrderId)));
    }
  };

  const handleConfirm = () => {
    const selected = availablePOs.filter((po) => selectedPOs.has(po.purchaseOrderId));
    onSelect(selected);
    setSelectedPOs(new Set());
    setSearchText('');
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCBM = (cbm: number) => {
    return cbm.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Purchase Orders">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by PO Number or Supplier"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPOs.size === filteredPOs.length && filteredPOs.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                  PO Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                  Supplier
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                  PO Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                  Total CBM
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
                    No purchase orders available
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => (
                  <tr
                    key={po.purchaseOrderId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleToggle(po.purchaseOrderId)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPOs.has(po.purchaseOrderId)}
                        onChange={() => handleToggle(po.purchaseOrderId)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--color-text)]">
                      {po.poNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text)]">{po.supplierName}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--color-text)]">
                      ${formatCurrency(po.poAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--color-text)]">
                      {formatCBM(po.totalCBM)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center pt-2">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {selectedPOs.size} PO(s) selected
          </p>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={selectedPOs.size === 0}>
              Add Selected POs
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
