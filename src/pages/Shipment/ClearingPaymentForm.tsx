import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, CheckCheck, Trash2, CreditCard as Edit2, AlertCircle } from 'lucide-react';
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
} from '../../services/clearingPaymentsService';
import { POChargeEntryModal } from './POChargeEntryModal';

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

  const [containerId, setContainerId] = useState<number | ''>('');
  const [clearingAgentId, setClearingAgentId] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState('');
  const [billDate, setBillDate] = useState('');
  const [clearingAmount, setClearingAmount] = useState<number | ''>('');

  const [loadingInit, setLoadingInit] = useState(mode === 'edit');
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && clearingPaymentId) {
      loadExisting();
    }
  }, [mode, clearingPaymentId]);

  const loadDropdowns = async () => {
    try {
      const [containerRes, agentRes] = await Promise.all([
        containersService.search({ pageNumber: 1, pageSize: 500 }),
        clearingAgentsService.getAll({ pageSize: 500 }),
      ]);

      setContainers(
        (containerRes.items || []).map((c) => ({
          containerId: c.containerId,
          containerNumber: c.containerNumber,
        }))
      );

      const agentRes2 = agentRes as any;
      const agentArray: any[] =
        agentRes2?.data?.data ?? agentRes2?.data ?? (Array.isArray(agentRes2) ? agentRes2 : []);
      setAgents(
        agentArray.map((a: any) => ({
          clearingAgentId: a.clearingAgentId,
          companyName: a.agentName || a.companyName || '',
        }))
      );
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
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

      if (data.containerId) {
        await loadContainerPOs(data.containerId, data.purchaseOrders || []);
      }
    } catch (err) {
      console.error('Failed to load clearing payment:', err);
      setError('Failed to load clearing payment data.');
    } finally {
      setLoadingInit(false);
    }
  };

  const loadContainerPOs = async (cId: number, existingPOs: ClearingPaymentPO[] = []) => {
    setLoadingPOs(true);
    try {
      const pos = await clearingPaymentsService.getContainerPOs(cId);
      setPoList(pos);

      const map = new Map<number, ClearingPaymentChargeLine[]>();
      existingPOs.forEach((po) => {
        if (po.chargeLines && po.chargeLines.length > 0) {
          map.set(po.purchaseOrderId, po.chargeLines);
        }
      });
      setChargeMap(map);
    } catch (err) {
      console.error('Failed to load POs:', err);
      setPoList([]);
    } finally {
      setLoadingPOs(false);
    }
  };

  const handleContainerChange = async (val: string) => {
    const id = val ? Number(val) : '';
    setContainerId(id);
    setPoList([]);
    setChargeMap(new Map());
    if (id) {
      await loadContainerPOs(id);
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

  const validateBeforeSave = (status: 'Draft' | 'Completed'): string | null => {
    if (!containerId) return 'Please select a container.';
    if (!clearingAgentId) return 'Please select a clearing agent.';
    if (!paymentDate) return 'Please enter a payment date.';
    if (!billDate) return 'Please enter a bill date.';
    if (clearingAmount === '' || Number(clearingAmount) <= 0) return 'Please enter a valid clearing amount.';

    if (status === 'Completed') {
      const amt = Number(clearingAmount);
      const diff = Math.abs(amt - totalChargesAllPOs);
      if (diff > 0.01) {
        return `Clearing Amount (${fmt(amt)}) must equal total PO charges (${fmt(totalChargesAllPOs)}).`;
      }
    }
    return null;
  };

  const toISODateTime = (dateStr: string) =>
    dateStr ? `${dateStr}T00:00:00` : '';

  const buildPayload = (status: 'Draft' | 'Completed'): any => ({
    ...(mode === 'edit' && clearingPaymentId ? { clearingPaymentId } : {}),
    containerId: Number(containerId),
    clearingAgentId: Number(clearingAgentId),
    paymentDate: toISODateTime(paymentDate),
    billDate: toISODateTime(billDate),
    clearingAmount: Number(clearingAmount),
    status,
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

  const handleSave = async (status: 'Draft' | 'Completed') => {
    const err = validateBeforeSave(status);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = buildPayload(status);
      if (mode === 'add') {
        await clearingPaymentsService.create(payload);
      } else if (clearingPaymentId) {
        await clearingPaymentsService.update(clearingPaymentId, payload);
      }
      onSuccess();
    } catch (e: any) {
      console.error('Save failed:', e);
      setError(e?.response?.data?.message || 'Failed to save clearing payment.');
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            {mode === 'add' ? 'Add Clearing Payment' : 'Edit Clearing Payment'}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {mode === 'add' ? 'Create a new clearing payment record' : 'Update clearing payment details'}
          </p>
        </div>
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
            <select
              value={containerId}
              onChange={(e) => handleContainerChange(e.target.value)}
              disabled={mode === 'edit'}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select container...</option>
              {containers.map((c) => (
                <option key={c.containerId} value={c.containerId}>
                  {c.containerNumber}
                </option>
              ))}
            </select>
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
              <option value="">Select clearing agent...</option>
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8">
        <Button
          onClick={handleClear}
          variant="secondary"
          disabled={saving}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSave('Draft')}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Temp Save'}
          </Button>
          <Button
            onClick={() => handleSave('Completed')}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
          >
            <CheckCheck className="w-4 h-4" />
            {saving ? 'Saving...' : 'Finish'}
          </Button>
        </div>
      </div>

      {chargeModalPoId !== null && chargeModalPO && (
        <POChargeEntryModal
          poNumber={chargeModalPO.poNumber}
          supplierName={chargeModalPO.supplierName}
          chargeLines={chargeMap.get(chargeModalPoId) || []}
          onSave={(lines) => handleChargesSaved(chargeModalPoId, lines)}
          onClose={() => setChargeModalPoId(null)}
        />
      )}
    </div>
  );
};
