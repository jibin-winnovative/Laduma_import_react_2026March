import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, CheckCheck, XCircle, AlertCircle, Upload, FileText, Download, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { containersService } from '../../services/containersService';
import {
  oceanFreightPaymentsService,
  OceanFreightPaymentDetail,
  PaymentStatus,
} from '../../services/oceanFreightPaymentsService';
import { attachmentService, Attachment as ExistingAttachment } from '../../services/attachmentService';
import { ContainerSearchModal } from './ContainerSearchModal';

interface OceanFreightPaymentFormProps {
  mode: 'add' | 'edit';
  oceanFreightPaymentId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface ContainerOption {
  containerId: number;
  containerNumber: string;
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

export const OceanFreightPaymentForm = ({
  mode,
  oceanFreightPaymentId,
  onClose,
  onSuccess,
}: OceanFreightPaymentFormProps) => {
  const [containers, setContainers] = useState<ContainerOption[]>([]);
  const [showContainerSearch, setShowContainerSearch] = useState(false);

  const [containerId, setContainerId] = useState<number | ''>('');
  const [oceanFreightCompanyName, setOceanFreightCompanyName] = useState('');
  const [oceanFreightUSD, setOceanFreightUSD] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState('');
  const [billDate, setBillDate] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('Pending');

  const [loadingInit, setLoadingInit] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);

  useEffect(() => {
    if (mode === 'edit' && oceanFreightPaymentId) {
      loadExisting();
    } else {
      loadDropdowns();
    }
  }, [mode, oceanFreightPaymentId]);

  useEffect(() => {
    if (containerId && mode === 'add') {
      loadOceanFreightCompany();
    }
  }, [containerId, mode]);

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
      console.error('Failed to load dropdowns:', err);
    }
  };

  const loadOceanFreightCompany = async () => {
    if (!containerId) return;
    try {
      const companyData = await containersService.getOceanFreightCompany(Number(containerId));
      setOceanFreightCompanyName(companyData.oceanFreightCompanyName);
    } catch (err) {
      console.error('Failed to load ocean freight company:', err);
      setOceanFreightCompanyName('');
    }
  };

  const loadExisting = async () => {
    if (!oceanFreightPaymentId) return;
    setLoadingInit(true);
    try {
      const data = await oceanFreightPaymentsService.getById(oceanFreightPaymentId);

      setContainerId(data.containerId);
      setOceanFreightUSD(data.oceanFreightUSD);
      setPaymentDate(data.paymentDate ? data.paymentDate.slice(0, 10) : '');
      setBillDate(data.billDate ? data.billDate.slice(0, 10) : '');
      setStatus(data.status);

      if (data.containerNumber) {
        setContainers([{
          containerId: data.containerId,
          containerNumber: data.containerNumber,
        }]);
      }

      if (data.oceanFreightCompanyName) {
        setOceanFreightCompanyName(data.oceanFreightCompanyName);
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

      await loadDropdowns();
    } catch (err) {
      console.error('Failed to load ocean freight payment:', err);
      setError('Failed to load ocean freight payment data.');
    } finally {
      setLoadingInit(false);
    }
  };

  const handleContainerChange = async (val: string) => {
    const id = val ? Number(val) : '';

    if (id) {
      try {
        const paymentStatus = await containersService.getOceanFreightPaymentStatus(id);

        if (paymentStatus.hasOceanFreightPayment) {
          alert('Payment already exists in this container. Please select a different container.');
          return;
        }
      } catch (err) {
        console.error('Failed to check ocean freight payment status:', err);
        alert('Failed to verify container payment status. Please try again.');
        return;
      }
    }

    setContainerId(id);
    if (!id) {
      setOceanFreightCompanyName('');
    }
  };

  const handleContainerSelect = async (containerId: number, containerNumber: string) => {
    try {
      const paymentStatus = await containersService.getOceanFreightPaymentStatus(containerId);

      if (paymentStatus.hasOceanFreightPayment) {
        alert('Payment already exists in this container. Please select a different container.');
        return;
      }

      setContainers([{ containerId, containerNumber }]);
      setContainerId(containerId);
      setShowContainerSearch(false);
    } catch (err) {
      console.error('Failed to check ocean freight payment status:', err);
      alert('Failed to verify container payment status. Please try again.');
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
          entityType: 'OceanFreightPayment',
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

  const validateForm = () => {
    if (!containerId) {
      setError('Please select a container');
      return false;
    }
    if (!oceanFreightUSD || Number(oceanFreightUSD) <= 0) {
      setError('Please enter a valid Ocean Freight USD amount');
      return false;
    }
    if (!paymentDate) {
      setError('Please select a payment date');
      return false;
    }
    if (!billDate) {
      setError('Please select a bill date');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setError(null);
    if (!validateForm()) return;

    const missingTypes = pendingAttachments.some(att => !att.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setSaving(true);
    try {
      const payload: OceanFreightPaymentDetail = {
        containerId: Number(containerId),
        oceanFreightUSD: Number(oceanFreightUSD),
        paymentDate,
        billDate,
        status,
      };

      let savedPaymentId = oceanFreightPaymentId;

      if (mode === 'edit' && oceanFreightPaymentId) {
        await oceanFreightPaymentsService.update(oceanFreightPaymentId, payload);
      } else {
        const result = await oceanFreightPaymentsService.create(payload);
        savedPaymentId = result.oceanFreightPaymentId;
      }

      if (pendingAttachments.length > 0 && savedPaymentId) {
        const uploadResult = await uploadAttachments(savedPaymentId);
        if (uploadResult.success) {
          alert(`Ocean Freight Payment saved successfully with ${pendingAttachments.length} attachment(s)!`);
        } else {
          alert(
            `Ocean Freight Payment saved successfully, but ${uploadResult.failedCount} attachment(s) failed to upload.\n\n` +
            `You can retry failed uploads by clicking the retry button, or edit the payment later to upload them.`
          );
        }
      } else {
        alert('Ocean Freight Payment saved successfully!');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Failed to save ocean freight payment:', err);
      setError(err.response?.data?.message || 'Failed to save ocean freight payment');
    } finally {
      setSaving(false);
    }
  };

  const handleRequest = async () => {
    setShowRequestDialog(false);
    setSaving(true);
    setError(null);

    try {
      if (mode === 'add') {
        if (!validateForm()) {
          setSaving(false);
          return;
        }

        const missingTypes = pendingAttachments.some(att => !att.type);
        if (missingTypes) {
          alert('Please select a type for all attachments before submitting');
          setSaving(false);
          return;
        }

        const payload: OceanFreightPaymentDetail = {
          containerId: Number(containerId),
          oceanFreightUSD: Number(oceanFreightUSD),
          paymentDate,
          billDate,
          status: 'Pending',
        };

        const created = await oceanFreightPaymentsService.create(payload);

        if (pendingAttachments.length > 0 && created.oceanFreightPaymentId) {
          await uploadAttachments(created.oceanFreightPaymentId);
        }

        if (created.oceanFreightPaymentId) {
          await oceanFreightPaymentsService.requestPayment(created.oceanFreightPaymentId);
        }
      } else if (oceanFreightPaymentId) {
        const missingTypes = pendingAttachments.some(att => !att.type);
        if (missingTypes) {
          alert('Please select a type for all attachments before submitting');
          setSaving(false);
          return;
        }

        if (pendingAttachments.length > 0) {
          await uploadAttachments(oceanFreightPaymentId);
        }

        await oceanFreightPaymentsService.requestPayment(oceanFreightPaymentId);
      }

      alert('Payment requested successfully!');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to request payment:', err);
      setError(err.response?.data?.message || 'Failed to request payment');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!oceanFreightPaymentId) return;

    const missingTypes = pendingAttachments.some(att => !att.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setSaving(true);
    try {
      if (pendingAttachments.length > 0) {
        await uploadAttachments(oceanFreightPaymentId);
      }

      await oceanFreightPaymentsService.approvePayment(oceanFreightPaymentId);
      setShowApproveDialog(false);
      alert('Payment approved successfully!');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to approve payment:', err);
      setError(err.response?.data?.message || 'Failed to approve payment');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!oceanFreightPaymentId) return;
    setSaving(true);
    try {
      await oceanFreightPaymentsService.rejectPayment(oceanFreightPaymentId);
      setShowRejectDialog(false);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to reject payment:', err);
      setError(err.response?.data?.message || 'Failed to reject payment');
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

  const canEdit = status === 'Pending' || status === 'Rejected';
  const canRequest = mode === 'edit' && status === 'Pending';
  const canApprove = mode === 'edit' && status === 'Requested';
  const canReject = mode === 'edit' && (status === 'Pending' || status === 'Requested');

  const getStatusBadge = (s: PaymentStatus) => {
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
            {mode === 'add' ? 'Add Ocean Freight Payment' : 'Edit Ocean Freight Payment'}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {mode === 'add' ? 'Create a new ocean freight payment record' : 'Update ocean freight payment details'}
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
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
          Payment Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Container <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={containerId}
                onChange={(e) => handleContainerChange(e.target.value)}
                disabled={!canEdit || mode === 'edit'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Container</option>
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
                  className="px-4"
                >
                  Search
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Ocean Freight Company
            </label>
            <input
              type="text"
              value={oceanFreightCompanyName}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              placeholder="Select a container first"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Ocean Freight USD <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={oceanFreightUSD}
              onChange={(e) => setOceanFreightUSD(e.target.value ? Number(e.target.value) : '')}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Bill Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">Attachments</h3>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[var(--color-primary)] transition-colors mb-4">
            <input
              id="attachment-upload-ocean"
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
              disabled={!canEdit}
            />
            <label
              htmlFor="attachment-upload-ocean"
              className={`flex flex-col items-center justify-center ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
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
            <div className="space-y-3 mb-4">
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
                    {canEdit && (
                      <Button
                        onClick={() => removeExistingAttachment(attachment.attachmentId)}
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
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
                            <option value="Ocean Freight Invoice">Ocean Freight Invoice</option>
                            <option value="Payment Receipt">Payment Receipt</option>
                            <option value="Bill of Lading">Bill of Lading</option>
                            <option value="Shipping Documents">Shipping Documents</option>
                            <option value="Other">Other</option>
                          </select>
                          {attachment.status === 'failed' && oceanFreightPaymentId && (
                            <Button
                              onClick={() => retryFailedAttachment(attachment.id, oceanFreightPaymentId)}
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

        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
          {mode === 'add' && (
            <>
              <Button
                onClick={handleSave}
                disabled={saving || pendingAttachments.some(a => a.status === 'uploading')}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {pendingAttachments.some(a => a.status === 'uploading')
                  ? 'Uploading attachments...'
                  : saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={() => setShowRequestDialog(true)}
                disabled={saving || pendingAttachments.some(a => a.status === 'uploading')}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <Send className="w-4 h-4" />
                {pendingAttachments.some(a => a.status === 'uploading')
                  ? 'Uploading attachments...'
                  : 'Request Payment'}
              </Button>
            </>
          )}

          {mode === 'edit' && status === 'Pending' && (
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={() => setShowRequestDialog(true)}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <Send className="w-4 h-4" />
                {saving ? 'Processing...' : 'Request'}
              </Button>
            </>
          )}

          {mode === 'edit' && status === 'Rejected' && (
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={() => setShowRequestDialog(true)}
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
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>
          )}

          {mode === 'edit' && (status === 'Approved' || status === 'Paid') && (
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
        </div>
      </Card>

      <ContainerSearchModal
        isOpen={showContainerSearch}
        onSelect={handleContainerSelect}
        onClose={() => setShowContainerSearch(false)}
      />

      {showRequestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Request Payment</h3>
            <p className="text-gray-600 mb-6">
              {mode === 'add'
                ? 'This will save the ocean freight payment and send it for approval. Continue?'
                : 'Are you sure you want to request payment for this ocean freight payment?'}
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
                onClick={handleRequest}
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
              Are you sure you want to approve this ocean freight payment? This will create a payment request.
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
                onClick={handleApprove}
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
              Are you sure you want to reject this ocean freight payment?
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
                onClick={handleReject}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
