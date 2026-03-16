import { useState } from 'react';
import { DollarSign, Calendar, CreditCard, FileText, AlertCircle, Package, Ship, Truck, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { paymentsService, MakePaymentRequest } from '../../services/paymentsService';

interface MakePaymentFormProps {
  requestId: number;
  requestAmount: number;
  sourceContext?: {
    referenceNumber: string;
    referenceType: string;
    referenceDate: string;
    partyName: string;
    totalAmount: number;
    totalPaidAmount: number;
    currencyCode: string;
    exchangeRate: number;
  };
  vendorName?: string;
  vendorType?: string;
  dueDate?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MakePaymentForm({
  requestId,
  requestAmount,
  sourceContext,
  vendorName,
  vendorType,
  dueDate,
  isOpen,
  onClose,
  onSuccess,
}: MakePaymentFormProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MakePaymentRequest>({
    paymentRequestId: requestId,
    paymentMethod: 'BankTransfer',
    referenceNo: '',
    paidAmount: requestAmount,
    paidDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.referenceNo.trim()) {
      setError('Reference number is required');
      return;
    }

    if (formData.paidAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (sourceContext) {
      const maxAllowed = sourceContext.totalAmount - sourceContext.totalPaidAmount;
      if (formData.paidAmount > maxAllowed) {
        setError(`Payment amount cannot exceed remaining balance of ${formatCurrency(maxAllowed, sourceContext.currencyCode)}`);
        return;
      }

      if (formData.paidAmount > requestAmount * 1.1) {
        setError(`Payment amount cannot exceed 110% of the requested amount (${formatCurrency(requestAmount * 1.1, sourceContext.currencyCode)})`);
        return;
      }
    }

    const paymentDate = new Date(formData.paidDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (paymentDate > today) {
      setError('Payment date cannot be in the future');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await paymentsService.makePayment(formData);
      setShowConfirmation(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process payment');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currencyCode?: string) => {
    return `${currencyCode || 'USD'} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSourceModuleIcon = (referenceType?: string) => {
    if (!referenceType) return FileText;
    if (referenceType.toLowerCase().includes('purchase')) return Package;
    if (referenceType.toLowerCase().includes('shipment')) return Ship;
    if (referenceType.toLowerCase().includes('transport')) return Truck;
    return FileText;
  };

  const remainingBalance = sourceContext
    ? sourceContext.totalAmount - sourceContext.totalPaidAmount - requestAmount
    : 0;

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen && !showConfirmation} onClose={onClose} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {sourceContext && (
            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-t-lg -mt-6 -mx-6 px-6 py-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const Icon = getSourceModuleIcon(sourceContext.referenceType);
                  return <Icon className="w-6 h-6 text-white" />;
                })()}
                <div>
                  <h2 className="text-xl font-bold text-white">{sourceContext.referenceNumber}</h2>
                  <p className="text-sm text-white/90">Make Payment</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendorName && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-white/80 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white/70">{vendorType || 'Vendor'}</p>
                      <p className="text-base font-semibold text-white">{vendorName}</p>
                    </div>
                  </div>
                )}
                {dueDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-white/80 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white/70">Due Date</p>
                      <p className="text-base font-semibold text-white">{formatDate(dueDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!sourceContext && (
            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-t-lg -mt-6 -mx-6 px-6 py-5 text-white">
              <h2 className="text-xl font-bold text-white">Make Payment</h2>
              <p className="text-sm text-white/90">Process payment request</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mt-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {sourceContext && (
            <div className="bg-white rounded-lg border p-6 mt-4">
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-base text-[var(--color-text-secondary)]">Total Amount</span>
                  <span className="text-base font-semibold text-[var(--color-text)]">
                    ${formatCurrency(sourceContext.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-base text-[var(--color-text-secondary)]">Paid Amount</span>
                  <span className="text-base font-semibold text-[var(--color-text)]">
                    ${formatCurrency(sourceContext.totalPaidAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg -mx-2">
                  <span className="text-base font-bold text-[var(--color-primary)]">Requesting Amount</span>
                  <span className="text-lg font-bold text-[var(--color-primary)]">
                    ${formatCurrency(requestAmount)}
                  </span>
                </div>
                {sourceContext.currencyCode !== 'USD' && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-lg -mx-2">
                    <span className="text-base font-bold text-amber-700">Amount in {sourceContext.currencyCode}</span>
                    <span className="text-lg font-bold text-amber-700">
                      {sourceContext.currencyCode} {(requestAmount * sourceContext.exchangeRate).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-semibold text-[var(--color-text)]">Balance After Payment</span>
                  <span className="text-base font-bold text-green-600">
                    ${formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-4">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[var(--color-primary)]" />
              Payment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.paidDate}
                  onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white dark:bg-gray-700 text-[var(--color-text-primary)]"
                  required
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                  Default: Today • No future dates allowed
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  Reference Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.referenceNo}
                  onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white dark:bg-gray-700 text-[var(--color-text-primary)]"
                  placeholder="UTR / Cheque / Transaction ID"
                  required
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                  Bank reference, UTR number, or cheque number
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white dark:bg-gray-700 text-[var(--color-text-primary)]"
                  required
                >
                  <option value="BankTransfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="OnlineTransfer">Online Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  <DollarSign className="w-4 h-4 text-[var(--color-primary)]" />
                  Paid Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white dark:bg-gray-700 text-[var(--color-text-primary)]"
                  required
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                  Request amount: {formatCurrency(requestAmount, sourceContext?.currencyCode)}
                </p>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white dark:bg-gray-700 text-[var(--color-text-primary)]"
                  rows={3}
                  placeholder="Enter any additional notes or comments (optional)"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <DollarSign className="w-4 h-4" />
              Make Payment
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Payment"
      >
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Confirm Payment</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Are you sure you want to complete this payment?
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Payment Method:</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {formData.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Reference No:</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {formData.referenceNo}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Amount:</span>
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                {formatCurrency(formData.paidAmount, sourceContext?.currencyCode)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Payment Date:</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {new Date(formData.paidDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmation(false)}
              disabled={loading}
            >
              No, Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? 'Processing...' : 'Yes, Confirm Payment'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
