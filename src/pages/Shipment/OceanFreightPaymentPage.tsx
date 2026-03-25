import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { OceanFreightPaymentList } from './OceanFreightPaymentList';
import { OceanFreightPaymentForm } from './OceanFreightPaymentForm';
import { ViewOceanFreightPayment } from './ViewOceanFreightPayment';
import { Modal } from '../../components/ui/Modal';
import { oceanFreightPaymentsService } from '../../services/oceanFreightPaymentsService';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

export const OceanFreightPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const id = searchParams.get('viewId');
    return id ? 'view' : 'list';
  });
  const [selectedId, setSelectedId] = useState<number | undefined>(() => {
    const id = searchParams.get('viewId');
    return id ? parseInt(id, 10) : undefined;
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const id = searchParams.get('viewId');
    if (id) {
      setSelectedId(parseInt(id, 10));
      setViewMode('view');
    }
  }, [searchParams]);

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
    if (searchParams.get('viewId')) navigate('/ocean-freight-payments', { replace: true });
  };

  const handleSuccess = () => {
    setViewMode('list');
    setSelectedId(undefined);
    setRefreshTrigger((prev) => prev + 1);
    if (searchParams.get('viewId')) navigate('/ocean-freight-payments', { replace: true });
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
