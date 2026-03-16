import { useEffect, useState } from 'react';
import { X, DollarSign, Calendar, FileText, User, AlertCircle, Clock, CheckCircle, Send, ThumbsUp, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { poPaymentsService, POPaymentDetails } from '../../services/poPaymentsService';
import { paymentRequestsService } from '../../services/paymentRequestsService';

interface ViewPOPaymentDetailsProps {
  paymentId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const ViewPOPaymentDetails = ({ paymentId, onClose, onSuccess }: ViewPOPaymentDetailsProps) => {
  const [details, setDetails] = useState<POPaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [paymentId]);

  const loadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await poPaymentsService.getDetails(paymentId);
      setDetails(data);
    } catch (err: any) {
      console.error('Failed to load payment details:', err);
      setError(err.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayment = async () => {
    if (!details) return;

    setSubmitting(true);
    setError(null);
    try {
      await poPaymentsService.requestPayment(details.purchaseOrderPaymentId);
      setShowConfirmDialog(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create payment request:', err);
      setError(err.message || 'Failed to create payment request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!details) return;

    setApproving(true);
    setError(null);
    try {
      await poPaymentsService.approveRequest(details.purchaseOrderPaymentId);
      setShowApproveDialog(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to approve payment request:', err);
      setError(err.message || 'Failed to approve payment request');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!details) return;

    setRejecting(true);
    setError(null);
    try {
      await poPaymentsService.rejectRequest(details.purchaseOrderPaymentId);
      setShowRejectDialog(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to reject payment request:', err);
      setError(err.message || 'Failed to reject payment request');
    } finally {
      setRejecting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pending':
        return {
          icon: Clock,
          color: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
          label: 'Pending',
        };
      case 'Requested':
        return {
          icon: Send,
          color: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
          label: 'Requested',
        };
      case 'Approved':
        return {
          icon: ThumbsUp,
          color: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
          label: 'Approved',
        };
      case 'Paid':
        return {
          icon: CheckCircle,
          color: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
          label: 'Paid',
        };
      case 'Rejected':
        return {
          icon: AlertCircle,
          color: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
          label: 'Rejected',
        };
      default:
        return {
          icon: FileText,
          color: 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
          label: status,
        };
    }
  };

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Payment Details">
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading payment details...</div>
      </Modal>
    );
  }

  if (error || !details) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Payment Details">
        <div className="text-center py-8">
          <div className="text-lg text-red-600 mb-4">{error || 'Payment details not found'}</div>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  const isPending = details.status === 'Pending';
  const isRequested = details.status === 'Requested';
  const isApproved = details.status === 'Approved';
  const isRejected = details.status === 'Rejected';

  const requestAmountLabel = isPending || isRejected ? 'Requesting Amount' : 'Requested Amount';

  const balanceAfterPayment = details.totalPOAmount - details.paidAmount - details.expectedAmount;
  const isBalanceNegative = balanceAfterPayment < 0;

  const statusConfig = getStatusConfig(details.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="PO Payment Details">
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">{details.poNumber}</h2>
                  <p className="text-sm text-white/90">Payment Request Details</p>
                </div>
              </div>
              <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg flex items-center gap-2 ${statusConfig.color}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-white/80 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white/70">Supplier</p>
                  <p className="text-base font-semibold text-white">{details.supplierName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-white/80 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white/70">Due Date</p>
                  <p className="text-base font-semibold text-white">
                    {new Date(details.defaultDueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">PO Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-base text-[var(--color-text-secondary)]">Total PO Amount</span>
                <span className="text-base font-semibold text-[var(--color-text)]">
                  ${formatCurrency(details.totalPOAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-base text-[var(--color-text-secondary)]">Paid Amount</span>
                <span className="text-base font-semibold text-[var(--color-text)]">
                  ${formatCurrency(details.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg -mx-2">
                <span className="text-base font-bold text-[var(--color-primary)]">{requestAmountLabel}</span>
                <span className="text-lg font-bold text-[var(--color-primary)]">
                  ${formatCurrency(details.requestedAmount || details.expectedAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-semibold text-[var(--color-text)]">Balance After Payment</span>
                <span className={`text-base font-bold ${isBalanceNegative ? 'text-red-600' : 'text-green-600'}`}>
                  ${formatCurrency(balanceAfterPayment)}
                </span>
              </div>
            </div>
          </Card>

          {details.description && (
            <Card className="p-4 bg-gray-50">
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Description</p>
              <p className="text-base text-[var(--color-text)]">{details.description}</p>
            </Card>
          )}

          {isBalanceNegative && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Warning</p>
                  <p className="text-sm text-red-700 mt-1">
                    Balance is less than requesting amount. Cannot proceed with payment request.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onClose} variant="secondary" className="flex-1">
              {isApproved || isRequested ? 'Close' : 'Cancel'}
            </Button>
            {(isPending || isRejected) && (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isBalanceNegative}
                className="flex-1"
                title={
                  isBalanceNegative
                    ? 'Balance is less than requesting amount'
                    : 'Request payment'
                }
              >
                {isRejected ? 'Request Payment Again' : 'Request Payment'}
              </Button>
            )}
            {isRequested && (
              <>
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {showConfirmDialog && (
        <Modal
          isOpen={true}
          onClose={() => setShowConfirmDialog(false)}
          title="Confirm Payment Request"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Are you sure you want to raise a payment request for this PO payment?
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Amount: <span className="font-semibold">{formatCurrency(details.expectedAmount)}</span>
                </p>
                <p className="text-sm text-blue-700">
                  Supplier: <span className="font-semibold">{details.supplierName}</span>
                </p>
                <p className="text-sm text-blue-700">
                  PO Number: <span className="font-semibold">{details.poNumber}</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmDialog(false)}
                variant="secondary"
                className="flex-1"
                disabled={submitting}
              >
                No
              </Button>
              <Button
                onClick={handleRequestPayment}
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Yes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showApproveDialog && (
        <Modal
          isOpen={true}
          onClose={() => setShowApproveDialog(false)}
          title="Confirm Payment Approval"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-900">
                  Are you sure you want to approve this payment request?
                </p>
                <p className="text-sm text-purple-700 mt-2">
                  Amount: <span className="font-semibold">${formatCurrency(details.requestedAmount || details.expectedAmount)}</span>
                </p>
                <p className="text-sm text-purple-700">
                  Supplier: <span className="font-semibold">{details.supplierName}</span>
                </p>
                <p className="text-sm text-purple-700">
                  PO Number: <span className="font-semibold">{details.poNumber}</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setShowApproveDialog(false)}
                variant="secondary"
                className="flex-1"
                disabled={approving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveRequest}
                className="flex-1"
                disabled={approving}
              >
                {approving ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showRejectDialog && (
        <Modal
          isOpen={true}
          onClose={() => setShowRejectDialog(false)}
          title="Confirm Payment Rejection"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Are you sure you want to reject this payment request?
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Amount: <span className="font-semibold">${formatCurrency(details.requestedAmount || details.expectedAmount)}</span>
                </p>
                <p className="text-sm text-red-700">
                  Supplier: <span className="font-semibold">{details.supplierName}</span>
                </p>
                <p className="text-sm text-red-700">
                  PO Number: <span className="font-semibold">{details.poNumber}</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setShowRejectDialog(false)}
                variant="secondary"
                className="flex-1"
                disabled={rejecting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectRequest}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={rejecting}
              >
                {rejecting ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
