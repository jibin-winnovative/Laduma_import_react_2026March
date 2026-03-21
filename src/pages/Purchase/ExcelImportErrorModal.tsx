import { AlertCircle } from 'lucide-react';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Excel Import Error">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="flex-shrink-0">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Import Failed</h2>
            <p className="text-gray-700 dark:text-gray-300">{message}</p>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">Errors:</h3>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {missingItems.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Missing or Invalid Items
            </h3>
            <div className="overflow-x-auto max-h-96 border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      CBM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {missingItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {item.rowNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {item.itemCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {item.qty}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {item.cbm}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {item.price}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {item.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
