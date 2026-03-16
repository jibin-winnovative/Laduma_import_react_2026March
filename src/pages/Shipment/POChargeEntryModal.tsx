import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { clearingPaymentChargesService, ClearingPaymentCharge } from '../../services/clearingPaymentChargesService';
import { ClearingPaymentChargeLine } from '../../services/clearingPaymentsService';

interface POChargeEntryModalProps {
  poNumber: string;
  supplierName: string;
  chargeLines: ClearingPaymentChargeLine[];
  onSave: (lines: ClearingPaymentChargeLine[]) => void;
  onClose: () => void;
}

interface ChargeLineDraft {
  id: string;
  clearingPaymentChargeId: number | '';
  clearingPaymentChargeName: string;
  amountExcl: number | '';
  vat: number | '';
  amountIncl: number;
}

const newLine = (): ChargeLineDraft => ({
  id: Math.random().toString(36).slice(2),
  clearingPaymentChargeId: '',
  clearingPaymentChargeName: '',
  amountExcl: '',
  vat: '',
  amountIncl: 0,
});

export const POChargeEntryModal = ({
  poNumber,
  supplierName,
  chargeLines,
  onSave,
  onClose,
}: POChargeEntryModalProps) => {
  const [chargeTypes, setChargeTypes] = useState<ClearingPaymentCharge[]>([]);
  const [lines, setLines] = useState<ChargeLineDraft[]>([]);

  useEffect(() => {
    clearingPaymentChargesService.getActive().then(setChargeTypes).catch(console.error);

    if (chargeLines.length > 0) {
      setLines(
        chargeLines.map((cl) => ({
          id: Math.random().toString(36).slice(2),
          clearingPaymentChargeId: cl.clearingPaymentChargeId,
          clearingPaymentChargeName: cl.clearingPaymentChargeName || '',
          amountExcl: cl.amountExcl,
          vat: cl.vat,
          amountIncl: cl.amountIncl,
        }))
      );
    } else {
      setLines([newLine()]);
    }
  }, []);

  const updateLine = (id: string, field: keyof ChargeLineDraft, value: any) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };

        if (field === 'clearingPaymentChargeId') {
          const ct = chargeTypes.find((c) => c.clearingPaymentChargeId === Number(value));
          updated.clearingPaymentChargeName = ct?.chargeName || '';
        }

        const excl = field === 'amountExcl' ? Number(value) || 0 : Number(updated.amountExcl) || 0;
        const vat = field === 'vat' ? Number(value) || 0 : Number(updated.vat) || 0;
        updated.amountIncl = excl + vat;

        return updated;
      })
    );
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);

  const removeLine = (id: string) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const totalAmountIncl = lines.reduce((s, l) => s + (l.amountIncl || 0), 0);

  const handleSave = () => {
    const valid = lines.every(
      (l) => l.clearingPaymentChargeId !== '' && l.amountExcl !== '' && l.vat !== ''
    );
    if (!valid) {
      alert('Please fill in all charge line fields.');
      return;
    }

    const result: ClearingPaymentChargeLine[] = lines.map((l) => ({
      clearingPaymentChargeId: Number(l.clearingPaymentChargeId),
      clearingPaymentChargeName: l.clearingPaymentChargeName,
      amountExcl: Number(l.amountExcl),
      vat: Number(l.vat),
      amountIncl: l.amountIncl,
    }));

    onSave(result);
  };

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
          <div>
            <h2 className="text-xl font-bold text-white">PO Charge Entry</h2>
            <div className="flex gap-4 mt-1">
              <span className="text-sm text-gray-300">PO: <span className="text-white font-medium">{poNumber}</span></span>
              <span className="text-sm text-gray-300">Supplier: <span className="text-white font-medium">{supplierName}</span></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 bg-gray-50">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Charge Type <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Amount Excl <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    VAT <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Amount Incl
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-12">

                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lines.map((line) => (
                  <tr key={line.id} className="bg-white">
                    <td className="px-4 py-3">
                      <select
                        value={line.clearingPaymentChargeId}
                        onChange={(e) => updateLine(line.id, 'clearingPaymentChargeId', Number(e.target.value) || '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent min-w-[200px]"
                      >
                        <option value="">Select charge type...</option>
                        {chargeTypes.map((ct) => (
                          <option key={ct.clearingPaymentChargeId} value={ct.clearingPaymentChargeId}>
                            {ct.chargeName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.amountExcl}
                        onChange={(e) => updateLine(line.id, 'amountExcl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.vat}
                        onChange={(e) => updateLine(line.id, 'vat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                      {fmt(line.amountIncl)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length === 1}
                        className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addLine}
            className="mt-4 flex items-center gap-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)] font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Charge
          </button>

          <div className="mt-6 flex justify-end">
            <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 text-right shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Amount Incl</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">{fmt(totalAmountIncl)}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end gap-3 flex-shrink-0">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[var(--color-primary)] hover:opacity-90 text-white"
          >
            Save Charges
          </Button>
        </div>
      </div>
    </div>
  );
};
