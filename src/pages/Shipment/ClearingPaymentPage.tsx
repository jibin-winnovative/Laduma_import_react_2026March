import { useState } from 'react';
import { ClearingPaymentList } from './ClearingPaymentList';
import { ClearingPaymentForm } from './ClearingPaymentForm';
import { ViewClearingPayment } from './ViewClearingPayment';
import { clearingPaymentsService } from '../../services/clearingPaymentsService';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

export const ClearingPaymentPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await clearingPaymentsService.delete(deleteConfirmId);
      setDeleteConfirmId(null);
      setViewMode('list');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete clearing payment.');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setViewMode('list');
    setSelectedId(undefined);
  };

  const handleSuccess = () => {
    setViewMode('list');
    setSelectedId(undefined);
  };

  return (
    <div className="p-6">
      {viewMode === 'list' && (
        <ClearingPaymentList
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
        />
      )}

      {viewMode === 'add' && (
        <ClearingPaymentForm
          mode="add"
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {viewMode === 'edit' && selectedId !== undefined && (
        <ClearingPaymentForm
          mode="edit"
          clearingPaymentId={selectedId}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {viewMode === 'view' && selectedId !== undefined && (
        <ViewClearingPayment
          clearingPaymentId={selectedId}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Clearing Payment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this clearing payment? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
