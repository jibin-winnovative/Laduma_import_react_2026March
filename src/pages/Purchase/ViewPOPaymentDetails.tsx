import { useEffect, useRef, useState } from 'react';
import {
  FileText, AlertCircle, Clock, CheckCircle, Send,
  Upload, Download, ExternalLink, X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { poPaymentsService, POPaymentDetails } from '../../services/poPaymentsService';
import { attachmentService, Attachment as ExistingAttachment } from '../../services/attachmentService';
import { attachmentTypesService } from '../../services/attachmentTypesService';
import { ViewPurchaseOrder } from './ViewPurchaseOrder';

interface ViewPOPaymentDetailsProps {
  paymentId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface PendingAttachment {
  id: string;
  file: File;
  type: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  progress: number;
  error?: string;
  retryCount: number;
}

export const ViewPOPaymentDetails = ({ paymentId, onClose, onSuccess }: ViewPOPaymentDetailsProps) => {
  const [details, setDetails] = useState<POPaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);

  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [attachmentTypeOptions, setAttachmentTypeOptions] = useState<{ id: number; name: string }[]>([]);

  const loadingRef = useRef(false);

  useEffect(() => {
    loadDetails();
    attachmentTypesService.getActiveDropdown('PO Payment').then(setAttachmentTypeOptions).catch(() => {});
  }, [paymentId]);

  const loadDetails = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await poPaymentsService.getDetails(paymentId);
      setDetails(data);
      const attachments = await attachmentService.getByEntity('POPayment', paymentId);
      setExistingAttachments(attachments);
    } catch (err: any) {
      console.error('Failed to load payment details:', err);
      setError(err.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const addPendingAttachment = (file: File) => {
    setPendingAttachments(prev => [...prev, {
      id: `att-${Date.now()}-${Math.random()}`,
      file,
      type: '',
      status: 'pending',
      progress: 0,
      retryCount: 0,
    }]);
  };

  const updateAttachmentType = (id: string, type: string) => {
    setPendingAttachments(prev => prev.map(a => a.id === id ? { ...a, type } : a));
  };

  const removePending = (id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  const removeExisting = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to remove this attachment?')) return;
    try {
      await attachmentService.delete(attachmentId);
      setExistingAttachments(prev => prev.filter(a => a.attachmentId !== attachmentId));
    } catch {
      alert('Failed to remove attachment');
    }
  };

  const handleDownload = async (attachmentId: number, fileName: string) => {
    try {
      setDownloadingId(attachmentId);
      const url = await attachmentService.getDownloadUrl(attachmentId, 60, false);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = async (attachmentId: number) => {
    try {
      const url = await attachmentService.getDownloadUrl(attachmentId, 60, true);
      window.open(url, '_blank');
    } catch {
      alert('Failed to view file');
    }
  };

  const uploadSingle = async (attachment: PendingAttachment, entityId: number): Promise<boolean> => {
    const MAX_RETRIES = 3;
    let retry = attachment.retryCount;

    while (retry <= MAX_RETRIES) {
      try {
        setPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, status: 'uploading', progress: 10 } : a
        ));

        const presigned = await attachmentService.requestPresignedUpload({
          fileName: attachment.file.name,
          contentType: attachment.file.type,
          entityType: 'POPayment',
          entityId,
          ...(attachment.type ? { category: attachment.type } : {}),
        });

        setPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, progress: 40 } : a
        ));

        await attachmentService.uploadToS3(presigned.uploadUrl, attachment.file);

        setPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, progress: 70 } : a
        ));

        await attachmentService.confirmUpload(presigned.attachmentId);

        setPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, status: 'uploaded', progress: 100 } : a
        ));

        return true;
      } catch {
        retry++;
        if (retry <= MAX_RETRIES) {
          setPendingAttachments(prev => prev.map(a =>
            a.id === attachment.id ? { ...a, retryCount: retry, progress: 0, error: `Retry ${retry}/${MAX_RETRIES}...` } : a
          ));
          await new Promise(r => setTimeout(r, 1000 * retry));
        } else {
          setPendingAttachments(prev => prev.map(a =>
            a.id === attachment.id ? { ...a, status: 'failed', error: 'Upload failed after 3 retries', progress: 0 } : a
          ));
          return false;
        }
      }
    }
    return false;
  };

  const uploadAll = async (entityId: number): Promise<number> => {
    const toUpload = pendingAttachments.filter(a => a.status === 'pending' || a.status === 'failed');
    let failed = 0;
    for (const att of toUpload) {
      const ok = await uploadSingle(att, entityId);
      if (!ok) failed++;
    }
    return failed;
  };

  const retryFailed = async (id: string) => {
    const att = pendingAttachments.find(a => a.id === id);
    if (!att) return;
    setPendingAttachments(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'pending', retryCount: 0, error: undefined } : a
    ));
    await uploadSingle({ ...att, status: 'pending', retryCount: 0 }, paymentId);
  };

  const hasMissingTypes = pendingAttachments.some(a => !a.type);
  const isUploading = pendingAttachments.some(a => a.status === 'uploading');

  const handleRequestPayment = async () => {
    if (!details) return;
    if (hasMissingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      if (pendingAttachments.length > 0) {
        await uploadAll(details.purchaseOrderPaymentId);
      }
      await poPaymentsService.requestPayment(details.purchaseOrderPaymentId);
      setShowConfirmDialog(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create payment request:', err);
      setError(err.message || 'Failed to create payment request');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pending':
        return { icon: Clock, color: 'bg-yellow-50 text-yellow-700 border border-yellow-200', label: 'Pending' };
      case 'Requested':
        return { icon: Send, color: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'Requested' };
      case 'Approved':
        return { icon: CheckCircle, color: 'bg-green-50 text-green-700 border border-green-200', label: 'Approved' };
      case 'ApnUpdated':
        return { icon: CheckCircle, color: 'bg-teal-50 text-teal-700 border border-teal-200', label: 'APN Updated' };
      case 'Paid':
        return { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Paid' };
      case 'Rejected':
        return { icon: AlertCircle, color: 'bg-red-50 text-red-700 border border-red-200', label: 'Rejected' };
      default:
        return { icon: FileText, color: 'bg-gray-50 text-gray-700 border border-gray-200', label: status };
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
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </Modal>
    );
  }

  const isPending = details.status === 'Pending';
  const isRequested = details.status === 'Requested';
  const isRejected = details.status === 'Rejected';

  const requestAmountLabel = isPending || isRejected ? 'Requesting Amount' : 'Requested Amount';
  const isPaid = details.status === 'Paid';
  const balanceAfterPayment = isPaid
    ? details.totalPOAmount - details.paidAmount
    : details.totalPOAmount - details.paidAmount - details.expectedAmount;
  const isBalanceNegative = balanceAfterPayment < 0;

  const statusConfig = getStatusConfig(details.status);
  const StatusIcon = statusConfig.icon;

  const canUploadAttachments = isPending || isRequested || isRejected;

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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPurchaseOrderModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View PO
                </button>
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg flex items-center gap-2 ${statusConfig.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-white/80 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white/70">Supplier</p>
                  <p className="text-base font-semibold text-white">{details.supplierName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-white/80 mt-0.5" />
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
                <span className="text-base font-semibold text-[var(--color-text)]">${formatCurrency(details.totalPOAmount)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-base text-[var(--color-text-secondary)]">Paid Amount</span>
                <span className="text-base font-semibold text-[var(--color-text)]">${formatCurrency(details.paidAmount)}</span>
              </div>
              {details.status === 'Paid' && (details as any).paidDate && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-base text-[var(--color-text-secondary)]">Paid Date</span>
                  <span className="text-base font-semibold text-emerald-700">
                    {new Date((details as any).paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 bg-blue-50 px-4 py-3 rounded-lg -mx-2">
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

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">Attachments</h3>

            {canUploadAttachments && (
              <div className="mb-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 hover:border-[var(--color-primary)] transition-colors">
                  <input
                    id="po-attachment-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      Array.from(e.target.files || []).forEach(file => {
                        if (file.size > 10 * 1024 * 1024) {
                          alert(`File ${file.name} exceeds 10MB limit`);
                          return;
                        }
                        addPendingAttachment(file);
                      });
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <label htmlFor="po-attachment-upload" className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOC, XLS, PNG, JPG (Max 10MB per file)</p>
                  </label>
                </div>
              </div>
            )}

            {existingAttachments.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">Uploaded Attachments</p>
                {existingAttachments.map((att) => (
                  <div
                    key={att.attachmentId}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{att.fileName}</span>
                      {att.category && (
                        <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {att.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleDownload(att.attachmentId, att.fileName)}
                        disabled={downloadingId === att.attachmentId}
                        variant="secondary"
                        className="px-3 py-1.5 text-xs flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        {downloadingId === att.attachmentId ? 'Downloading...' : 'Download'}
                      </Button>
                      <Button
                        onClick={() => handleView(att.attachmentId)}
                        variant="secondary"
                        className="px-3 py-1.5 text-xs flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </Button>
                      {canUploadAttachments && (
                        <Button
                          onClick={() => removeExisting(att.attachmentId)}
                          variant="danger"
                          className="px-2 py-1.5"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingAttachments.length > 0 && (
              <div className="space-y-3">
                {pendingAttachments.map((att) => (
                  <div key={att.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-[var(--color-primary)] mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{att.file.name}</p>
                            <p className="text-xs text-gray-500">{(att.file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={att.type}
                              onChange={(e) => updateAttachmentType(att.id, e.target.value)}
                              disabled={att.status === 'uploading'}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                            >
                              <option value="">Select Type</option>
                              {attachmentTypeOptions.map((opt) => (
                                <option key={opt.id} value={opt.name}>{opt.name}</option>
                              ))}
                            </select>
                            {att.status === 'failed' && (
                              <Button
                                onClick={() => retryFailed(att.id)}
                                variant="secondary"
                                className="px-3 py-1.5 text-xs"
                              >
                                Retry
                              </Button>
                            )}
                            <Button
                              onClick={() => removePending(att.id)}
                              variant="danger"
                              className="px-2 py-1.5"
                              disabled={att.status === 'uploading'}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {att.status === 'pending' && (
                          <p className="text-xs text-gray-500">Pending upload</p>
                        )}
                        {att.status === 'uploading' && (
                          <div className="space-y-1">
                            <p className="text-xs text-blue-600">
                              Uploading{att.retryCount > 0 ? ` (Retry ${att.retryCount})` : ''}...
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${att.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {att.status === 'uploaded' && (
                          <p className="text-xs text-green-600">Uploaded successfully</p>
                        )}
                        {att.status === 'failed' && (
                          <p className="text-xs text-red-600">{att.error || 'Upload failed'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {existingAttachments.length === 0 && pendingAttachments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No attachments</p>
            )}
          </Card>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onClose} variant="secondary" className="flex-1">
              {isRequested ? 'Close' : 'Cancel'}
            </Button>
            {(isPending || isRejected) && (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isBalanceNegative || isUploading}
                className="flex-1"
                title={isBalanceNegative ? 'Balance is less than requesting amount' : 'Request payment'}
              >
                {isRejected ? 'Request Payment Again' : 'Request Payment'}
              </Button>
            )}
            {isRequested && (
              <div className="flex-1 text-sm text-gray-600 flex items-center">
                Payment request submitted. Further processing is done in Accounts Payable.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {showConfirmDialog && (
        <Modal isOpen={true} onClose={() => setShowConfirmDialog(false)} title="Confirm Payment Request">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Are you sure you want to raise a payment request for this PO payment?
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Amount: <span className="font-semibold">${formatCurrency(details.expectedAmount)}</span>
                </p>
                <p className="text-sm text-blue-700">
                  Supplier: <span className="font-semibold">{details.supplierName}</span>
                </p>
                <p className="text-sm text-blue-700">
                  PO Number: <span className="font-semibold">{details.poNumber}</span>
                </p>
                {pendingAttachments.length > 0 && (
                  <p className="text-sm text-blue-700 mt-2">
                    {pendingAttachments.length} attachment(s) will be uploaded.
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setShowConfirmDialog(false)} variant="secondary" className="flex-1" disabled={actionLoading}>
                No
              </Button>
              <Button onClick={handleRequestPayment} className="flex-1" disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Yes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showPurchaseOrderModal && details?.purchaseOrderId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPurchaseOrderModal(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ViewPurchaseOrder
              purchaseOrderId={details.purchaseOrderId}
              onClose={() => setShowPurchaseOrderModal(false)}
            />
          </div>
        </div>
      )}

    </>
  );
};
