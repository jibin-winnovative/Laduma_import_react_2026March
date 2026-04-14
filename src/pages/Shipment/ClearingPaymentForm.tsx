import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, CheckCheck, Trash2, CreditCard as Edit2, AlertCircle, Search, Send, XCircle, Upload, FileText, Download, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { containersService } from '../../services/containersService';
import { clearingAgentsService } from '../../services/clearingAgentsService';
import {
  clearingPaymentsService,
  ClearingPaymentDetail,
  ClearingPaymentPO,
  ClearingPaymentChargeLine,
  ContainerPOItem,
  PaymentStatus,
} from '../../services/clearingPaymentsService';
import { attachmentService, Attachment as ExistingAttachment } from '../../services/attachmentService';
import { POChargeEntryModal } from './POChargeEntryModal';
import { ContainerSearchModal } from './ContainerSearchModal';

interface ClearingPaymentFormProps {
  mode: 'add' | 'edit';
  clearingPaymentId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface ContainerOption {
  containerId: number;
  containerNumber: string;
}

interface AgentOption {
  clearingAgentId: number;
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

export const ClearingPaymentForm = ({
  mode,
  clearingPaymentId,
  onClose,
  onSuccess,
}: ClearingPaymentFormProps) => {
  const [containers, setContainers] = useState<ContainerOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [poList, setPoList] = useState<ContainerPOItem[]>([]);
  const [chargeMap, setChargeMap] = useState<Map<number, ClearingPaymentChargeLine[]>>(new Map());
  const [chargeModalPoId, setChargeModalPoId] = useState<number | null>(null);
  const [showContainerSearch, setShowContainerSearch] = useState(false);

  const [containerId, setContainerId] = useState<number | ''>('');
  const [clearingAgentId, setClearingAgentId] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState('');
  const [billDate, setBillDate] = useState('');
  const [clearingAmount, setClearingAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<PaymentStatus>('Pending');

  const [loadingInit, setLoadingInit] = useState(mode === 'edit');
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);

  useEffect(() => {
    if (mode === 'edit' && clearingPaymentId) {
      loadExisting();
    } else {
      loadDropdowns();
    }
  }, [mode, clearingPaymentId]);

  const loadDropdowns = async () => {
    const [containerRes, agentsRes] = await Promise.allSettled([
      containersService.getDropdown(),
      clearingAgentsService.getDropdown(),
    ]);

    if (containerRes.status === 'fulfilled') {
      setContainers(
        containerRes.value.map((c) => ({
          containerId: c.containerId,
          containerNumber: c.containerNumber,
        }))
      );
    } else {
      console.error('Failed to load containers:', containerRes.reason);
    }

    if (agentsRes.status === 'fulfilled') {
      setAgents(
        agentsRes.value.map((a) => ({
          clearingAgentId: a.clearingAgentId,
          companyName: a.agentName,
        }))
      );
    } else {
      console.error('Failed to load clearing agents:', agentsRes.reason);
    }
  };

  const loadExisting = async () => {
    if (!clearingPaymentId) return;
    setLoadingInit(true);
    try {
      const data = await clearingPaymentsService.getById(clearingPaymentId);

      setContainerId(data.containerId);
      setClearingAgentId(data.clearingAgentId);
      setPaymentDate(data.paymentDate ? data.paymentDate.slice(0, 10) : '');
      setBillDate(data.billDate ? data.billDate.slice(0, 10) : '');
      setClearingAmount(data.clearingAmount);
      setStatus(data.status);

      if (data.containerNumber) {
        setContainers([{
          containerId: data.containerId,
          containerNumber: data.containerNumber,
        }]);
      }

      await loadDropdowns();

      loadFromAPIData(data);

      if (data.attachments && data.attachments.length > 0) {
        setExistingAttachments(data.attachments.map((att: any) => ({
          attachmentId: att.attachmentId,
          fileName: att.fileName,
          fileSize: att.fileSize,
          contentType: att.contentType,
          fileUrl: att.fileUrl,
          entityType: att.entityType,
          entityId: att.entityId,
          category: att.category,
        })));
      }
    } catch (err) {
      console.error('Failed to load clearing payment:', err);
      setError('Failed to load clearing payment data.');
    } finally {
      setLoadingInit(false);
    }
  };

  const loadFromAPIData = (data: ClearingPaymentDetail) => {
    const purchaseOrders = data.pOs || data.purchaseOrders || [];

    const pos: ContainerPOItem[] = purchaseOrders.map((po) => ({
      purchaseOrderId: po.purchaseOrderId,
      poNumber: po.poNumber || '',
      poDate: po.poDate || '',
      supplierName: po.supplierName || '',
      invoiceAmount: po.invoiceAmount || 0,
      totalCbm: po.totalCBM || po.totalCbm || 0,
    }));
    setPoList(pos);

    const map = new Map<number, ClearingPaymentChargeLine[]>();
    purchaseOrders.forEach((po) => {
      const charges = po.charges || po.chargeLines || [];
      if (charges.length > 0) {
        map.set(po.purchaseOrderId, charges);
      }
    });
    setChargeMap(map);
  };


  const loadContainerPOs = async (cId: number) => {
    setLoadingPOs(true);
    try {
      const pos = await clearingPaymentsService.getContainerPOs(cId);
      setPoList(pos);
      setChargeMap(new Map());
    } catch (err) {
      console.error('Failed to load POs:', err);
      setPoList([]);
    } finally {
      setLoadingPOs(false);
    }
  };

  const handleContainerChange = async (val: string) => {
    const id = val ? Number(val) : '';

    if (id) {
      try {
        const paymentStatus = await containersService.getClearingPaymentStatus(id);

        if (paymentStatus.hasClearingPayment) {
          alert('Payment already exists in this container. Please select a different container.');
          return;
        }
      } catch (err) {
        console.error('Failed to check clearing payment status:', err);
        alert('Failed to verify container payment status. Please try again.');
        return;
      }
    }

    setContainerId(id);
    setClearingAgentId('');
    setPoList([]);
    setChargeMap(new Map());
    if (id) {
      await loadContainerPOs(id);
    }
  };

  const handleContainerSelect = async (id: number, containerNumber: string) => {
    try {
      const paymentStatus = await containersService.getClearingPaymentStatus(id);

      if (paymentStatus.hasClearingPayment) {
        alert('Payment already exists in this container. Please select a different container.');
        return;
      }

      setContainers([{ containerId: id, containerNumber }]);
      setContainerId(id);
      setClearingAgentId('');
      setPoList([]);
      setChargeMap(new Map());
      await loadContainerPOs(id);
    } catch (err) {
      console.error('Failed to check clearing payment status:', err);
      alert('Failed to verify container payment status. Please try again.');
    }
  };

  const handleChargesSaved = (poId: number, lines: ClearingPaymentChargeLine[]) => {
    setChargeMap((prev) => {
      const next = new Map(prev);
      next.set(poId, lines);
      return next;
    });
    setChargeModalPoId(null);
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
        console.log(`📤 [${index + 1}] Uploading: ${attachment.file.name} (Attempt ${currentRetry + 1}/${MAX_RETRIES + 1})`);

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
          entityType: 'ClearingPayment',
          entityId: entityId,
          ...(attachment.type ? { category: attachment.type } : {}),
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

  const totalChargesAllPOs = useMemo(() => {
    let total = 0;
    chargeMap.forEach((lines) => {
      lines.forEach((l) => { total += l.amountIncl || 0; });
    });
    return total;
  }, [chargeMap]);

  const getPOTotal = (poId: number) => {
    const lines = chargeMap.get(poId) || [];
    return lines.reduce((s, l) => s + (l.amountIncl || 0), 0);
  };

  const chargesEnteredStatus = (poId: number) => {
    const lines = chargeMap.get(poId) || [];
    return lines.length > 0 ? 'Entered' : 'Pending';
  };

  const validateBeforeSave = (): string | null => {
    if (!containerId) return 'Please select a container.';
    if (!clearingAgentId) return 'Please select a clearing agent.';
    if (!paymentDate) return 'Please enter a payment date.';
    if (!billDate) return 'Please enter a bill date.';
    if (clearingAmount === '' || Number(clearingAmount) <= 0) return 'Please enter a valid clearing amount.';

    const amt = Number(clearingAmount);
    const diff = Math.abs(amt - totalChargesAllPOs);
    if (diff > 0.01) {
      return `Clearing Amount (${fmt(amt)}) must equal total PO charges (${fmt(totalChargesAllPOs)}).`;
    }
    return null;
  };

  const toISODateTime = (dateStr: string) =>
    dateStr ? `${dateStr}T00:00:00` : '';

  const buildPayload = (): any => ({
    ...(mode === 'edit' && clearingPaymentId ? { clearingPaymentId } : {}),
    containerId: Number(containerId),
    clearingAgentId: Number(clearingAgentId),
    paymentDate: toISODateTime(paymentDate),
    billDate: toISODateTime(billDate),
    clearingAmount: Number(clearingAmount),
    status: 'Pending',
    pOs: poList
      .filter((po) => (chargeMap.get(po.purchaseOrderId) || []).length > 0)
      .map((po) => ({
        purchaseOrderId: po.purchaseOrderId,
        charges: (chargeMap.get(po.purchaseOrderId) || []).map((line) => ({
          clearingPaymentChargeId: line.clearingPaymentChargeId,
          amountExcl: line.amountExcl,
          vat: line.vat,
          amountIncl: line.amountIncl,
        })),
      })),
  });

  const handleSaveDraft = async () => {
    const err = validateBeforeSave();
    if (err) {
      setError(err);
      return;
    }

    const missingTypes = pendingAttachments.some(att => !att.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const payload = buildPayload();
      let savedPaymentId = clearingPaymentId;

      if (mode === 'add') {
        const result = await clearingPaymentsService.create(payload);
        savedPaymentId = result.clearingPaymentId;
      } else if (clearingPaymentId) {
        await clearingPaymentsService.update(clearingPaymentId, payload);
      }

      if (pendingAttachments.length > 0 && savedPaymentId) {
        const uploadResult = await uploadAttachments(savedPaymentId);
        if (uploadResult.success) {
          alert(`Clearing Payment saved successfully with ${pendingAttachments.length} attachment(s)!`);
        } else {
          alert(
            `Clearing Payment saved successfully, but ${uploadResult.failedCount} attachment(s) failed to upload.\n\n` +
            `You can retry failed uploads by clicking the retry button, or edit the payment later to upload them.`
          );
        }
      } else {
        alert('Clearing Payment saved successfully!');
      }

      onSuccess();
    } catch (e: any) {
      console.error('Save failed:', e);
      setError(e?.response?.data?.message || 'Failed to save clearing payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPayment = async () => {
    const err = validateBeforeSave();
    if (err) {
      setError(err);
      return;
    }

    const missingTypes = pendingAttachments.some(att => !att.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setShowRequestDialog(false);
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      let paymentId = clearingPaymentId;

      if (mode === 'add') {
        const result = await clearingPaymentsService.create(payload);
        paymentId = result.clearingPaymentId;
      } else if (clearingPaymentId) {
        await clearingPaymentsService.update(clearingPaymentId, payload);
      }

      if (pendingAttachments.length > 0 && paymentId) {
        await uploadAttachments(paymentId);
      }

      if (paymentId) {
        await clearingPaymentsService.requestPayment(paymentId);
      }

      alert('Payment requested successfully!');
      onSuccess();
    } catch (e: any) {
      console.error('Request failed:', e);
      setError(e?.response?.data?.message || 'Failed to request payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleReRequest = async () => {
    const err = validateBeforeSave();
    if (err) {
      setError(err);
      return;
    }

    const missingTypes = pendingAttachments.some(att => !att.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (clearingPaymentId) {
        await clearingPaymentsService.update(clearingPaymentId, payload);
      }

      if (pendingAttachments.length > 0 && clearingPaymentId) {
        await uploadAttachments(clearingPaymentId);
      }

      if (clearingPaymentId) {
        await clearingPaymentsService.requestPayment(clearingPaymentId);
      }

      alert('Payment re-requested successfully!');
      onSuccess();
    } catch (e: any) {
      console.error('Re-request failed:', e);
      setError(e?.response?.data?.message || 'Failed to re-request payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!clearingPaymentId) return;
    const err = validateBeforeSave();
    if (err) {
      setError(err);
      return;
    }

    const missingTypes = pendingAttachments.some(att => !att.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setShowApproveDialog(false);
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      await clearingPaymentsService.update(clearingPaymentId, payload);

      if (pendingAttachments.length > 0) {
        await uploadAttachments(clearingPaymentId);
      }

      await clearingPaymentsService.approvePayment(clearingPaymentId);
      alert('Payment approved successfully!');
      onSuccess();
    } catch (e: any) {
      console.error('Approve failed:', e);
      setError(e?.response?.data?.message || 'Failed to approve payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!clearingPaymentId) return;
    setShowRejectDialog(false);
    setSaving(true);
    setError(null);
    try {
      await clearingPaymentsService.rejectPayment(clearingPaymentId);
      onSuccess();
    } catch (e: any) {
      console.error('Reject failed:', e);
      setError(e?.response?.data?.message || 'Failed to reject payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setContainerId('');
    setClearingAgentId('');
    setPaymentDate('');
    setBillDate('');
    setClearingAmount('');
    setPoList([]);
    setChargeMap(new Map());
    setError(null);
  };

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const chargeModalPO = chargeModalPoId !== null ? poList.find((p) => p.purchaseOrderId === chargeModalPoId) : null;

  if (loadingInit) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
        </div>
      </div>
    );
  }

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
            {mode === 'add' ? 'Add Clearing Payment' : 'Edit Clearing Payment'}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {mode === 'add' ? 'Create a new clearing payment record' : 'Update clearing payment details'}
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
          Header Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Container <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={containerId}
                onChange={(e) => handleContainerChange(e.target.value)}
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
              Clearing Agent <span className="text-red-500">*</span>
            </label>
            <select
              value={clearingAgentId}
              onChange={(e) => setClearingAgentId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            >
              <option value="">
                {agents.length === 0 ? 'No clearing agents available' : 'Select clearing agent...'}
              </option>
              {agents.map((a) => (
                <option key={a.clearingAgentId} value={a.clearingAgentId}>
                  {a.companyName}
                </option>
              ))}
            </select>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clearing Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={clearingAmount}
              onChange={(e) => setClearingAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="0.00"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-right"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total PO Charges (calculated)
            </label>
            <div
              className={`w-full px-4 py-2.5 border rounded-lg text-right font-medium text-sm ${
                clearingAmount !== '' && Math.abs(Number(clearingAmount) - totalChargesAllPOs) > 0.01
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-gray-50 text-gray-900'
              }`}
            >
              {fmt(totalChargesAllPOs)}
            </div>
            {clearingAmount !== '' && Math.abs(Number(clearingAmount) - totalChargesAllPOs) > 0.01 && (
              <p className="text-xs text-red-600 mt-1">Mismatch: difference is {fmt(Math.abs(Number(clearingAmount) - totalChargesAllPOs))}</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">
            Purchase Orders
            {containerId && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({poList.length} PO{poList.length !== 1 ? 's' : ''} in this container)
              </span>
            )}
          </h2>
        </div>

        {!containerId ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Select a container above to load its purchase orders
          </div>
        ) : loadingPOs ? (
          <div className="px-6 py-12 text-center text-gray-500 text-sm">Loading purchase orders...</div>
        ) : poList.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No purchase orders found for this container
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total CBM</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Charges Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Charges</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {poList.map((po) => {
                  const poTotal = getPOTotal(po.purchaseOrderId);
                  const status = chargesEnteredStatus(po.purchaseOrderId);
                  return (
                    <tr key={po.purchaseOrderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{po.poNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(po.poDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.supplierName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{fmt(po.invoiceAmount || 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{(po.totalCbm || 0).toFixed(3)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'Entered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{fmt(poTotal)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setChargeModalPoId(po.purchaseOrderId)}
                          className="flex items-center gap-1.5 text-[var(--color-primary)] hover:opacity-80 font-medium text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          {status === 'Entered' ? 'Edit Charges' : 'Add Charges'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td colSpan={6} className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Header Total
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-[var(--color-primary)]">
                    {fmt(totalChargesAllPOs)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">Attachments</h3>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[var(--color-primary)] transition-colors">
            <input
              id="attachment-upload"
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
              htmlFor="attachment-upload"
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
                    {attachment.category && (
                      <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {attachment.category}
                      </span>
                    )}
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
                            <option value="Clearing Bill">Clearing Bill</option>
                            <option value="Payment Receipt">Payment Receipt</option>
                            <option value="Import Documents">Import Documents</option>
                            <option value="Tax Invoice">Tax Invoice</option>
                            <option value="Other">Other</option>
                          </select>
                          {attachment.status === 'failed' && clearingPaymentId && (
                            <Button
                              onClick={() => retryFailedAttachment(attachment.id, clearingPaymentId)}
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
            onClick={handleClear}
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
                onClick={handleSaveDraft}
                disabled={saving || pendingAttachments.some(a => a.status === 'uploading')}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
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
                  : saving ? 'Processing...' : 'Request Payment'}
              </Button>
            </>
          )}

          {mode === 'edit' && status === 'Pending' && (
            <>
              <Button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={() => setShowRequestDialog(true)}
                disabled={saving || pendingAttachments.some(a => a.status === 'uploading')}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <Send className="w-4 h-4" />
                {pendingAttachments.some(a => a.status === 'uploading')
                  ? 'Uploading attachments...'
                  : saving ? 'Processing...' : 'Request Payment'}
              </Button>
            </>
          )}

          {mode === 'edit' && status === 'Rejected' && (
            <>
              <Button
                onClick={handleSaveDraft}
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
      </div>

      <ContainerSearchModal
        isOpen={showContainerSearch}
        onClose={() => setShowContainerSearch(false)}
        onSelect={handleContainerSelect}
      />

      {chargeModalPoId !== null && chargeModalPO && (
        <POChargeEntryModal
          poNumber={chargeModalPO.poNumber}
          supplierName={chargeModalPO.supplierName}
          chargeLines={chargeMap.get(chargeModalPoId) || []}
          onSave={(lines) => handleChargesSaved(chargeModalPoId, lines)}
          onClose={() => setChargeModalPoId(null)}
        />
      )}

      {showRequestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Request Payment</h3>
            <p className="text-gray-600 mb-6">
              {mode === 'add'
                ? 'This will save the clearing payment and send it for approval. Continue?'
                : 'Are you sure you want to request payment for this clearing payment?'}
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
                onClick={handleRequestPayment}
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
              Are you sure you want to approve this clearing payment? This will create a payment request.
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
              Are you sure you want to reject this clearing payment request?
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
