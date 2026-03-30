import { useEffect, useState } from 'react';
import { X, CreditCard as Edit2, Phone, MapPin, Hash, GitBranch } from 'lucide-react';
import { banksService } from '../../services/banksService';
import { Bank } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ViewBankProps {
  bankId: number;
  onClose: () => void;
  onEdit?: (id: number) => void;
}

export const ViewBank = ({ bankId, onClose, onEdit }: ViewBankProps) => {
  const [bank, setBank] = useState<Bank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBank();
  }, [bankId]);

  const fetchBank = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await banksService.getById(bankId);
      setBank(data);
    } catch (err) {
      console.error('Failed to fetch bank:', err);
      setError('Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (onEdit && bank) onEdit(bank.bankId);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !bank) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4 p-8">
          <div className="text-center py-12">
            <p className="text-[var(--color-error)] text-lg mb-4">{error || 'No record found'}</p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-2xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div
            className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0"
            style={{ backgroundColor: '#1B3A57' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  Bank Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">Detailed information of a registered bank</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {onEdit && (
                  <Button
                    onClick={handleEdit}
                    className="bg-[var(--color-secondary)] hover:bg-[#E5A804] text-[var(--color-primary)] flex items-center gap-2"
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Bank Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">Bank Name</label>
                    <div className="text-xl font-semibold text-[var(--color-text)]">{bank.name}</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Account Number
                    </label>
                    <div className="text-base font-mono text-[var(--color-text)]">{bank.accountNumber}</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">Status</label>
                    <div>
                      {bank.isActive ? (
                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      Branch Code
                    </label>
                    <div className="text-base text-[var(--color-text)]">{bank.branchCode || 'N/A'}</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">Branch</label>
                    <div className="text-base text-[var(--color-text)]">{bank.branch || 'N/A'}</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact Number
                    </label>
                    <div className="text-base text-[var(--color-text)]">{bank.contactNumber || 'N/A'}</div>
                  </div>

                  <div className="sm:col-span-2 bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </label>
                    <div className="text-base text-[var(--color-text)] whitespace-pre-wrap">
                      {bank.address || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {(bank.createdAt || bank.createdBy) && (
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Audit Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bank.createdAt && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">Created At</label>
                        <div className="text-sm text-[var(--color-text)]">
                          {new Date(bank.createdAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {bank.createdBy && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">Created By</label>
                        <div className="text-sm text-[var(--color-text)]">{bank.createdBy}</div>
                      </div>
                    )}
                    {bank.updatedAt && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">Last Updated</label>
                        <div className="text-sm text-[var(--color-text)]">
                          {new Date(bank.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {bank.updatedBy && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">Updated By</label>
                        <div className="text-sm text-[var(--color-text)]">{bank.updatedBy}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0">
            {onEdit && (
              <Button
                onClick={handleEdit}
                className="bg-[var(--color-primary)] hover:opacity-90 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
            <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">
              Close
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
