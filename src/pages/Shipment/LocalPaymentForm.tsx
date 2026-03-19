import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, XCircle, CheckCheck, Trash2 } from 'lucide-react';
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
      loadDropdowns();
    }
  }, [mode, localPaymentId]);

  const loadDropdowns = async () => {
    try {
      const [containerRes, transportRes] = await Promise.all([
        containersService.search({ pageNumber: 1, pageSize: 500 }),
        localTransportCompaniesService.getActive()
      ]);

      setContainers(
        (containerRes.items || []).map((c) => ({
          containerId: c.containerId,
          containerNumber: c.containerNumber,
        }))
      );

      setTransportCompanies(
        (transportRes.data || []).map((t) => ({
          localTransportCompanyId: t.localTransportCompanyId,
          companyName: t.companyName,
        }))
      );
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
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

      await loadDropdowns();
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
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  const showTransportCompanyField = paymentNature === 'Transport';
  const canRequestPayment = mode === 'edit' && status === 'Pending';
  const canApprove = mode === 'edit' && status === 'Requested';
  const canReject = mode === 'edit' && (status === 'Requested' || status === 'Approved');

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'add' ? 'Create Local Payment' : 'Edit Local Payment'}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {mode === 'edit' && (
            <Button variant="outline" onClick={handleDelete} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          {canRequestPayment && (
            <Button onClick={handleRequestPayment} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Request Payment
            </Button>
          )}
          {canApprove && (
            <Button onClick={handleApprove} disabled={saving} className="bg-green-600 hover:bg-green-700">
              <CheckCheck className="w-4 h-4 mr-2" />
              Approve
            </Button>
          )}
          {canReject && (
            <Button variant="outline" onClick={handleReject} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Payment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Container Number <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <select
                    value={containerId}
                    onChange={(e) => setContainerId(Number(e.target.value) || '')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={mode === 'edit'}
                  >
                    <option value="">Select Container</option>
                    {containers.map((c) => (
                      <option key={c.containerId} value={c.containerId}>
                        {c.containerNumber}
                      </option>
                    ))}
                  </select>
                  {mode === 'add' && (
                    <Button variant="outline" onClick={() => setShowContainerSearch(true)}>
                      Search
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Payment Nature</option>
                  {PAYMENT_NATURES.map((nature) => (
                    <option key={nature} value={nature}>
                      {nature}
                    </option>
                  ))}
                </select>
              </div>

              {showTransportCompanyField && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transport Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={localTransportCompanyId}
                    onChange={(e) => setLocalTransportCompanyId(Number(e.target.value) || '')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Transport Company</option>
                    {transportCompanies.map((t) => (
                      <option key={t.localTransportCompanyId} value={t.localTransportCompanyId}>
                        {t.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount Excl <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={amountExcl}
                  onChange={(e) => setAmountExcl(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  VAT <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={vat}
                  onChange={(e) => setVat(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount Incl (Auto Calculated)
                </label>
                <input
                  type="text"
                  value={amountIncl.toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bill Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={mode === 'edit'}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showContainerSearch && (
        <ContainerSearchModal
          onSelect={handleContainerSelect}
          onClose={() => setShowContainerSearch(false)}
        />
      )}

      {showRequestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Request Payment</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to submit this payment request?
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmRequest}>
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showApproveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Approve Payment</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to approve this payment?
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmApprove} className="bg-green-600 hover:bg-green-700">
                Approve
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Reject Payment</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to reject this payment?
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmReject} className="bg-red-600 hover:bg-red-700">
                Reject
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Delete</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this local payment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
