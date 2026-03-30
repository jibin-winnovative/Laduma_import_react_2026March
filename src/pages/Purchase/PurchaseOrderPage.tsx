import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { PurchaseOrderList } from './PurchaseOrderList';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { ViewPurchaseOrder } from './ViewPurchaseOrder';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';
import { Button } from '../../components/ui/Button';

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
  const [printDialogPoId, setPrintDialogPoId] = useState<number | null>(null);
  const [printing, setPrinting] = useState(false);

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
    setSelectedPO(undefined);
    setViewMode('list');
    navigate('/purchase/purchase-orders');
  };

  const handleSuccess = (savedPurchaseOrderId?: number) => {
    setSelectedPO(undefined);
    setViewMode('list');
    navigate('/purchase/purchase-orders');
    if (savedPurchaseOrderId) {
      setPrintDialogPoId(savedPurchaseOrderId);
    }
  };

  const handlePrint = async () => {
    if (!printDialogPoId) return;
    setPrinting(true);
    try {
      await purchaseOrdersService.printPdf(printDialogPoId);
    } catch {
      alert('PDF generation failed. You can print it from the view screen.');
    } finally {
      setPrinting(false);
      setPrintDialogPoId(null);
    }
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

      {printDialogPoId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Printer className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Print Purchase Order
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Purchase Order saved successfully. Do you want to print the PO now?
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPrintDialogPoId(null)}
              >
                No, Skip
              </Button>
              <Button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" />
                {printing ? 'Opening PDF...' : 'Yes, Print'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
