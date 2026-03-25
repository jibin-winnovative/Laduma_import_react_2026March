import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LocalPaymentList } from './LocalPaymentList';
import { LocalPaymentForm } from './LocalPaymentForm';
import { ViewLocalPayment } from './ViewLocalPayment';
import { localPaymentsService } from '../../services/localPaymentsService';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

export const LocalPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>(() => {
    const id = searchParams.get('viewId');
    return id ? 'view' : 'list';
  });
  const [selectedId, setSelectedId] = useState<number | undefined>(() => {
    const id = searchParams.get('viewId');
    return id ? parseInt(id, 10) : undefined;
  });

  useEffect(() => {
    const id = searchParams.get('viewId');
    if (id) {
      setSelectedId(parseInt(id, 10));
      setMode('view');
    }
  }, [searchParams]);

  const handleAdd = () => {
    setSelectedId(undefined);
    setMode('add');
  };

  const handleEdit = (id: number) => {
    setSelectedId(id);
    setMode('edit');
  };

  const handleView = (id: number) => {
    setSelectedId(id);
    setMode('view');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this local payment?')) return;

    try {
      await localPaymentsService.delete(id);
      alert('Local Payment deleted successfully!');
      setMode('list');
    } catch (err: any) {
      console.error('Failed to delete local payment:', err);
      alert(err.message || 'Failed to delete local payment');
    }
  };

  const handleClose = () => {
    setMode('list');
    setSelectedId(undefined);
    if (searchParams.get('viewId')) navigate('/local-payments', { replace: true });
  };

  const handleSuccess = () => {
    setMode('list');
    setSelectedId(undefined);
    if (searchParams.get('viewId')) navigate('/local-payments', { replace: true });
  };

  return (
    <div className="h-full">
      {mode === 'list' && (
        <LocalPaymentList
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
        />
      )}
      {mode === 'add' && (
        <LocalPaymentForm
          key="lp-add"
          mode="add"
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
      {mode === 'edit' && selectedId && (
        <LocalPaymentForm
          key={`lp-edit-${selectedId}`}
          mode="edit"
          localPaymentId={selectedId}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
      {mode === 'view' && selectedId && (
        <ViewLocalPayment
          localPaymentId={selectedId}
          onClose={handleClose}
          onEdit={() => handleEdit(selectedId)}
        />
      )}
    </div>
  );
};
