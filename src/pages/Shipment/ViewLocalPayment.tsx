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
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {canRequestPayment && (
            <Button onClick={handleRequest} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Request Payment
            </Button>
          )}
          {canApprove && (
            <Button onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          )}
          {canReject && (
            <Button variant="outline" onClick={handleReject} disabled={actionLoading} className="bg-red-600 hover:bg-red-700 text-white">
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Payment Information</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(data.status)}`}>
            {data.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Container Number
            </label>
            <p className="text-base text-[var(--color-text)]">{data.containerNumber}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Payment Nature
            </label>
            <p className="text-base text-[var(--color-text)]">{data.paymentNature}</p>
          </div>

          {data.companyName && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Company Name
              </label>
              <p className="text-base text-[var(--color-text)]">{data.companyName}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Amount Excl
            </label>
            <p className="text-base text-[var(--color-text)]">{fmt(data.amountExcl)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              VAT
            </label>
            <p className="text-base text-[var(--color-text)]">{fmt(data.vat)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Amount Incl
            </label>
            <p className="text-base font-semibold text-[var(--color-text)]">{fmt(data.amountIncl)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Payment Date
            </label>
            <p className="text-base text-[var(--color-text)]">{formatDate(data.paymentDate)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Bill Date
            </label>
            <p className="text-base text-[var(--color-text)]">{formatDate(data.billDate)}</p>
          </div>

          {data.remarks && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Remarks
              </label>
              <p className="text-base text-[var(--color-text)] whitespace-pre-wrap">{data.remarks}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Audit Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Created Date
            </label>
            <p className="text-base text-[var(--color-text)]">{formatDate(data.createdDate)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Created By
            </label>
            <p className="text-base text-[var(--color-text)]">{data.createdBy}</p>
          </div>

          {data.updatedDate && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Updated Date
              </label>
              <p className="text-base text-[var(--color-text)]">{formatDate(data.updatedDate)}</p>
            </div>
          )}

          {data.updatedBy && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Updated By
              </label>
              <p className="text-base text-[var(--color-text)]">{data.updatedBy}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
