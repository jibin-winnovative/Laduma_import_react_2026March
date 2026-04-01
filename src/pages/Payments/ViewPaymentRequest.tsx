import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, DollarSign, Calendar, Clock, CheckCircle, Building, FileText,
  User, AlertTriangle, Package, ExternalLink, XCircle, Truck, Ship, CreditCard,
  Upload, Download, Landmark, ThumbsUp, FileCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { paymentsService, PaymentRequestDetails } from '../../services/paymentsService';
import { paymentRequestsService } from '../../services/paymentRequestsService';
import { attachmentService, Attachment as ExistingAttachment } from '../../services/attachmentService';
import { ViewPurchaseOrder } from '../Purchase/ViewPurchaseOrder';
import { ViewClearingPayment } from '../Shipment/ViewClearingPayment';
import { ViewOceanFreightPayment } from '../Shipment/ViewOceanFreightPayment';
import { ViewLocalPayment } from '../Shipment/ViewLocalPayment';
import { banksService } from '../../services/banksService';

interface ViewPaymentRequestProps {
  requestId: number;
  isOpen: boolean;
  onClose: () => void;
  onMakePayment: (requestId: number, sourceContext: any) => void;
  onRefresh?: () => void;
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

export function ViewPaymentRequest({ requestId, isOpen, onClose, onMakePayment, onRefresh }: ViewPaymentRequestProps) {
  const navigate = useNavigate();
  const [request, setRequest] = useState<PaymentRequestDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showApnForm, setShowApnForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showApnConfirmDialog, setShowApnConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [apnUpdating, setApnUpdating] = useState(false);
  const [apnPendingAttachments, setApnPendingAttachments] = useState<PendingAttachment[]>([]);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [showSourceDetailModal, setShowSourceDetailModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paidDate: new Date().toISOString().split('T')[0],
    referenceNo: '',
    paymentMethod: 'OnlineTransfer',
    paidAmount: 0,
    remarks: '',
    bankId: undefined as number | undefined,
    amountInZar: undefined as number | undefined,
  });
  const [activeBanks, setActiveBanks] = useState<Array<{ bankId: number; name: string; accountNumber: string }>>([]);

  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && requestId) {
      loadRequest();
      setShowPaymentForm(false);
      setShowApnForm(false);
      setShowPurchaseOrderModal(false);
      setShowSourceDetailModal(false);
      setPendingAttachments([]);
      setApnPendingAttachments([]);
      setPaymentData({
        paidDate: new Date().toISOString().split('T')[0],
        referenceNo: '',
        paymentMethod: 'OnlineTransfer',
        paidAmount: 0,
        remarks: '',
        bankId: undefined,
        amountInZar: undefined,
      });
    }
  }, [isOpen, requestId]);

  useEffect(() => {
    banksService.getActive().then(setActiveBanks).catch(console.error);
  }, []);

  const loadRequest = async () => {
    setLoading(true);
    try {
      const data = await paymentsService.getPaymentRequestDetails(requestId);
      setRequest(data);
      setPaymentData(prev => ({ ...prev, paidAmount: data.requestAmount }));
      const attachments = await attachmentService.getByEntity('PaymentRequest', requestId);
      setExistingAttachments(attachments);
    } catch (error) {
      console.error('Failed to load payment request:', error);
    } finally {
      setLoading(false);
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

  const handleViewAttachment = async (attachmentId: number) => {
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
          entityType: 'PaymentRequest',
          entityId,
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
    await uploadSingle({ ...att, status: 'pending', retryCount: 0 }, requestId);
  };

  const hasMissingTypes = pendingAttachments.some(a => !a.type);
  const isUploading = pendingAttachments.some(a => a.status === 'uploading');

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
    if (status === 'Paid' || status === 'Rejected') return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: any }> = {
      Requested: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      Approved: { color: 'bg-amber-100 text-amber-800', icon: ThumbsUp },
      ApnUpdated: { color: 'bg-teal-100 text-teal-800', icon: FileCheck },
      Paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      Rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    return configs[status] || configs['Requested'];
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
    setShowSourceDetailModal(true);
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await paymentRequestsService.approveRequest(requestId);
      setShowApproveDialog(false);
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to approve payment request:', error);
    } finally {
      setApproving(false);
    }
  };

  const addApnPendingAttachment = (file: File) => {
    setApnPendingAttachments(prev => [...prev, {
      id: `apn-att-${Date.now()}-${Math.random()}`,
      file,
      type: '',
      status: 'pending',
      progress: 0,
      retryCount: 0,
    }]);
  };

  const updateApnAttachmentType = (id: string, type: string) => {
    setApnPendingAttachments(prev => prev.map(a => a.id === id ? { ...a, type } : a));
  };

  const removeApnPending = (id: string) => {
    setApnPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  const uploadApnSingle = async (attachment: PendingAttachment): Promise<boolean> => {
    const MAX_RETRIES = 3;
    let retry = attachment.retryCount;
    while (retry <= MAX_RETRIES) {
      try {
        setApnPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, status: 'uploading', progress: 10 } : a
        ));
        const presigned = await attachmentService.requestPresignedUpload({
          fileName: attachment.file.name,
          contentType: attachment.file.type,
          entityType: 'PaymentRequest',
          entityId: requestId,
        });
        setApnPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, progress: 40 } : a
        ));
        await attachmentService.uploadToS3(presigned.uploadUrl, attachment.file);
        setApnPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, progress: 70 } : a
        ));
        await attachmentService.confirmUpload(presigned.attachmentId);
        setApnPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, status: 'uploaded', progress: 100 } : a
        ));
        return true;
      } catch {
        retry++;
        if (retry <= MAX_RETRIES) {
          setApnPendingAttachments(prev => prev.map(a =>
            a.id === attachment.id ? { ...a, retryCount: retry, progress: 0, error: `Retry ${retry}/${MAX_RETRIES}...` } : a
          ));
          await new Promise(r => setTimeout(r, 1000 * retry));
        } else {
          setApnPendingAttachments(prev => prev.map(a =>
            a.id === attachment.id ? { ...a, status: 'failed', error: 'Upload failed after 3 retries', progress: 0 } : a
          ));
          return false;
        }
      }
    }
    return false;
  };

  const handleApnUpdate = async () => {
    const hasMissingApnTypes = apnPendingAttachments.some(a => !a.type);
    if (hasMissingApnTypes) {
      alert('Please select a type for all attachments before proceeding');
      return;
    }
    setApnUpdating(true);
    try {
      if (apnPendingAttachments.length > 0) {
        const toUpload = apnPendingAttachments.filter(a => a.status === 'pending' || a.status === 'failed');
        for (const att of toUpload) {
          await uploadApnSingle(att);
        }
      }
      await paymentRequestsService.apnUpdate(requestId);
      setShowApnConfirmDialog(false);
      setShowApnForm(false);
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to update APN status:', error);
    } finally {
      setApnUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) return;

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
    if (!paymentData.referenceNo.trim()) return;
    if (hasMissingTypes) {
      alert('Please select a type for all attachments before making payment');
      return;
    }

    setSubmitting(true);
    try {
      if (pendingAttachments.length > 0) {
        await uploadAll(requestId);
      }
      await paymentsService.makePayment({
        paymentRequestId: requestId,
        paidDate: paymentData.paidDate,
        referenceNo: paymentData.referenceNo,
        paymentMethod: paymentData.paymentMethod,
        paidAmount: request!.requestAmount,
        remarks: paymentData.remarks,
        bankId: paymentData.bankId,
        amountInZar: paymentData.amountInZar,
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
    if (!paymentData.referenceNo.trim()) return;
    setShowConfirmDialog(true);
  };

  if (!isOpen) return null;

  const status = request?.status ?? '';
  const isApnUpdated = status === 'ApnUpdated';
  const canModifyAttachments = status === 'Requested' || status === 'Approved' || status === 'ApnUpdated';

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
              </div>
            </div>

            {(() => {
              const isZarSource = request.sourceModule === 'ClearingPayment' || request.sourceModule === 'LocalPayment';
              const currency = isZarSource ? 'ZAR' : 'USD';
              const currencySymbol = isZarSource ? 'R' : '$';
              const fmt = (n: number) => `${currencySymbol}${n.toFixed(2)}`;
              return (
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Payment Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-base text-[var(--color-text-secondary)]">Total Amount</span>
                      <span className="text-base font-semibold text-[var(--color-text)]">
                        {fmt(request.sourceContext.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg -mx-2">
                      <span className="text-base font-bold text-[var(--color-primary)]">Requesting Amount</span>
                      <span className="text-lg font-bold text-[var(--color-primary)]">
                        {fmt(request.requestAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-semibold text-[var(--color-text)]">Balance After Payment</span>
                      <span className="text-base font-bold text-green-600">
                        {fmt(request.sourceContext.totalAmount - request.sourceContext.totalPaidAmount - request.requestAmount)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-3">{currency}</p>
                </div>
              );
            })()}

            {request.description && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-700 font-semibold mb-1">DESCRIPTION</p>
                <p className="text-sm text-blue-900">{request.description}</p>
              </div>
            )}

            {showApnForm && status === 'Approved' && (
              <div className="rounded-lg border p-6" style={{ backgroundColor: 'rgb(240 253 250)', borderColor: 'rgb(153 234 214)' }}>
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-teal-700" />
                  APN Update - Attachments (Optional)
                </h3>
                <div className="mb-4">
                  <div className="border-2 border-dashed border-teal-300 rounded-lg p-5 hover:border-teal-500 transition-colors">
                    <input
                      id="apn-attachment-upload"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        Array.from(e.target.files || []).forEach(file => {
                          if (file.size > 10 * 1024 * 1024) {
                            alert(`File ${file.name} exceeds 10MB limit`);
                            return;
                          }
                          addApnPendingAttachment(file);
                        });
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <label htmlFor="apn-attachment-upload" className="flex flex-col items-center justify-center cursor-pointer">
                      <Upload className="w-10 h-10 text-teal-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF, DOC, XLS, PNG, JPG (Max 10MB per file)</p>
                    </label>
                  </div>
                </div>
                {apnPendingAttachments.length > 0 && (
                  <div className="space-y-3">
                    {apnPendingAttachments.map((att) => (
                      <div key={att.id} className="border border-teal-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{att.file.name}</p>
                                <p className="text-xs text-gray-500">{(att.file.size / 1024).toFixed(0)} KB</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={att.type}
                                  onChange={(e) => updateApnAttachmentType(att.id, e.target.value)}
                                  disabled={att.status === 'uploading'}
                                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                  <option value="">Select Type</option>
                                  <option value="APN Document">APN Document</option>
                                  <option value="Bank Confirmation">Bank Confirmation</option>
                                  <option value="Supporting Document">Supporting Document</option>
                                  <option value="Other">Other</option>
                                </select>
                                <Button
                                  onClick={() => removeApnPending(att.id)}
                                  variant="danger"
                                  className="px-2 py-1.5"
                                  disabled={att.status === 'uploading'}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {att.status === 'uploading' && (
                              <div className="space-y-1">
                                <p className="text-xs text-teal-600">Uploading...</p>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-teal-600 h-1.5 rounded-full transition-all" style={{ width: `${att.progress}%` }} />
                                </div>
                              </div>
                            )}
                            {att.status === 'uploaded' && <p className="text-xs text-green-600">Uploaded successfully</p>}
                            {att.status === 'failed' && <p className="text-xs text-red-600">{att.error || 'Upload failed'}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {apnPendingAttachments.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">No attachments added (optional)</p>
                )}
              </div>
            )}

            {showPaymentForm && (isApnUpdated || (status === 'Approved' && request?.sourceModule !== 'Purchase')) && (
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

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <Landmark className="w-4 h-4 text-gray-900" />
                      Bank
                    </label>
                    <select
                      value={paymentData.bankId ?? ''}
                      onChange={(e) => setPaymentData({ ...paymentData, bankId: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                      style={{ borderColor: 'rgb(216 224 241)' }}
                    >
                      <option value="">Select Bank</option>
                      {activeBanks.map((b) => (
                        <option key={b.bankId} value={b.bankId}>
                          {b.name} - {b.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <DollarSign className="w-4 h-4 text-gray-900" />
                      Amount in ZAR
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentData.amountInZar ?? ''}
                      onChange={(e) => setPaymentData({ ...paymentData, amountInZar: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                      style={{ borderColor: 'rgb(216 224 241)' }}
                      placeholder="0.00"
                    />
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

                <div className="mt-6 pt-4 border-t border-blue-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-gray-900" />
                    Attachments
                  </h4>

                  <div className="mb-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 hover:border-blue-400 transition-colors">
                      <input
                        id="payment-req-attachment-upload"
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
                      <label htmlFor="payment-req-attachment-upload" className="flex flex-col items-center justify-center cursor-pointer">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 font-medium mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PDF, DOC, XLS, PNG, JPG (Max 10MB per file)</p>
                      </label>
                    </div>
                  </div>

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
                                    <option value="Payment Receipt">Payment Receipt</option>
                                    <option value="Bank Slip">Bank Slip</option>
                                    <option value="Invoice">Invoice</option>
                                    <option value="Supporting Document">Supporting Document</option>
                                    <option value="Other">Other</option>
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

                  {pendingAttachments.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">No attachments added</p>
                  )}
                </div>
              </div>
            )}

            {existingAttachments.length > 0 && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Attachments
                </h3>
                <div className="space-y-2">
                  {existingAttachments.map((att) => (
                    <div
                      key={att.attachmentId}
                      className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{att.fileName}</span>
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
                          onClick={() => handleViewAttachment(att.attachmentId)}
                          variant="secondary"
                          className="px-3 py-1.5 text-xs flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </Button>
                        {canModifyAttachments && (
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
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-2 border-t">
              <span>Created by {request.createdBy}</span>
              <span>{formatDate(request.createdAt)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              {status === 'Requested' && (
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
                    onClick={() => setShowApproveDialog(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Approve
                  </Button>
                </>
              )}

              {status === 'Approved' && !showApnForm && (
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
                  {request?.sourceModule === 'Purchase' ? (
                    <Button
                      onClick={() => setShowApnForm(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
                    >
                      <FileCheck className="w-4 h-4" />
                      APN Updated
                    </Button>
                  ) : (
                    <Button
                      onClick={handleMakePaymentClick}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      <DollarSign className="w-4 h-4" />
                      Make Payment
                    </Button>
                  )}
                </>
              )}

              {status === 'Approved' && showApnForm && request?.sourceModule === 'Purchase' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => { setShowApnForm(false); setApnPendingAttachments([]); }}
                    disabled={apnUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setShowApnConfirmDialog(true)}
                    disabled={apnUpdating || apnPendingAttachments.some(a => a.status === 'uploading')}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
                  >
                    <FileCheck className="w-4 h-4" />
                    Confirm APN Updated
                  </Button>
                </>
              )}

              {status === 'Approved' && showPaymentForm && request?.sourceModule !== 'Purchase' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setShowPaymentForm(false)}
                    disabled={submitting || isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={!paymentData.referenceNo.trim() || submitting || isUploading}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Submit Payment'}
                  </Button>
                </>
              )}

              {status === 'ApnUpdated' && (
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
                        disabled={isUploading}
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
                        disabled={submitting || isUploading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmPayment}
                        disabled={!paymentData.referenceNo.trim() || submitting || isUploading}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isUploading ? 'Uploading...' : 'Submit Payment'}
                      </Button>
                    </>
                  )}
                </>
              )}

              {(status === 'Paid' || status === 'Rejected' || status === '') && (
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
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        title="Confirm Approval"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ThumbsUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Approve Payment Request</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Are you sure you want to approve this payment request? This will move it to the Approved status.
                </p>
                {request && (
                  <p className="text-sm font-semibold text-blue-900 mt-2">
                    Amount: {formatCurrency(request.requestAmount, request.sourceContext?.currencyCode)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowApproveDialog(false)} disabled={approving}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <ThumbsUp className="w-4 h-4" />
              {approving ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showApnConfirmDialog}
        onClose={() => setShowApnConfirmDialog(false)}
        title="Confirm APN Updated"
      >
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-teal-900">Mark as APN Updated</h4>
                <p className="text-sm text-teal-700 mt-1">
                  Are you sure you want to mark this payment request as APN Updated? This will make it ready for payment processing.
                </p>
                {apnPendingAttachments.length > 0 && (
                  <p className="text-sm text-teal-700 mt-2">
                    {apnPendingAttachments.filter(a => a.status !== 'uploaded').length} attachment(s) will be uploaded.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowApnConfirmDialog(false)} disabled={apnUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleApnUpdate}
              disabled={apnUpdating}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
            >
              <FileCheck className="w-4 h-4" />
              {apnUpdating ? 'Processing...' : 'Confirm APN Updated'}
            </Button>
          </div>
        </div>
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
              {rejecting ? 'Processing...' : 'Confirm Rejection'}
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
                {pendingAttachments.length > 0 && (
                  <p className="text-sm text-green-700 mt-1">
                    {pendingAttachments.length} attachment(s) will be uploaded.
                  </p>
                )}
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
            {paymentData.bankId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)]">Bank</span>
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  {activeBanks.find(b => b.bankId === paymentData.bankId)
                    ? `${activeBanks.find(b => b.bankId === paymentData.bankId)!.name} - ${activeBanks.find(b => b.bankId === paymentData.bankId)!.accountNumber}`
                    : ''}
                </span>
              </div>
            )}
            {paymentData.amountInZar !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)]">Amount in ZAR</span>
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  ZAR {paymentData.amountInZar.toFixed(2)}
                </span>
              </div>
            )}
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

      {request?.sourceContext?.referenceId && showSourceDetailModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSourceDetailModal(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {request.sourceModule === 'Purchase' && (
              <ViewPurchaseOrder
                purchaseOrderId={request.sourceContext.referenceId}
                onClose={() => setShowSourceDetailModal(false)}
              />
            )}
            {request.sourceModule === 'ClearingPayment' && (
              <div className="p-6">
                <ViewClearingPayment
                  clearingPaymentId={request.sourceContext.referenceId}
                  onClose={() => setShowSourceDetailModal(false)}
                  onSuccess={() => setShowSourceDetailModal(false)}
                />
              </div>
            )}
            {request.sourceModule === 'OceanFreightPayment' && (
              <div className="p-6">
                <ViewOceanFreightPayment
                  oceanFreightPaymentId={request.sourceContext.referenceId}
                  onClose={() => setShowSourceDetailModal(false)}
                  onSuccess={() => setShowSourceDetailModal(false)}
                />
              </div>
            )}
            {request.sourceModule === 'LocalPayment' && (
              <div className="p-6">
                <ViewLocalPayment
                  localPaymentId={request.sourceContext.referenceId}
                  onClose={() => setShowSourceDetailModal(false)}
                  onEdit={() => setShowSourceDetailModal(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}

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
