import { useState } from 'react';
import { PurchaseOrderList } from './PurchaseOrderList';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { ViewPurchaseOrder } from './ViewPurchaseOrder';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

interface PurchaseOrder {
  purchaseOrderId: number;
  companyId: number;
  poNumber: string;
  supplierName: string | null;
  currencyCode: string | null;
  shipmentTypeName: string | null;
  poDate: string;
  poStatus: string;
  totalAmount: number;
}

export const PurchaseOrderPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | undefined>();

  const handleAdd = () => {
    setSelectedPO(undefined);
    setViewMode('add');
  };

  const handleEdit = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setViewMode('edit');
  };

  const handleView = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setViewMode('view');
  };

  const handleClose = () => {
    setViewMode('list');
    setSelectedPO(undefined);
  };

  const handleSuccess = () => {
    setViewMode('list');
    setSelectedPO(undefined);
  };

  return (
    <div className="p-6">
      {viewMode === 'list' && (
        <PurchaseOrderList
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
        />
      )}

      {viewMode === 'add' && (
        <PurchaseOrderForm
          key="po-add"
          mode="add"
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {viewMode === 'edit' && selectedPO && (
        <PurchaseOrderForm
          key={`po-edit-${selectedPO.purchaseOrderId}`}
          mode="edit"
          purchaseOrderId={selectedPO.purchaseOrderId}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {viewMode === 'view' && selectedPO && (
        <ViewPurchaseOrder
          purchaseOrderId={selectedPO.purchaseOrderId}
          onClose={handleClose}
        />
      )}
    </div>
  );
};
