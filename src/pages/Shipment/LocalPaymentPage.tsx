import { useState } from 'react';
import { LocalPaymentList } from './LocalPaymentList';
import { LocalPaymentForm } from './LocalPaymentForm';
import { ViewLocalPayment } from './ViewLocalPayment';
import { localPaymentsService } from '../../services/localPaymentsService';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

export const LocalPaymentPage = () => {
  const [mode, setMode] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<number | undefined>();

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
  };

  const handleSuccess = () => {
    setMode('list');
    setSelectedId(undefined);
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
          mode="add"
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
      {mode === 'edit' && selectedId && (
        <LocalPaymentForm
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
