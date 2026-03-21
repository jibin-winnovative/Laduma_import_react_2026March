import { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckCircle, XCircle, FileText, Download, ExternalLink, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  oceanFreightPaymentsService,
  OceanFreightPaymentDetail,
  PaymentStatus,
} from '../../services/oceanFreightPaymentsService';
import { attachmentService } from '../../services/attachmentService';
import { ViewContainerDetails } from './ViewContainerDetails';

interface ViewOceanFreightPaymentProps {
  oceanFreightPaymentId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const ViewOceanFreightPayment = ({
  oceanFreightPaymentId,
  onClose,
  onSuccess,
}: ViewOceanFreightPaymentProps) => {
  const [data, setData] = useState<OceanFreightPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContainerModal, setShowContainerModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [oceanFreightPaymentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await oceanFreightPaymentsService.getById(oceanFreightPaymentId);
      setData(result);
    } catch (err) {
      console.error('Failed to load ocean freight payment:', err);
      setError('Failed to load ocean freight payment details.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!data) return;
    setActionLoading(true);
    setError(null);
    try {
      await oceanFreightPaymentsService.requestPayment(oceanFreightPaymentId);
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
      await oceanFreightPaymentsService.approvePayment(oceanFreightPaymentId);
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
    if (!confirm('Are you sure you want to reject this ocean freight payment?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await oceanFreightPaymentsService.rejectPayment(oceanFreightPaymentId);
      onSuccess();
    } catch (err: any) {
      console.error('Reject failed:', err);
      setError(err?.response?.data?.message || 'Failed to reject payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (attachmentId: number, fileName: string) => {
    try {
      const downloadUrl = await attachmentService.getDownloadUrl(attachmentId, 60, false);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download attachment:', err);
      alert('Failed to download file');
    }
  };

  const handleView = async (attachmentId: number) => {
    try {
      const viewUrl = await attachmentService.getDownloadUrl(attachmentId, 60, true);
      window.open(viewUrl, '_blank');
    } catch (err) {
      console.error('Failed to view attachment:', err);
      alert('Failed to view file');
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
            Ocean Freight Payment Details
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {data.status === 'Pending' && (
            <Button
              onClick={handleRequest}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {actionLoading ? 'Requesting...' : 'Request'}
            </Button>
          )}
          {data.status === 'Requested' && (
            <>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {actionLoading ? 'Approving...' : 'Approve'}
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </Button>
            </>
          )}
          {(data.status === 'Pending' || data.status === 'Requested') && (
            <Button
              onClick={handleReject}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              {actionLoading ? 'Rejecting...' : 'Reject'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">Payment Information</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(data.status)}`}>
              {data.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Container Number</label>
              <div className="flex items-center gap-2">
                <p className="text-base text-[var(--color-text)] font-medium">{data.containerNumber || '-'}</p>
                {data.containerId && (
                  <Button
                    onClick={() => setShowContainerModal(true)}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1 text-xs"
                    title="View Container Details"
                  >
                    <Package className="w-3 h-3" />
                    View
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Ocean Freight Company</label>
              <p className="text-base text-[var(--color-text)] font-medium">{data.oceanFreightCompanyName || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Ocean Freight USD</label>
              <p className="text-base text-[var(--color-text)] font-medium">${fmt(data.oceanFreightUSD)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Exchange Rate</label>
              <p className="text-base text-[var(--color-text)] font-medium">{fmt(data.exchangeRate)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Amount in Rand</label>
              <p className="text-base text-[var(--color-text)] font-medium">R {fmt(data.amountInRand || 0)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Payment Date</label>
              <p className="text-base text-[var(--color-text)]">{formatDate(data.paymentDate)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Bill Date</label>
              <p className="text-base text-[var(--color-text)]">{formatDate(data.billDate)}</p>
            </div>

            {data.createdDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created Date</label>
                <p className="text-base text-[var(--color-text)]">{formatDate(data.createdDate)}</p>
              </div>
            )}

            {data.createdBy && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                <p className="text-base text-[var(--color-text)]">{data.createdBy}</p>
              </div>
            )}

            {data.updatedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Updated Date</label>
                <p className="text-base text-[var(--color-text)]">{formatDate(data.updatedDate)}</p>
              </div>
            )}

            {data.updatedBy && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Updated By</label>
                <p className="text-base text-[var(--color-text)]">{data.updatedBy}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {data.attachments && data.attachments.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Attachments</h3>
          <div className="grid grid-cols-1 gap-3">
            {data.attachments.map((attachment: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                  <span className="text-sm text-[var(--color-text)] truncate">
                    {attachment.fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => handleDownload(attachment.attachmentId, attachment.fileName)}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-2 text-sm"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    onClick={() => handleView(attachment.attachmentId)}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-2 text-sm"
                    title="View in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showContainerModal && data.containerId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowContainerModal(false)} />
          <div className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ViewContainerDetails containerId={data.containerId} onClose={() => setShowContainerModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
