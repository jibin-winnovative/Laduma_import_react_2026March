import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, XCircle, CheckCheck, Trash2, Search, AlertCircle, Upload, FileText, Download, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { containersService } from '../../services/containersService';
import { localTransportCompaniesService } from '../../services/localTransportCompaniesService';
import { localPaymentsService, LocalPayment } from '../../services/localPaymentsService';
import { attachmentService, Attachment as ExistingAttachment } from '../../services/attachmentService';
import { ContainerSearchModal } from './ContainerSearchModal';
import Decimal from 'decimal.js';

interface LocalPaymentFormProps {
  mode: 'add' | 'edit';
  localPaymentId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface ContainerOption {
  containerId: number;
  containerNumber: string;
}

interface TransportCompanyOption {
  localTransportCompanyId: number;
  companyName: string;
}

interface PendingAttachment {
  id: string;
  type: string;
  file: File;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  progress: number;
  error?: string;
  retryCount: number;
}

const PAYMENT_NATURES = ['Transport', 'Handling', 'Warehouse', 'Other'];
const STATUSES = ['Pending', 'Requested', 'Approved', 'Paid', 'Rejected'];

export const LocalPaymentForm = ({
  mode,
  localPaymentId,
  onClose,
  onSuccess,
}: LocalPaymentFormProps) => {
  const [containers, setContainers] = useState<ContainerOption[]>([]);
  const [transportCompanies, setTransportCompanies] = useState<TransportCompanyOption[]>([]);
  const [showContainerSearch, setShowContainerSearch] = useState(false);

  const [containerId, setContainerId] = useState<number | ''>('');
  const [paymentNature, setPaymentNature] = useState('');
  const [localTransportCompanyId, setLocalTransportCompanyId] = useState<number | ''>('');
  const [amountExcl, setAmountExcl] = useState<number | ''>('');
  const [vat, setVat] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState('');
  const [billDate, setBillDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('Pending');

  const [loadingInit, setLoadingInit] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);

  const amountIncl = (() => {
    const exclVal = typeof amountExcl === 'number' ? amountExcl : 0;
    const vatVal = typeof vat === 'number' ? vat : 0;
    return new Decimal(exclVal).plus(vatVal).toNumber();
  })();

  useEffect(() => {
    loadDropdowns();
    if (mode === 'edit' && localPaymentId) {
      loadExisting();
    }
  }, [mode, localPaymentId]);

  const loadDropdowns = async () => {
    try {
      const items = await containersService.getDropdown();
      setContainers(
        items.map((c) => ({
          containerId: c.containerId,
          containerNumber: c.containerNumber,
        }))
      );
    } catch (err) {
      console.error('Failed to load containers:', err);
    }
  };

  useEffect(() => {
    if (paymentNature === 'Transport') {
      loadTransportCompanies();
    } else {
      setTransportCompanies([]);
      setLocalTransportCompanyId('');
    }
  }, [paymentNature]);

  const loadTransportCompanies = async () => {
    try {
      const transportRes = await localTransportCompaniesService.getActive();
      setTransportCompanies(
        (transportRes.data || []).map((t) => ({
          localTransportCompanyId: t.localTransportCompanyId,
          companyName: t.companyName,
        }))
      );
    } catch (err) {
      console.error('Failed to load transport companies:', err);
    }
  };

  const loadExisting = async () => {
    if (!localPaymentId) return;
    setLoadingInit(true);
    try {
      const data = await localPaymentsService.getById(localPaymentId);

      setContainerId(data.containerId);
      setPaymentNature(data.paymentNature);
      setLocalTransportCompanyId(data.localTransportCompanyId || '');
      setAmountExcl(data.amountExcl);
      setVat(data.vat);
      setPaymentDate(data.paymentDate ? data.paymentDate.slice(0, 10) : '');
      setBillDate(data.billDate ? data.billDate.slice(0, 10) : '');
      setRemarks(data.remarks || '');
      setStatus(data.status);

      if (data.paymentNature === 'Transport') {
        await loadTransportCompanies();
      }

      if (data.attachments && data.attachments.length > 0) {
        setExistingAttachments(data.attachments.map((att: any) => ({
          attachmentId: att.attachmentId,
          fileName: att.fileName,
          fileSize: att.fileSize,
          contentType: att.contentType,
          fileUrl: att.fileUrl,
          entityType: att.entityType,
          entityId: att.entityId,
        })));
      }
    } catch (err) {
      console.error('Failed to load local payment:', err);
      setError('Failed to load local payment data.');
    } finally {
      setLoadingInit(false);
    }
  };

  const handleContainerSelect = (cId: number, cNumber: string) => {
    setContainerId(cId);
    setShowContainerSearch(false);
    if (!containers.find((c) => c.containerId === cId)) {
      setContainers((prev) => [...prev, { containerId: cId, containerNumber: cNumber }]);
    }
  };

  const addAttachment = (type: string, file: File) => {
    const newAttachment: PendingAttachment = {
      id: `att-${Date.now()}-${Math.random()}`,
      type,
      file,
      status: 'pending',
      progress: 0,
      retryCount: 0,
    };
    setPendingAttachments(prev => [...prev, newAttachment]);
  };

  const updateAttachmentType = (id: string, type: string) => {
    setPendingAttachments(prev => prev.map(att =>
      att.id === id ? { ...att, type } : att
    ));
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== id));
  };

  const removeExistingAttachment = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to remove this attachment?')) return;
    try {
      await attachmentService.delete(attachmentId);
      setExistingAttachments(prev => prev.filter(att => att.attachmentId !== attachmentId));
      alert('Attachment removed successfully');
    } catch (error) {
      console.error('Failed to remove attachment:', error);
      alert('Failed to remove attachment');
    }
  };

  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      setDownloadingAttachmentId(attachmentId);
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
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const uploadSingleAttachment = async (
    index: number,
    attachment: PendingAttachment,
    entityId: number
  ): Promise<boolean> => {
    const MAX_RETRIES = 3;
    let currentRetry = attachment.retryCount;

    while (currentRetry <= MAX_RETRIES) {
      try {
        setPendingAttachments(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(a => a.id === attachment.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], status: 'uploading', progress: 10 };
          }
          return updated;
        });

        const presignedResponse = await attachmentService.requestPresignedUpload({
          fileName: attachment.file.name,
          contentType: attachment.file.type,
          entityType: 'LocalPayment',
          entityId: entityId,
        });

        setPendingAttachments(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(a => a.id === attachment.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], progress: 40 };
          }
          return updated;
        });

        await attachmentService.uploadToS3(presignedResponse.uploadUrl, attachment.file);

        setPendingAttachments(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(a => a.id === attachment.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], progress: 70 };
          }
          return updated;
        });

        await attachmentService.confirmUpload(presignedResponse.attachmentId);

        setPendingAttachments(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(a => a.id === attachment.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], status: 'uploaded', progress: 100 };
          }
          return updated;
        });

        return true;
      } catch (error) {
        currentRetry++;

        if (currentRetry <= MAX_RETRIES) {
          setPendingAttachments(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(a => a.id === attachment.id);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                retryCount: currentRetry,
                progress: 0,
                error: `Retry ${currentRetry}/${MAX_RETRIES}...`,
              };
            }
            return updated;
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * currentRetry));
        } else {
          setPendingAttachments(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(a => a.id === attachment.id);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                status: 'failed',
                error: 'Upload failed after 3 retries',
                progress: 0,
              };
            }
            return updated;
          });
          return false;
        }
      }
    }
    return false;
  };

  const uploadAttachments = async (entityId: number): Promise<{ success: boolean; failedCount: number }> => {
    if (pendingAttachments.length === 0) {
      return { success: true, failedCount: 0 };
    }

    const filesToUpload = pendingAttachments.filter(f => f.status === 'pending' || f.status === 'failed');
    if (filesToUpload.length === 0) {
      return { success: true, failedCount: 0 };
    }

    let failedCount = 0;
    for (let i = 0; i < filesToUpload.length; i++) {
      const attachment = filesToUpload[i];
      const success = await uploadSingleAttachment(i, attachment, entityId);
      if (!success) failedCount++;
    }

    return { success: failedCount === 0, failedCount };
  };

  const retryFailedAttachment = async (attachmentId: string, entityId: number) => {
    const attachment = pendingAttachments.find(a => a.id === attachmentId);
    if (!attachment || !entityId) return;

    setPendingAttachments(prev => prev.map(a =>
      a.id === attachmentId ? { ...a, status: 'pending', retryCount: 0, error: undefined } : a
    ));

    const index = pendingAttachments.findIndex(a => a.id === attachmentId);
    await uploadSingleAttachment(index, { ...attachment, status: 'pending', retryCount: 0 }, entityId);
  };

  const validate = (): boolean => {
    if (!containerId) {
      alert('Please select a container');
      return false;
    }
    if (!paymentNature) {
      alert('Please select payment nature');
      return false;
    }
    if (paymentNature === 'Transport' && !localTransportCompanyId) {
      alert('Please select a transport company for Transport payment nature');
      return false;
    }
    if (!amountExcl || amountExcl <= 0) {
      alert('Amount Excl must be greater than 0');
      return false;
    }
    if (!vat || vat < 0) {
      alert('VAT must be 0 or greater');
      return false;
    }
    if (!paymentDate) {
      alert('Please select payment date');
      return false;
    }
    if (!billDate) {
      alert('Please select bill date');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const missingTypes = pendingAttachments.some(att => !att.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        containerId: Number(containerId),
        paymentNature,
        localTransportCompanyId: paymentNature === 'Transport' ? Number(localTransportCompanyId) : null,
        amountExcl: Number(amountExcl),
        vat: Number(vat),
        paymentDate: paymentDate + 'T00:00:00',
        billDate: billDate + 'T00:00:00',
        remarks,
        status,
      };

      let savedPaymentId = localPaymentId;

      if (mode === 'edit' && localPaymentId) {
        await localPaymentsService.update(localPaymentId, payload);
      } else {
        const result = await localPaymentsService.create(payload);
        savedPaymentId = result.localPaymentId;
      }

      if (pendingAttachments.length > 0 && savedPaymentId) {
        const uploadResult = await uploadAttachments(savedPaymentId);
        if (uploadResult.success) {
          alert(`Local Payment saved successfully with ${pendingAttachments.length} attachment(s)!`);
        } else {
          alert(
            `Local Payment saved successfully, but ${uploadResult.failedCount} attachment(s) failed to upload.\n\n` +
            `You can retry failed uploads by clicking the retry button, or edit the payment later to upload them.`
          );
        }
      } else {
        alert('Local Payment saved successfully!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save local payment:', err);
      setError(err.message || 'Failed to save local payment');
      alert(err.message || 'Failed to save local payment');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPayment = () => {
    setShowRequestDialog(true);
  };

  const confirmRequest = async () => {
    setShowRequestDialog(false);
    if (!localPaymentId) return;
    setSaving(true);
    try {
      await localPaymentsService.requestPayment(localPaymentId);
      alert('Payment request submitted successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to request payment:', err);
      alert(err.message || 'Failed to request payment');
    } finally {
      setSaving(false);
    }
  };

  const handleReRequest = async () => {
    if (!validate()) return;

    const missingTypes = pendingAttachments.some(att => !att.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        containerId: Number(containerId),
        paymentNature,
        localTransportCompanyId: paymentNature === 'Transport' ? Number(localTransportCompanyId) : null,
        amountExcl: Number(amountExcl),
        vat: Number(vat),
        paymentDate: paymentDate + 'T00:00:00',
        billDate: billDate + 'T00:00:00',
        remarks,
        status,
      };

      if (localPaymentId) {
        await localPaymentsService.update(localPaymentId, payload);
      }

      if (pendingAttachments.length > 0 && localPaymentId) {
        await uploadAttachments(localPaymentId);
      }

      if (localPaymentId) {
        await localPaymentsService.requestPayment(localPaymentId);
      }

      alert('Payment re-requested successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to re-request payment:', err);
      setError(err.message || 'Failed to re-request payment');
      alert(err.message || 'Failed to re-request payment');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = () => {
    setShowApproveDialog(true);
  };

  const confirmApprove = async () => {
    setShowApproveDialog(false);
    if (!localPaymentId) return;

    const missingTypes = pendingAttachments.some(att => !att.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setSaving(true);
    try {
      if (pendingAttachments.length > 0) {
        await uploadAttachments(localPaymentId);
      }

      await localPaymentsService.approvePayment(localPaymentId);
      alert('Payment approved successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to approve payment:', err);
      alert(err.message || 'Failed to approve payment');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    setShowRejectDialog(false);
    if (!localPaymentId) return;
    setSaving(true);
    try {
      await localPaymentsService.rejectPayment(localPaymentId);
      alert('Payment rejected successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to reject payment:', err);
      alert(err.message || 'Failed to reject payment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setShowDeleteDialog(false);
    if (!localPaymentId) return;
    setSaving(true);
    try {
      await localPaymentsService.delete(localPaymentId);
      alert('Local Payment deleted successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete local payment:', err);
      alert(err.message || 'Failed to delete local payment');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
        </div>
      </div>
    );
  }

  const showTransportCompanyField = paymentNature === 'Transport';
  const canRequestPayment = mode === 'edit' && status === 'Pending';
  const canApprove = mode === 'edit' && status === 'Requested';
  const canReject = mode === 'edit' && (status === 'Requested' || status === 'Approved');

  const getStatusBadge = (s: string) => {
    switch (s) {
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
            {mode === 'add' ? 'Add Local Payment' : 'Edit Local Payment'}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {mode === 'add' ? 'Create a new local payment record' : 'Update local payment details'}
          </p>
        </div>
        {mode === 'edit' && (
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusBadge(status)}`}>
            {status}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
          Payment Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Container <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={containerId}
                    onChange={(e) => setContainerId(Number(e.target.value) || '')}
                    disabled={mode === 'edit'}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select container...</option>
                    {containers.map((c) => (
                      <option key={c.containerId} value={c.containerId}>
                        {c.containerNumber}
                      </option>
                    ))}
                  </select>
                  {mode === 'add' && (
                    <Button
                      onClick={() => setShowContainerSearch(true)}
                      variant="secondary"
                      className="px-3"
                      title="Search Containers"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Nature <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentNature}
                  onChange={(e) => {
                    setPaymentNature(e.target.value);
                    if (e.target.value !== 'Transport') {
                      setLocalTransportCompanyId('');
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="">Select payment nature...</option>
                  {PAYMENT_NATURES.map((nature) => (
                    <option key={nature} value={nature}>
                      {nature}
                    </option>
                  ))}
                </select>
              </div>

              {showTransportCompanyField && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transport Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={localTransportCompanyId}
                    onChange={(e) => setLocalTransportCompanyId(Number(e.target.value) || '')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  >
                    <option value="">
                      {transportCompanies.length === 0 ? 'No active transport companies available' : 'Select transport company...'}
                    </option>
                    {transportCompanies.map((t) => (
                      <option key={t.localTransportCompanyId} value={t.localTransportCompanyId}>
                        {t.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Excl <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountExcl}
                  onChange={(e) => setAmountExcl(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={vat}
                  onChange={(e) => setVat(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Incl (calculated)
                </label>
                <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 text-right font-medium text-sm">
                  {amountIncl.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>

              {mode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    disabled
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={showTransportCompanyField ? "lg:col-span-3" : "lg:col-span-2"}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Enter remarks..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </div>
          </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">Attachments</h3>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[var(--color-primary)] transition-colors">
            <input
              id="attachment-upload-local"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach(file => {
                  if (file.size > 10 * 1024 * 1024) {
                    alert(`File ${file.name} exceeds 10MB limit`);
                    return;
                  }
                  addAttachment('', file);
                });
                e.target.value = '';
              }}
              className="hidden"
            />
            <label
              htmlFor="attachment-upload-local"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOC, XLS, PNG, JPG (Max 10MB per file)
              </p>
            </label>
          </div>

          {existingAttachments.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Existing Attachments</p>
              {existingAttachments.map((attachment) => (
                <div
                  key={attachment.attachmentId}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {attachment.fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleDownloadAttachment(attachment.attachmentId, attachment.fileName)}
                      disabled={downloadingAttachmentId === attachment.attachmentId}
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                    >
                      {downloadingAttachmentId === attachment.attachmentId ? (
                        'Downloading...'
                      ) : (
                        <>
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => removeExistingAttachment(attachment.attachmentId)}
                      variant="danger"
                      className="px-3 py-1.5 text-xs"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingAttachments.length > 0 && (
            <div className="space-y-3">
              {pendingAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-[var(--color-primary)] mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(attachment.file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={attachment.type}
                            onChange={(e) => updateAttachmentType(attachment.id, e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                            disabled={attachment.status === 'uploading'}
                          >
                            <option value="">Select Type</option>
                            <option value="Transport Invoice">Transport Invoice</option>
                            <option value="Payment Receipt">Payment Receipt</option>
                            <option value="Delivery Note">Delivery Note</option>
                            <option value="Warehouse Receipt">Warehouse Receipt</option>
                            <option value="Other">Other</option>
                          </select>
                          {attachment.status === 'failed' && localPaymentId && (
                            <Button
                              onClick={() => retryFailedAttachment(attachment.id, localPaymentId)}
                              variant="secondary"
                              className="px-3 py-1.5 text-xs"
                            >
                              Retry
                            </Button>
                          )}
                          <Button
                            onClick={() => removePendingAttachment(attachment.id)}
                            variant="danger"
                            className="px-2 py-1.5"
                            disabled={attachment.status === 'uploading'}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {attachment.status === 'pending' && (
                        <p className="text-xs text-gray-500">Pending upload</p>
                      )}
                      {attachment.status === 'uploading' && (
                        <div className="space-y-1">
                          <p className="text-xs text-blue-600">
                            Uploading{attachment.retryCount > 0 ? ` (Retry ${attachment.retryCount})` : ''}...
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${attachment.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {attachment.status === 'uploaded' && (
                        <p className="text-xs text-green-600">✓ Uploaded</p>
                      )}
                      {attachment.status === 'failed' && (
                        <p className="text-xs text-red-600">
                          ✗ {attachment.error || 'Upload failed'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pb-8">
        {mode === 'add' && (
          <Button
            onClick={() => {
              setContainerId('');
              setPaymentNature('');
              setLocalTransportCompanyId('');
              setAmountExcl('');
              setVat('');
              setPaymentDate('');
              setBillDate('');
              setRemarks('');
              setError(null);
            }}
            variant="secondary"
            disabled={saving}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        )}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          {mode === 'add' && (
            <>
              <Button
                onClick={handleSave}
                disabled={saving || pendingAttachments.some(a => a.status === 'uploading')}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {pendingAttachments.some(a => a.status === 'uploading')
                  ? 'Uploading attachments...'
                  : saving ? 'Saving...' : 'Save Draft'}
              </Button>
            </>
          )}

          {mode === 'edit' && status === 'Pending' && (
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={handleRequestPayment}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <Send className="w-4 h-4" />
                {saving ? 'Processing...' : 'Request Payment'}
              </Button>
            </>
          )}

          {mode === 'edit' && status === 'Rejected' && (
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={handleReRequest}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <Send className="w-4 h-4" />
                {saving ? 'Processing...' : 'Re-Request'}
              </Button>
            </>
          )}

          {mode === 'edit' && status === 'Requested' && (
            <Button
              onClick={onClose}
              variant="secondary"
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>
          )}

          {mode === 'edit' && (status === 'Approved' || status === 'Paid') && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      <ContainerSearchModal
        isOpen={showContainerSearch}
        onClose={() => setShowContainerSearch(false)}
        onSelect={handleContainerSelect}
      />

      {showRequestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Request Payment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to request payment for this local payment?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRequestDialog(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRequest}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Approve Payment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to approve this local payment? This will create a payment request.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveDialog(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Payment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reject this local payment request?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Payment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this local payment? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
