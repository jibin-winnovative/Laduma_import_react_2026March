import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>(() => (id ? 'view' : 'list'));
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | undefined>();

  useEffect(() => {
    if (id) {
      setViewMode('view');
    } else {
      setViewMode('list');
      setSelectedPO(undefined);
    }
  }, [id]);

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
    navigate(`/purchase/purchase-orders/${po.purchaseOrderId}`);
  };

  const handleClose = () => {
    navigate('/purchase/purchase-orders');
  };

  const handleSuccess = () => {
    navigate('/purchase/purchase-orders');
  };

  const purchaseOrderId = id ? parseInt(id, 10) : selectedPO?.purchaseOrderId;

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

      {viewMode === 'view' && purchaseOrderId && (
        <ViewPurchaseOrder
          purchaseOrderId={purchaseOrderId}
          onClose={handleClose}
        />
      )}
    </div>
  );
};
