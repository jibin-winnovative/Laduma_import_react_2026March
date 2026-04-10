import { useState, useEffect } from 'react';
import { ArrowLeft, Send, AlertCircle, FileText, Download, ExternalLink, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  clearingPaymentsService,
  ClearingPaymentDetail,
  PaymentStatus,
} from '../../services/clearingPaymentsService';
import { attachmentService } from '../../services/attachmentService';
import { ViewContainerDetails } from './ViewContainerDetails';

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
  const [showContainerModal, setShowContainerModal] = useState(false);

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
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-gray-900">{data.containerNumber || '-'}</p>
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
          {data.status === 'Paid' && (data as any).paidDate && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Paid Date</label>
              <p className="text-base font-semibold text-gray-900">{formatDate((data as any).paidDate)}</p>
            </div>
          )}
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

        {(data.status === 'Requested' || data.status === 'Approved' || data.status === 'ApnUpdated') && (
          <div className="text-sm text-gray-600">
            Payment request submitted. Further processing is done in Accounts Payable.
          </div>
        )}
      </div>

      {showContainerModal && data.containerId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowContainerModal(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ViewContainerDetails containerId={data.containerId} onClose={() => setShowContainerModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
