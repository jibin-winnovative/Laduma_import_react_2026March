import { useState } from 'react';
import { CheckCircle, ClipboardCheck, Truck, Warehouse, PackageCheck, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  purchaseOrdersService,
  OPERATIONAL_STATUS_SEQUENCE,
  getNextOperationalStatus,
} from '../../services/purchaseOrdersService';

interface POOperationalStatusWorkflowProps {
  purchaseOrderId: number;
  poStatus: string;
  operationalStatus?: string | null;
  onStatusChanged: () => void;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  'Goods Ready From Supplier': {
    icon: CheckCircle,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  'Customs Clearance': {
    icon: ClipboardCheck,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  'Goods Collected By Transporter': {
    icon: Truck,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  'Goods Receipt In Warehouse': {
    icon: Warehouse,
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  'GRV Completed': {
    icon: PackageCheck,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
};

const NEXT_BUTTON_COLORS: Record<string, string> = {
  'Goods Ready From Supplier': 'bg-emerald-600 hover:bg-emerald-700',
  'Customs Clearance': 'bg-blue-600 hover:bg-blue-700',
  'Goods Collected By Transporter': 'bg-orange-600 hover:bg-orange-700',
  'Goods Receipt In Warehouse': 'bg-teal-600 hover:bg-teal-700',
  'GRV Completed': 'bg-green-600 hover:bg-green-700',
};

export const POOperationalStatusWorkflow = ({
  purchaseOrderId,
  poStatus,
  operationalStatus,
  onStatusChanged,
}: POOperationalStatusWorkflowProps) => {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    statusChangeDate: new Date().toISOString().split('T')[0],
    remark: '',
  });

  if (poStatus !== 'Approved') return null;

  const nextStatus = getNextOperationalStatus(operationalStatus);
  if (!nextStatus) return null;

  const openModal = () => {
    setFormData({ statusChangeDate: new Date().toISOString().split('T')[0], remark: '' });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.statusChangeDate) return;

    setSubmitting(true);
    setError(null);

    try {
      await purchaseOrdersService.changeOperationalStatus(purchaseOrderId, {
        status: nextStatus,
        statusChangeDate: new Date(formData.statusChangeDate).toISOString(),
        remark: formData.remark || null,
      });
      setShowModal(false);
      onStatusChanged();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Failed to update operational status. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const config = STATUS_CONFIG[nextStatus] || {
    icon: CheckCircle,
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  };
  const NextIcon = config.icon;
  const btnColor = NEXT_BUTTON_COLORS[nextStatus] || 'bg-gray-600 hover:bg-gray-700';

  const currentIndex = operationalStatus
    ? OPERATIONAL_STATUS_SEQUENCE.indexOf(operationalStatus as any)
    : -1;

  return (
    <>
      <div className="space-y-4">
        {/* Progress stepper */}
        <div className="flex items-center gap-1 flex-wrap">
          {OPERATIONAL_STATUS_SEQUENCE.map((status, idx) => {
            const done = idx <= currentIndex;
            const isNext = status === nextStatus;
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <div key={status} className="flex items-center gap-1">
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all ${
                    done
                      ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                      : isNext
                      ? 'bg-gray-100 text-gray-500 border-gray-200 border-dashed'
                      : 'bg-gray-50 text-gray-400 border-gray-100'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{status}</span>
                </div>
                {idx < OPERATIONAL_STATUS_SEQUENCE.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Action button */}
        <Button
          onClick={openModal}
          className={`flex items-center gap-2 text-white ${btnColor}`}
        >
          <NextIcon className="w-4 h-4" />
          {nextStatus}
        </Button>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Update Operational Status">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}>
            <NextIcon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
            <div>
              <p className="text-sm font-semibold text-gray-800">Moving to:</p>
              <p className={`text-sm font-bold ${config.color}`}>{nextStatus}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Status Change Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.statusChangeDate}
              onChange={(e) => setFormData({ ...formData, statusChangeDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Remark <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Optional remark about this status change..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className={`text-white ${btnColor}`}>
              {submitting ? 'Updating...' : 'Confirm'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
