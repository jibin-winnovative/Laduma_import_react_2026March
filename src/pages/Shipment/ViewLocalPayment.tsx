import { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckCircle, XCircle, Pencil, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  localPaymentsService,
  LocalPayment,
} from '../../services/localPaymentsService';

interface ViewLocalPaymentProps {
  localPaymentId: number;
  onClose: () => void;
  onEdit: () => void;
}

export const ViewLocalPayment = ({
  localPaymentId,
  onClose,
  onEdit,
}: ViewLocalPaymentProps) => {
  const [data, setData] = useState<LocalPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [localPaymentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await localPaymentsService.getById(localPaymentId);
      setData(result);
    } catch (err) {
      console.error('Failed to load local payment:', err);
      setError('Failed to load local payment details.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!data) return;
    setActionLoading(true);
    setError(null);
    try {
      await localPaymentsService.requestPayment(localPaymentId);
      alert('Payment request submitted successfully!');
      loadData();
    } catch (err: any) {
      console.error('Request failed:', err);
      setError(err?.response?.data?.message || 'Failed to request payment.');
      alert(err?.response?.data?.message || 'Failed to request payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!data) return;
    setActionLoading(true);
    setError(null);
    try {
      await localPaymentsService.approvePayment(localPaymentId);
      alert('Payment approved successfully!');
      loadData();
    } catch (err: any) {
      console.error('Approve failed:', err);
      setError(err?.response?.data?.message || 'Failed to approve payment.');
      alert(err?.response?.data?.message || 'Failed to approve payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!data) return;
    if (!confirm('Are you sure you want to reject this local payment?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await localPaymentsService.rejectPayment(localPaymentId);
      alert('Payment rejected successfully!');
      loadData();
    } catch (err: any) {
      console.error('Reject failed:', err);
      setError(err?.response?.data?.message || 'Failed to reject payment.');
      alert(err?.response?.data?.message || 'Failed to reject payment.');
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

  const getStatusBadge = (status: string) => {
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

  const canRequestPayment = data.status === 'Pending';
  const canApprove = data.status === 'Requested';
  const canReject = data.status === 'Requested' || data.status === 'Approved';

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
            Local Payment Details
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            View local payment information
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
          Payment Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Container Number</label>
            <p className="text-base font-semibold text-gray-900">{data.containerNumber}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Payment Nature</label>
            <p className="text-base font-semibold text-gray-900">{data.paymentNature}</p>
          </div>

          {data.companyName && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
              <p className="text-base font-semibold text-gray-900">{data.companyName}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Amount Excl</label>
            <p className="text-base font-semibold text-gray-900">{fmt(data.amountExcl)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">VAT</label>
            <p className="text-base font-semibold text-gray-900">{fmt(data.vat)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Amount Incl</label>
            <p className="text-base font-semibold text-gray-900">{fmt(data.amountIncl)}</p>
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
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(data.status)}`}>
              {data.status}
            </span>
          </div>

          {data.remarks && (
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-500 mb-1">Remarks</label>
              <p className="text-base font-semibold text-gray-900 whitespace-pre-wrap">{data.remarks}</p>
            </div>
          )}
        </div>
      </Card>

      {data.createdDate && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
            Audit Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Created Date</label>
              <p className="text-base font-semibold text-gray-900">{formatDate(data.createdDate)}</p>
            </div>

            {data.createdBy && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                <p className="text-base font-semibold text-gray-900">{data.createdBy}</p>
              </div>
            )}

            {data.updatedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Updated Date</label>
                <p className="text-base font-semibold text-gray-900">{formatDate(data.updatedDate)}</p>
              </div>
            )}

            {data.updatedBy && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Updated By</label>
                <p className="text-base font-semibold text-gray-900">{data.updatedBy}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pb-8">
        <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">
          Close
        </Button>

        {canRequestPayment && (
          <Button
            onClick={handleRequest}
            disabled={actionLoading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            <Send className="w-4 h-4" />
            {actionLoading ? 'Processing...' : 'Request Payment'}
          </Button>
        )}

        {canApprove && (
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
      </div>
    </div>
  );
};
