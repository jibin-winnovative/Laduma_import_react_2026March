import { useState } from 'react';
import { OceanFreightPaymentList } from './OceanFreightPaymentList';
import { OceanFreightPaymentForm } from './OceanFreightPaymentForm';
import { ViewOceanFreightPayment } from './ViewOceanFreightPayment';
import { Modal } from '../../components/ui/Modal';
import { oceanFreightPaymentsService } from '../../services/oceanFreightPaymentsService';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

export const OceanFreightPaymentPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setSelectedId(undefined);
    setViewMode('add');
  };

  const handleEdit = (id: number) => {
    setSelectedId(id);
    setViewMode('edit');
  };

  const handleView = (id: number) => {
    setSelectedId(id);
    setViewMode('view');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ocean freight payment?')) return;
    try {
      await oceanFreightPaymentsService.delete(id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to delete ocean freight payment:', err);
      alert('Failed to delete ocean freight payment');
    }
  };

  const handleClose = () => {
    setViewMode('list');
    setSelectedId(undefined);
  };

  const handleSuccess = () => {
    setViewMode('list');
    setSelectedId(undefined);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="p-6">
      {viewMode === 'list' && (
        <OceanFreightPaymentList
          key={refreshTrigger}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
        />
      )}

      {viewMode === 'add' && (
        <OceanFreightPaymentForm
          key="ofp-add"
          mode="add"
          oceanFreightPaymentId={selectedId}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {viewMode === 'edit' && selectedId !== undefined && (
        <OceanFreightPaymentForm
          key={`ofp-edit-${selectedId}`}
          mode="edit"
          oceanFreightPaymentId={selectedId}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {viewMode === 'view' && selectedId && (
        <ViewOceanFreightPayment
          oceanFreightPaymentId={selectedId}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
