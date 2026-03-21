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
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-6 rounded-t-lg border-b-4 border-red-500">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-red-500 rounded-full p-3">
            <FileX className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-1">
              Excel Import Failed
            </h2>
            <p className="text-gray-700 dark:text-gray-300 font-medium">{message}</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {errors.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Validation Errors
              </h3>
            </div>
            <div className="grid gap-3">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 leading-relaxed">
                    {error}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {missingItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Missing or Invalid Items ({missingItems.length})
              </h3>
            </div>
            <div className="overflow-hidden border border-gray-300 dark:border-gray-600 rounded-lg shadow-md">
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Row
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Item Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        CBM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {missingItems.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {item.rowNumber}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.itemCode}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {item.qty}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {item.cbm}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {item.price}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            {item.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg flex justify-end gap-3">
        <Button
          type="button"
          onClick={onClose}
          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold px-6 shadow-md"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}
