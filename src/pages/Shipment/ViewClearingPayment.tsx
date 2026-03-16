import { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckCircle, XCircle, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  clearingPaymentsService,
  ClearingPaymentDetail,
  PaymentStatus,
} from '../../services/clearingPaymentsService';

interface ViewClearingPaymentProps {
  clearingPaymentId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const ViewClearingPayment = ({
  clearingPaymentId,
  onClose,
  onSuccess,
}: ViewClearingPaymentProps) => {
  const [data, setData] = useState<ClearingPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [clearingPaymentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await clearingPaymentsService.getById(clearingPaymentId);
      setData(result);
    } catch (err) {
      console.error('Failed to load clearing payment:', err);
      setError('Failed to load clearing payment details.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!data) return;
    setActionLoading(true);
    setError(null);
    try {
      await clearingPaymentsService.requestPayment(clearingPaymentId);
      onSuccess();
    } catch (err: any) {
      console.error('Request failed:', err);
      setError(err?.response?.data?.message || 'Failed to request payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!data) return;
    setActionLoading(true);
    setError(null);
    try {
      await clearingPaymentsService.approvePayment(clearingPaymentId);
      onSuccess();
    } catch (err: any) {
      console.error('Approve failed:', err);
      setError(err?.response?.data?.message || 'Failed to approve payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!data) return;
    if (!confirm('Are you sure you want to reject this clearing payment?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await clearingPaymentsService.rejectPayment(clearingPaymentId);
      onSuccess();
    } catch (err: any) {
      console.error('Reject failed:', err);
      setError(err?.response?.data?.message || 'Failed to reject payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      case 'Requested':
        return 'bg-blue-100 text-blue-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12 text-gray-500">No data found</div>
      </div>
    );
  }

  const purchaseOrders = data.pOs || data.purchaseOrders || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Clearing Payment Details
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            View clearing payment information
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusBadge(data.status)}`}>
          {data.status}
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
          Header Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Container</label>
            <p className="text-base font-semibold text-gray-900">{data.containerNumber || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Clearing Agent</label>
            <p className="text-base font-semibold text-gray-900">{data.clearingAgentName || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Payment Date</label>
            <p className="text-base font-semibold text-gray-900">{formatDate(data.paymentDate)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Bill Date</label>
            <p className="text-base font-semibold text-gray-900">{formatDate(data.billDate)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Clearing Amount</label>
            <p className="text-base font-semibold text-gray-900">{fmt(data.clearingAmount)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(data.status)}`}>
              {data.status}
            </span>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Purchase Orders</h2>
        </div>
        {purchaseOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No purchase orders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total CBM
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Charges
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrders.map((po) => {
                  const charges = po.charges || po.chargeLines || [];
                  const totalCharges = charges.reduce((sum, ch) => sum + (ch.amountIncl || 0), 0);
                  return (
                    <tr key={po.purchaseOrderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {po.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(po.poDate || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {po.supplierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fmt(po.invoiceAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {(po.totalCBM || po.totalCbm || 0).toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {fmt(totalCharges)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pb-8">
        <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">
          Close
        </Button>

        {data.status === 'Pending' && (
          <Button
            onClick={handleRequest}
            disabled={actionLoading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            <Send className="w-4 h-4" />
            {actionLoading ? 'Processing...' : 'Request Payment'}
          </Button>
        )}

        {data.status === 'Requested' && (
          <>
            <Button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            >
              <XCircle className="w-4 h-4" />
              {actionLoading ? 'Processing...' : 'Reject'}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              <CheckCircle className="w-4 h-4" />
              {actionLoading ? 'Processing...' : 'Approve'}
            </Button>
          </>
        )}

        {data.status === 'Approved' && data.paymentRequestId && (
          <div className="text-sm text-gray-600">
            Payment Request #{data.paymentRequestId} created. Payment can be processed from Accounts Payable.
          </div>
        )}
      </div>
    </div>
  );
};
