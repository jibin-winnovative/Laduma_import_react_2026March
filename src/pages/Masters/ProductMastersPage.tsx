import { useState } from 'react';
import { ProductMastersList } from './ProductMastersList';
import { ProductMasterForm } from './ProductMasterForm';
import { ViewProductMaster } from './ViewProductMaster';
import productMastersService, { ProductMaster } from '../../services/productMastersService';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

export const ProductMastersPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setSelectedProductId(undefined);
    setViewMode('add');
  };

  const handleEdit = (product: ProductMaster) => {
    setSelectedProductId(product.productId);
    setViewMode('edit');
  };

  const handleView = (product: ProductMaster) => {
    setSelectedProductId(product.productId);
    setViewMode('view');
  };

  const handleViewEdit = () => {
    setViewMode('edit');
  };

  const handleDelete = async (id: number) => {
    try {
      await productMastersService.delete(id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleSaveSuccess = () => {
    setViewMode('list');
    setSelectedProductId(undefined);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleClose = () => {
    setViewMode('list');
    setSelectedProductId(undefined);
  };

  return (
    <>
      <ProductMastersList
        key={refreshTrigger}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
      />

      {(viewMode === 'add' || viewMode === 'edit') && (
        <ProductMasterForm
          mode={viewMode}
          productId={selectedProductId}
          onClose={handleClose}
          onSuccess={handleSaveSuccess}
        />
      )}

      {viewMode === 'view' && selectedProductId && (
        <ViewProductMaster
          productId={selectedProductId}
          onClose={handleClose}
          onEdit={handleViewEdit}
        />
      )}
    </>
  );
};
