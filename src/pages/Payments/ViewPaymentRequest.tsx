import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, DollarSign, Calendar, Clock, CheckCircle, Building, FileText,
  User, AlertTriangle, Package, ExternalLink, XCircle, Truck, Ship, CreditCard
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { paymentsService, PaymentRequestDetails } from '../../services/paymentsService';
import { paymentRequestsService } from '../../services/paymentRequestsService';
import { ViewPurchaseOrder } from '../Purchase/ViewPurchaseOrder';

interface ViewPaymentRequestProps {
  requestId: number;
  isOpen: boolean;
  onClose: () => void;
  onMakePayment: (requestId: number, sourceContext: any) => void;
  onRefresh?: () => void;
}

export function ViewPaymentRequest({ requestId, isOpen, onClose, onMakePayment, onRefresh }: ViewPaymentRequestProps) {
  const navigate = useNavigate();
  const [request, setRequest] = useState<PaymentRequestDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paidDate: new Date().toISOString().split('T')[0],
    referenceNo: '',
    paymentMethod: 'OnlineTransfer',
    paidAmount: 0,
    remarks: ''
  });

  useEffect(() => {
    if (isOpen && requestId) {
      loadRequest();
      setShowPaymentForm(false);
      setShowPurchaseOrderModal(false);
      setPaymentData({
        paidDate: new Date().toISOString().split('T')[0],
        referenceNo: '',
        paymentMethod: 'OnlineTransfer',
        paidAmount: 0,
        remarks: ''
      });
    }
  }, [isOpen, requestId]);

  const loadRequest = async () => {
    setLoading(true);
    try {
      const data = await paymentsService.getPaymentRequestDetails(requestId);
      setRequest(data);
      setPaymentData(prev => ({ ...prev, paidAmount: data.requestAmount }));
    } catch (error) {
      console.error('Failed to load payment request:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currencyCode?: string) => {
    return `${currencyCode || 'USD'} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status !== 'Approved') return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: any }> = {
      Approved: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      Paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      Rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    return configs[status] || configs.Approved;
  };

  const getSourceModuleIcon = (module: string) => {
    const icons: Record<string, any> = {
      Purchase: Package,
      Shipment: Ship,
      Transport: Truck,
    };
    return icons[module] || FileText;
  };

  const handleViewMore = () => {
    if (!request?.sourceContext.hasMoreDetails) return;

    const { sourceModule, sourceContext } = request;

    if (sourceModule === 'Purchase') {
      setShowPurchaseOrderModal(true);
    } else if (sourceModule === 'Shipment') {
      onClose();
      navigate(`/shipments/${sourceContext.referenceId}`);
    } else if (sourceModule === 'Transport') {
      onClose();
      navigate(`/transport/${sourceContext.referenceId}`);
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) {
      return;
    }

    setRejecting(true);
    try {
      await paymentRequestsService.rejectRequest(requestId);
      setShowRejectDialog(false);
      setRejectRemarks('');
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to reject payment request:', error);
    } finally {
      setRejecting(false);
    }
  };

  const handleMakePaymentClick = () => {
    setShowPaymentForm(true);
  };

  const handleSubmitPayment = async () => {
    if (!paymentData.referenceNo.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await paymentsService.makePayment({
        paymentRequestId: requestId,
        paidDate: paymentData.paidDate,
        referenceNo: paymentData.referenceNo,
        paymentMethod: paymentData.paymentMethod,
        paidAmount: request!.requestAmount,
        remarks: paymentData.remarks
      });
      setShowConfirmDialog(false);
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to make payment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = () => {
    if (!paymentData.referenceNo.trim()) {
      return;
    }
    setShowConfirmDialog(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen && !showRejectDialog} onClose={onClose} size="xl">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-[var(--color-text-secondary)]">Loading...</p>
          </div>
        ) : request ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-t-lg -mt-6 -mx-6 px-6 py-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getSourceModuleIcon(request.sourceModule);
                    return <Icon className="w-6 h-6 text-white" />;
                  })()}
                  <div>
                    <h2 className="text-xl font-bold text-white">{request.sourceContext.referenceNumber}</h2>
                    <p className="text-sm text-white/90">Payment Request Details</p>
                  </div>
                </div>
                {(() => {
                  const statusConfig = getStatusConfig(request.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg flex items-center gap-2 ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {request.status}
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-white/80 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white/70">{request.vendorType}</p>
                    <p className="text-base font-semibold text-white">{request.vendorName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-white/80 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white/70">Due Date</p>
                    <p className={`text-base font-semibold ${isOverdue(request.dueDate, request.status) ? 'text-red-300' : 'text-white'}`}>
                      {formatDate(request.dueDate)}
                      {isOverdue(request.dueDate, request.status) && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">OVERDUE</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Source Details</h3>
                {request.sourceContext.hasMoreDetails && (
                  <Button
                    onClick={handleViewMore}
                    variant="secondary"
                    className="flex items-center gap-2 text-sm"
                  >
                    View More
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-blue-700 dark:text-blue-400 font-semibold mb-1">Source</p>
                  <p className="font-bold text-blue-900 dark:text-blue-300 text-base">{request.sourceContext.referenceType}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-secondary)] mb-1">Created Date</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{formatDate(request.sourceContext.referenceDate)}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-secondary)] mb-1">Party Name</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{request.sourceContext.partyName}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-secondary)] mb-1">Exchange Rate</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{request.sourceContext.exchangeRate.toFixed(4)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-base text-[var(--color-text-secondary)]">Total Amount</span>
                  <span className="text-base font-semibold text-[var(--color-text)]">
                    ${formatCurrency(request.sourceContext.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-base text-[var(--color-text-secondary)]">Paid Amount</span>
                  <span className="text-base font-semibold text-[var(--color-text)]">
                    ${formatCurrency(request.sourceContext.totalPaidAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg -mx-2">
                  <span className="text-base font-bold text-[var(--color-primary)]">Requesting Amount</span>
                  <span className="text-lg font-bold text-[var(--color-primary)]">
                    ${formatCurrency(request.requestAmount)}
                  </span>
                </div>
                {request.sourceContext.currencyCode !== 'USD' && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-lg -mx-2">
                    <span className="text-base font-bold text-amber-700">Amount in {request.sourceContext.currencyCode}</span>
                    <span className="text-lg font-bold text-amber-700">
                      {request.sourceContext.currencyCode} {(request.requestAmount * request.sourceContext.exchangeRate).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-semibold text-[var(--color-text)]">Balance After Payment</span>
                  <span className="text-base font-bold text-green-600">
                    ${formatCurrency(request.sourceContext.totalAmount - request.sourceContext.totalPaidAmount - request.requestAmount)}
                  </span>
                </div>
              </div>
            </div>

            {request.description && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-700 font-semibold mb-1">DESCRIPTION</p>
                <p className="text-sm text-blue-900">{request.description}</p>
              </div>
            )}

            {showPaymentForm && request.status === 'Approved' && (
              <div className="rounded-lg border p-6" style={{ backgroundColor: 'rgb(239 246 255)', borderColor: 'rgb(216 224 241)' }}>
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-900" />
                  Payment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <Calendar className="w-4 h-4 text-gray-900" />
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={paymentData.paidDate}
                      onChange={(e) => setPaymentData({ ...paymentData, paidDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                      style={{ borderColor: 'rgb(216 224 241)' }}
                      required
                    />
                    <p className="text-xs text-blue-700 mt-1.5 font-medium">
                      Default: Today • No future dates allowed
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <FileText className="w-4 h-4 text-gray-900" />
                      Reference Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentData.referenceNo}
                      onChange={(e) => setPaymentData({ ...paymentData, referenceNo: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                      style={{ borderColor: 'rgb(216 224 241)' }}
                      placeholder="UTR / Cheque / Transaction ID"
                      required
                    />
                    <p className="text-xs text-blue-700 mt-1.5 font-medium">
                      Bank reference, UTR number, or cheque number
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <CreditCard className="w-4 h-4 text-gray-900" />
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                      style={{ borderColor: 'rgb(216 224 241)' }}
                      required
                    >
                      <option value="OnlineTransfer">Online Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <FileText className="w-4 h-4 text-gray-900" />
                      Remarks
                    </label>
                    <textarea
                      value={paymentData.remarks}
                      onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                      style={{ borderColor: 'rgb(216 224 241)' }}
                      rows={3}
                      placeholder="Enter any additional notes or comments (optional)"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-2 border-t">
              <span>Created by {request.createdBy}</span>
              <span>{formatDate(request.createdAt)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              {request.status === 'Approved' ? (
                <>
                  {!showPaymentForm ? (
                    <>
                      <Button variant="secondary" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setShowRejectDialog(true)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={handleMakePaymentClick}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        <DollarSign className="w-4 h-4" />
                        Make Payment
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setShowPaymentForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmPayment}
                        disabled={!paymentData.referenceNo.trim()}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Submit Payment
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Button onClick={onClose}>Close</Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[var(--color-text-secondary)]">Payment request not found</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setRejectRemarks('');
        }}
        title="Reject Payment Request"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Confirm Rejection</h4>
                <p className="text-sm text-red-700 mt-1">
                  Are you sure you want to reject this payment request? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
              Rejection Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Please provide a reason for rejecting this payment request"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectRemarks('');
              }}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectRemarks.trim() || rejecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Confirm Payment"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Confirm Payment Submission</h4>
                <p className="text-sm text-green-700 mt-1">
                  Please review the payment details before submitting. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-secondary)]">Payment Date</span>
              <span className="text-sm font-semibold text-[var(--color-text)]">{formatDate(paymentData.paidDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-secondary)]">Reference Number</span>
              <span className="text-sm font-semibold text-[var(--color-text)]">{paymentData.referenceNo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-secondary)]">Payment Method</span>
              <span className="text-sm font-semibold text-[var(--color-text)]">{paymentData.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-base font-bold text-[var(--color-text)]">Amount</span>
              <span className="text-lg font-bold text-green-600">${request?.requestAmount.toFixed(2)}</span>
            </div>
            {paymentData.remarks && (
              <div className="pt-2 border-t">
                <span className="text-sm text-[var(--color-text-secondary)]">Remarks</span>
                <p className="text-sm text-[var(--color-text)] mt-1">{paymentData.remarks}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </div>
        </div>
      </Modal>

      {request?.sourceContext?.referenceId && showPurchaseOrderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPurchaseOrderModal(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ViewPurchaseOrder
              purchaseOrderId={request.sourceContext.referenceId}
              onClose={() => setShowPurchaseOrderModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
