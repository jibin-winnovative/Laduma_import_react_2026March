import { AlertCircle, XCircle, FileX, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { MissingItem } from '../../services/purchaseOrdersService';

interface ExcelImportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  missingItems: MissingItem[];
  errors?: string[];
}

export function ExcelImportErrorModal({
  isOpen,
  onClose,
  message,
  missingItems,
  errors = [],
}: ExcelImportErrorModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excel Import Error" size="xl">
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">
              Import Failed
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
          </div>
        </div>

        {errors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-semibold text-[var(--color-text)]">
                Validation Errors
              </h3>
            </div>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r"
                >
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {error}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {missingItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileX className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-base font-semibold text-[var(--color-text)]">
                Missing or Invalid Items ({missingItems.length})
              </h3>
            </div>
            <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Item Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      CBM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {missingItems.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.rowNumber}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.itemCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]">
                        {item.qty}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]">
                        {item.cbm}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]">
                        {item.price}
                      </td>
                      <td className="px-4 py-4 text-sm text-red-600 dark:text-red-400">
                        {item.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
