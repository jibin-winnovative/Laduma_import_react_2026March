import { useState } from 'react';
import { CheckCircle, Clock, XCircle, Ship, Truck, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { containersService, StatusChangeRequest } from '../../services/containersService';

interface StatusWorkflowProps {
  containerId: number;
  currentStatus: string;
  onStatusChanged: () => void;
}

export const ContainerStatusWorkflow = ({ containerId, currentStatus, onStatusChanged }: StatusWorkflowProps) => {
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'book' | 'mark-in-transit' | 'mark-received' | 'cancel' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    statusChangeDate: new Date().toISOString().split('T')[0],
    remark: '',
  });
  const [error, setError] = useState<string | null>(null);

  const openModal = (action: 'book' | 'mark-in-transit' | 'mark-received' | 'cancel') => {
    setActionType(action);
    setFormData({
      statusChangeDate: new Date().toISOString().split('T')[0],
      remark: '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionType) return;

    setSubmitting(true);
    setError(null);

    try {
      const request: StatusChangeRequest = {
        statusChangeDate: new Date(formData.statusChangeDate).toISOString(),
        remark: formData.remark || undefined,
      };

      switch (actionType) {
        case 'book':
          await containersService.book(containerId, request);
          break;
        case 'mark-in-transit':
          await containersService.markInTransit(containerId, request);
          break;
        case 'mark-received':
          await containersService.markReceived(containerId, request);
          break;
        case 'cancel':
          await containersService.cancel(containerId, request);
          break;
      }

      setShowModal(false);
      onStatusChanged();
    } catch (err: any) {
      console.error('Failed to change status:', err);
      setError(err.response?.data?.message || 'Failed to change status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getActionLabel = () => {
    switch (actionType) {
      case 'book':
        return 'Book Container';
      case 'mark-in-transit':
        return 'Mark In Transit';
      case 'mark-received':
        return 'Mark Received';
      case 'cancel':
        return 'Cancel Container';
      default:
        return '';
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {currentStatus === 'Draft' && (
          <>
            <Button
              onClick={() => openModal('book')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Ship className="w-4 h-4" />
              Book
            </Button>
            <Button
              onClick={() => openModal('cancel')}
              variant="secondary"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </Button>
          </>
        )}

        {currentStatus === 'Booked' && (
          <>
            <Button
              onClick={() => openModal('mark-in-transit')}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <Truck className="w-4 h-4" />
              Mark In Transit
            </Button>
            <Button
              onClick={() => openModal('cancel')}
              variant="secondary"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </Button>
          </>
        )}

        {currentStatus === 'In Transit' && (
          <Button
            onClick={() => openModal('mark-received')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Package className="w-4 h-4" />
            Mark Received
          </Button>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={getActionLabel()}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Remark
            </label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Optional remark about this status change..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
