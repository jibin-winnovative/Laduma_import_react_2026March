import { useState } from 'react';
import { AlertTriangle, XCircle, Ship, Truck, Package, FileCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { containersService, StatusChangeRequest } from '../../services/containersService';

interface StatusWorkflowProps {
  containerId: number;
  currentStatus: string;
  hasTelexReleased?: boolean;
  onStatusChanged: () => void;
}

export const ContainerStatusWorkflow = ({ containerId, currentStatus, hasTelexReleased, onStatusChanged }: StatusWorkflowProps) => {
  const [showModal, setShowModal] = useState(false);
  const [showTelexWarning, setShowTelexWarning] = useState(false);
  const [actionType, setActionType] = useState<'book' | 'mark-in-transit' | 'mark-received' | 'cancel' | 'telex-release' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    statusChangeDate: new Date().toISOString().split('T')[0],
    remark: '',
  });
  const [error, setError] = useState<string | null>(null);

  const openModal = (action: 'book' | 'mark-in-transit' | 'mark-received' | 'cancel' | 'telex-release') => {
    if (action === 'mark-received' && !hasTelexReleased) {
      setShowTelexWarning(true);
      return;
    }
    setActionType(action);
    setFormData({
      statusChangeDate: new Date().toISOString().split('T')[0],
      remark: '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleProceedAfterTelexWarning = () => {
    setShowTelexWarning(false);
    setActionType('mark-received');
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
        case 'telex-release':
          await containersService.telexRelease(containerId, request);
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
      case 'telex-release':
        return 'Telex Release';
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

        {(currentStatus === 'Booked' || currentStatus === 'In Transit') && !hasTelexReleased && (
          <Button
            onClick={() => openModal('telex-release')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <FileCheck className="w-4 h-4" />
            Telex Release
          </Button>
        )}
      </div>

      <Modal
        isOpen={showTelexWarning}
        onClose={() => setShowTelexWarning(false)}
        title="Telex Release Required"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Telex Not Released</p>
              <p className="text-sm text-amber-700 mt-1">
                The Telex Release has not been completed for this container. It is required before marking it as Received.
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Do you want to proceed anyway?
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowTelexWarning(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedAfterTelexWarning}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              Proceed Anyway
            </Button>
          </div>
        </div>
      </Modal>

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
              {actionType === 'telex-release' ? 'Release Date' : 'Status Change Date'} <span className="text-red-500">*</span>
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
