import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, XCircle, CheckCheck, Trash2, Search, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { containersService } from '../../services/containersService';
import { localTransportCompaniesService } from '../../services/localTransportCompaniesService';
import { localPaymentsService, LocalPayment } from '../../services/localPaymentsService';
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

  const amountIncl = (() => {
    const exclVal = typeof amountExcl === 'number' ? amountExcl : 0;
    const vatVal = typeof vat === 'number' ? vat : 0;
    return new Decimal(exclVal).plus(vatVal).toNumber();
  })();

  useEffect(() => {
    if (mode === 'edit' && localPaymentId) {
      loadExisting();
    } else {
      loadContainers();
    }
  }, [mode, localPaymentId]);

  useEffect(() => {
    if (paymentNature === 'Transport') {
      loadTransportCompanies();
    } else {
      setTransportCompanies([]);
      setLocalTransportCompanyId('');
    }
  }, [paymentNature]);

  const loadContainers = async () => {
    try {
      const containerRes = await containersService.search({ pageNumber: 1, pageSize: 500 });
      setContainers(
        (containerRes.items || []).map((c) => ({
          containerId: c.containerId,
          containerNumber: c.containerNumber,
        }))
      );
    } catch (err) {
      console.error('Failed to load containers:', err);
    }
  };

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

      if (data.containerNumber) {
        setContainers([{
          containerId: data.containerId,
          containerNumber: data.containerNumber,
        }]);
      }

      await loadContainers();

      if (data.paymentNature === 'Transport') {
        await loadTransportCompanies();
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
    const exists = containers.find(c => c.containerId === cId);
    if (!exists) {
      setContainers(prev => [...prev, { containerId: cId, containerNumber: cNumber }]);
    }
    setShowContainerSearch(false);
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

      if (mode === 'edit' && localPaymentId) {
        await localPaymentsService.update(localPaymentId, payload);
        alert('Local Payment updated successfully!');
      } else {
        await localPaymentsService.create(payload);
        alert('Local Payment created successfully!');
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

  const handleApprove = () => {
    setShowApproveDialog(true);
  };

  const confirmApprove = async () => {
    setShowApproveDialog(false);
    if (!localPaymentId) return;
    setSaving(true);
    try {
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
                disabled={saving}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
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

          {mode === 'edit' && status === 'Requested' && (
            <>
              <Button
                onClick={handleReject}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
              >
                <XCircle className="w-4 h-4" />
                {saving ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                <CheckCheck className="w-4 h-4" />
                {saving ? 'Processing...' : 'Approve'}
              </Button>
            </>
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

      {showContainerSearch && (
        <ContainerSearchModal
          onClose={() => setShowContainerSearch(false)}
          onSelect={handleContainerSelect}
        />
      )}

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
