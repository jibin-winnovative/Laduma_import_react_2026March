import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, CheckCheck, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { containersService } from '../../services/containersService';
import {
  oceanFreightPaymentsService,
  OceanFreightPaymentDetail,
  PaymentStatus,
} from '../../services/oceanFreightPaymentsService';
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
  const [exchangeRate, setExchangeRate] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState('');
  const [billDate, setBillDate] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('Pending');

  const [loadingInit, setLoadingInit] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const amountInRand = oceanFreightUSD && exchangeRate
    ? Number(oceanFreightUSD) * Number(exchangeRate)
    : 0;

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
      const containerRes = await containersService.search({ pageNumber: 1, pageSize: 500 });

      setContainers(
        (containerRes.items || []).map((c) => ({
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
      setExchangeRate(data.exchangeRate);
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

      await loadDropdowns();
    } catch (err) {
      console.error('Failed to load ocean freight payment:', err);
      setError('Failed to load ocean freight payment data.');
    } finally {
      setLoadingInit(false);
    }
  };

  const handleContainerChange = (val: string) => {
    const id = val ? Number(val) : '';
    setContainerId(id);
    if (!id) {
      setOceanFreightCompanyName('');
    }
  };

  const handleContainerSelect = async (containerId: number, containerNumber: string) => {
    try {
      const paymentStatus = await containersService.getOceanFreightPaymentStatus(containerId);

      if (paymentStatus.hasOceanFreightPayment) {
        alert(
          `An ocean freight payment already exists for this container.\n\n` +
          `Ocean Freight Payment ID: ${paymentStatus.oceanFreightPaymentId}\n` +
          `Status: ${paymentStatus.status}\n\n` +
          `Please select a different container or edit the existing payment.`
        );
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

  const validateForm = () => {
    if (!containerId) {
      setError('Please select a container');
      return false;
    }
    if (!oceanFreightUSD || Number(oceanFreightUSD) <= 0) {
      setError('Please enter a valid Ocean Freight USD amount');
      return false;
    }
    if (!exchangeRate || Number(exchangeRate) <= 0) {
      setError('Please enter a valid exchange rate');
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

    setSaving(true);
    try {
      const payload: OceanFreightPaymentDetail = {
        containerId: Number(containerId),
        oceanFreightUSD: Number(oceanFreightUSD),
        exchangeRate: Number(exchangeRate),
        paymentDate,
        billDate,
        status,
      };

      if (mode === 'edit' && oceanFreightPaymentId) {
        await oceanFreightPaymentsService.update(oceanFreightPaymentId, payload);
      } else {
        await oceanFreightPaymentsService.create(payload);
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

        const payload: OceanFreightPaymentDetail = {
          containerId: Number(containerId),
          oceanFreightUSD: Number(oceanFreightUSD),
          exchangeRate: Number(exchangeRate),
          paymentDate,
          billDate,
          status: 'Pending',
        };

        const created = await oceanFreightPaymentsService.create(payload);
        if (created.oceanFreightPaymentId) {
          await oceanFreightPaymentsService.requestPayment(created.oceanFreightPaymentId);
        }
      } else if (oceanFreightPaymentId) {
        await oceanFreightPaymentsService.requestPayment(oceanFreightPaymentId);
      }
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
    setSaving(true);
    try {
      await oceanFreightPaymentsService.approvePayment(oceanFreightPaymentId);
      setShowApproveDialog(false);
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
              Exchange Rate <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.0001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value ? Number(e.target.value) : '')}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Amount in Rand (Calculated)
            </label>
            <input
              type="text"
              value={amountInRand.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
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

        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
          {mode === 'add' && (
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
                Request Payment
              </Button>
            </>
          )}

          {mode === 'edit' && (status === 'Pending' || status === 'Rejected') && (
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

          {mode === 'edit' && status === 'Requested' && (
            <>
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
              >
                <XCircle className="w-4 h-4" />
                {saving ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                onClick={() => setShowApproveDialog(true)}
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
