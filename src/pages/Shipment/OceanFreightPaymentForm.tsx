import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, CheckCheck, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { containersService } from '../../services/containersService';
import { oceanFreightCompaniesService } from '../../services/oceanFreightCompaniesService';
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

interface OceanFreightCompanyOption {
  oceanFreightCompanyId: number;
  companyName: string;
}

export const OceanFreightPaymentForm = ({
  mode,
  oceanFreightPaymentId,
  onClose,
  onSuccess,
}: OceanFreightPaymentFormProps) => {
  const [containers, setContainers] = useState<ContainerOption[]>([]);
  const [companies, setCompanies] = useState<OceanFreightCompanyOption[]>([]);
  const [showContainerSearch, setShowContainerSearch] = useState(false);

  const [containerId, setContainerId] = useState<number | ''>('');
  const [oceanFreightCompanyId, setOceanFreightCompanyId] = useState<number | ''>('');
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

  const loadDropdowns = async () => {
    try {
      const [containerRes, companyRes] = await Promise.all([
        containersService.search({ pageNumber: 1, pageSize: 500 }),
        oceanFreightCompaniesService.getAll({ pageSize: 500 }),
      ]);

      setContainers(
        (containerRes.items || []).map((c) => ({
          containerId: c.containerId,
          containerNumber: c.containerNumber,
        }))
      );

      const companyRes2 = companyRes as any;
      const companyArray: any[] =
        companyRes2?.data?.data ?? companyRes2?.data ?? (Array.isArray(companyRes2) ? companyRes2 : []);
      setCompanies(
        companyArray.map((c: any) => ({
          oceanFreightCompanyId: c.oceanFreightCompanyId,
          companyName: c.companyName || '',
        }))
      );
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
    }
  };

  const loadExisting = async () => {
    if (!oceanFreightPaymentId) return;
    setLoadingInit(true);
    try {
      const [data, companyRes] = await Promise.all([
        oceanFreightPaymentsService.getById(oceanFreightPaymentId),
        oceanFreightCompaniesService.getAll({ pageSize: 500 }),
      ]);

      setContainerId(data.containerId);
      setOceanFreightCompanyId(data.oceanFreightCompanyId || '');
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

      const companyRes2 = companyRes as any;
      const companyArray: any[] =
        companyRes2?.data?.data ?? companyRes2?.data ?? (Array.isArray(companyRes2) ? companyRes2 : []);
      setCompanies(
        companyArray.map((c: any) => ({
          oceanFreightCompanyId: c.oceanFreightCompanyId,
          companyName: c.companyName || '',
        }))
      );
    } catch (err) {
      console.error('Failed to load ocean freight payment:', err);
      setError('Failed to load ocean freight payment data.');
    } finally {
      setLoadingInit(false);
    }
  };

  const handleContainerSelect = (container: { containerId: number; containerNumber: string }) => {
    setContainerId(container.containerId);
    if (!containers.find(c => c.containerId === container.containerId)) {
      setContainers(prev => [...prev, container]);
    }
    setShowContainerSearch(false);
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
        oceanFreightCompanyId: oceanFreightCompanyId ? Number(oceanFreightCompanyId) : undefined,
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
    if (!oceanFreightPaymentId) return;
    setSaving(true);
    try {
      await oceanFreightPaymentsService.requestPayment(oceanFreightPaymentId);
      setShowRequestDialog(false);
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
      <div className="flex items-center justify-center py-8">
        <p className="text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    );
  }

  const canEdit = status === 'Pending' || status === 'Rejected';
  const canRequest = mode === 'edit' && status === 'Pending';
  const canApprove = mode === 'edit' && status === 'Requested';
  const canReject = mode === 'edit' && (status === 'Pending' || status === 'Requested');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onClose} variant="secondary" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            {mode === 'add' ? 'Add' : 'Edit'} Ocean Freight Payment
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {canRequest && (
            <Button
              onClick={() => setShowRequestDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Request
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={() => setShowApproveDialog(true)}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Approve
            </Button>
          )}
          {canReject && (
            <Button
              onClick={() => setShowRejectDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
          )}
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[var(--color-primary)] hover:opacity-90 text-white flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Container <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={containerId}
                onChange={(e) => setContainerId(e.target.value ? Number(e.target.value) : '')}
                disabled={!canEdit}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Container</option>
                {containers.map((c) => (
                  <option key={c.containerId} value={c.containerId}>
                    {c.containerNumber}
                  </option>
                ))}
              </select>
              {canEdit && (
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
            <select
              value={oceanFreightCompanyId}
              onChange={(e) => setOceanFreightCompanyId(e.target.value ? Number(e.target.value) : '')}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select Company (Optional)</option>
              {companies.map((c) => (
                <option key={c.oceanFreightCompanyId} value={c.oceanFreightCompanyId}>
                  {c.companyName}
                </option>
              ))}
            </select>
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

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Status</label>
            <input
              type="text"
              value={status}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </Card>

      {showContainerSearch && (
        <ContainerSearchModal
          onSelect={handleContainerSelect}
          onClose={() => setShowContainerSearch(false)}
        />
      )}

      {showRequestDialog && (
        <Modal
          isOpen={showRequestDialog}
          onClose={() => setShowRequestDialog(false)}
          title="Request Payment"
        >
          <div className="space-y-4">
            <p className="text-[var(--color-text)]">
              Are you sure you want to request this ocean freight payment?
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowRequestDialog(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleRequest} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? 'Requesting...' : 'Request'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showApproveDialog && (
        <Modal
          isOpen={showApproveDialog}
          onClose={() => setShowApproveDialog(false)}
          title="Approve Payment"
        >
          <div className="space-y-4">
            <p className="text-[var(--color-text)]">
              Are you sure you want to approve this ocean freight payment? This will create a payment request.
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowApproveDialog(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
                {saving ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showRejectDialog && (
        <Modal
          isOpen={showRejectDialog}
          onClose={() => setShowRejectDialog(false)}
          title="Reject Payment"
        >
          <div className="space-y-4">
            <p className="text-[var(--color-text)]">
              Are you sure you want to reject this ocean freight payment?
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowRejectDialog(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white">
                {saving ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
