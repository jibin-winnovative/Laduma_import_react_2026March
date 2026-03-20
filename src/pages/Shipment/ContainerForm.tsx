import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { POSearchModal, ApprovedPO } from './POSearchModal';
import { POAllocationGrid, POAllocationSummary } from './POAllocationGrid';
import { POItemAllocationModal, AllocatedItemData } from './POItemAllocationModal';
import {
  containersService,
  CreateContainerRequest,
  UpdateContainerRequest,
  POItemForAllocation,
} from '../../services/containersService';
import { shippingCompaniesService } from '../../services/shippingCompaniesService';
import { oceanFreightCompaniesService } from '../../services/oceanFreightCompaniesService';

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Confirmed', label: 'Booked' },
  { value: 'InShipment', label: 'In Transit' },
  { value: 'Closed', label: 'Received' },
];

interface AllocatedPOData {
  purchaseOrderId: number;
  poNumber: string;
  poDate: string;
  supplierName: string;
  poAmount: number;
  availableItems: POItemForAllocation[];
  selectedItems: AllocatedItemData[];
}

export const ContainerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [shippingCompanies, setShippingCompanies] = useState<{ shippingCompanyId: number; companyName: string }[]>([]);
  const [oceanFreightCompanies, setOceanFreightCompanies] = useState<{ oceanFreightCompanyId: number; companyName: string }[]>([]);

  const [formData, setFormData] = useState({
    containerNumber: '',
    containerDate: new Date().toISOString().split('T')[0],
    shippingCompanyId: '',
    oceanFreightCompanyId: '',
    etd: '',
    eta: '',
    status: 'Draft',
  });

  const [allocatedPOs, setAllocatedPOs] = useState<AllocatedPOData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const [itemModalState, setItemModalState] = useState<{
    isOpen: boolean;
    poId: number | null;
    isViewMode: boolean;
  }>({
    isOpen: false,
    poId: null,
    isViewMode: false,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [shippingResult, oceanFreightResult] = await Promise.allSettled([
        shippingCompaniesService.getActive(),
        oceanFreightCompaniesService.getActive(),
      ]);

      if (shippingResult.status === 'fulfilled') {
        setShippingCompanies(shippingResult.value || []);
      }
      if (oceanFreightResult.status === 'fulfilled') {
        setOceanFreightCompanies(oceanFreightResult.value || []);
      }

      if (isEditMode && id) {
        await loadContainerDetails(parseInt(id));
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadContainerDetails = async (containerId: number) => {
    setLoading(true);
    try {
      const details = await containersService.getById(containerId);

      setFormData({
        containerNumber: details.containerNumber,
        containerDate: details.containerDate.split('T')[0],
        shippingCompanyId: details.shippingCompanyId ? details.shippingCompanyId.toString() : '',
        oceanFreightCompanyId: details.oceanFreightCompanyId ? details.oceanFreightCompanyId.toString() : '',
        etd: details.etd.split('T')[0],
        eta: details.eta.split('T')[0],
        status: details.status,
      });

      const allocated: AllocatedPOData[] = await Promise.all(
        details.pOs.map(async (po) => {
          let availableItems: POItemForAllocation[] = [];
          try {
            availableItems = await containersService.getPOItems(po.purchaseOrderId);
          } catch {
            availableItems = [];
          }

          const selectedItems: AllocatedItemData[] = po.items.map((item) => {
            const availableItem = availableItems.find(
              (ai) => ai.purchaseOrderItemId === item.purchaseOrderItemId
            );
            const baseRemainingQty = availableItem?.remainingQty ?? 0;
            return {
              purchaseOrderItemId: item.purchaseOrderItemId,
              productId: item.productId,
              itemCode: item.itemCode,
              itemName: item.itemName,
              orderedQty: availableItem?.orderedQty ?? item.loadedQty,
              loadedQty: availableItem?.loadedQty ?? 0,
              remainingQty: baseRemainingQty + item.loadedQty,
              loadQty: item.loadedQty,
              uom: availableItem?.uom ?? '',
              price: item.price,
              cbm: item.cbm,
              amount: item.amount,
              extraFreight: item.extraFreight,
              totalCBM: item.totalCBM,
            };
          });

          return {
            purchaseOrderId: po.purchaseOrderId,
            poNumber: po.poNumber,
            poDate: po.poDate ?? '',
            supplierName: po.supplierName ?? '',
            poAmount: po.totalAmount ?? 0,
            availableItems,
            selectedItems,
          };
        })
      );

      setAllocatedPOs(allocated);
    } catch (error) {
      console.error('Failed to load container details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPOs = async (selectedPOs: ApprovedPO[]) => {
    if (!selectedPOs || selectedPOs.length === 0) {
      return;
    }

    try {
      const newAllocated: AllocatedPOData[] = [];

      for (const po of selectedPOs) {
        try {
          const items = await containersService.getPOItems(po.purchaseOrderId);

          newAllocated.push({
            purchaseOrderId: po.purchaseOrderId,
            poNumber: po.poNumber,
            poDate: po.poDate,
            supplierName: po.supplierName,
            poAmount: po.poAmount,
            availableItems: items || [],
            selectedItems: [],
          });
        } catch (itemError) {
          console.error(`Failed to load items for PO ${po.poNumber}:`, itemError);
          newAllocated.push({
            purchaseOrderId: po.purchaseOrderId,
            poNumber: po.poNumber,
            poDate: po.poDate,
            supplierName: po.supplierName,
            poAmount: po.poAmount,
            availableItems: [],
            selectedItems: [],
          });
        }
      }

      if (newAllocated.length > 0) {
        setAllocatedPOs((prev) => [...prev, ...newAllocated]);
      }
    } catch (error) {
      console.error('Failed to load PO items:', error);
    }
  };

  const handleViewPO = (poId: number) => {
    setItemModalState({ isOpen: true, poId, isViewMode: true });
  };

  const handleEditPO = (poId: number) => {
    setItemModalState({ isOpen: true, poId, isViewMode: false });
  };

  const handleDeletePO = (poId: number) => {
    setAllocatedPOs((prev) => prev.filter((po) => po.purchaseOrderId !== poId));
  };

  const handleSaveItemAllocation = (items: AllocatedItemData[]) => {
    if (!itemModalState.poId) return;

    setAllocatedPOs((prev) =>
      prev.map((po) =>
        po.purchaseOrderId === itemModalState.poId
          ? { ...po, selectedItems: items }
          : po
      )
    );
  };

  const currentEditPO = useMemo(() => {
    if (!itemModalState.poId) return null;
    return allocatedPOs.find((po) => po.purchaseOrderId === itemModalState.poId) || null;
  }, [itemModalState.poId, allocatedPOs]);

  const poAllocationSummary: POAllocationSummary[] = useMemo(() => {
    return allocatedPOs.map((po) => {
      const ciAmount = po.selectedItems.reduce(
        (sum, item) => sum + item.loadQty * item.price,
        0
      );
      const totalCBM = po.selectedItems.reduce(
        (sum, item) => sum + item.loadQty * item.cbm,
        0
      );
      const extraFreight = po.selectedItems.reduce(
        (sum, item) => sum + (item.extraFreight || 0),
        0
      );

      return {
        purchaseOrderId: po.purchaseOrderId,
        poNumber: po.poNumber,
        poDate: po.poDate,
        supplierName: po.supplierName,
        poAmount: po.poAmount,
        ciAmount,
        totalCBM,
        extraFreight,
      };
    });
  }, [allocatedPOs]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.containerNumber.trim()) {
      newErrors.push('Container Number is required');
    }
    if (!formData.containerDate) {
      newErrors.push('Container Date is required');
    }
    if (!formData.shippingCompanyId) {
      newErrors.push('Shipping Company is required');
    }
    if (!formData.oceanFreightCompanyId) {
      newErrors.push('Ocean Freight Company is required');
    }
    if (!formData.etd) {
      newErrors.push('ETD is required');
    }
    if (!formData.eta) {
      newErrors.push('ETA is required');
    }

    if (allocatedPOs.length === 0) {
      newErrors.push('At least one PO must be added');
    }

    let hasItems = false;
    allocatedPOs.forEach((po) => {
      po.selectedItems.forEach((item) => {
        if (item.loadQty > 0) {
          hasItems = true;
        }
        if (item.loadQty < 0) {
          newErrors.push(`${item.itemCode}: Load quantity cannot be negative`);
        }
        if (item.loadQty > item.remainingQty) {
          newErrors.push(`${item.itemCode}: Load quantity exceeds remaining quantity`);
        }
      });
    });

    if (!hasItems) {
      newErrors.push('At least one item must have a load quantity greater than 0');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateContainerRequest | UpdateContainerRequest = {
        ...(isEditMode && { containerId: parseInt(id!) }),
        containerNumber: formData.containerNumber,
        containerDate: new Date(formData.containerDate).toISOString(),
        shippingCompanyId: parseInt(formData.shippingCompanyId),
        oceanFreightCompanyId: parseInt(formData.oceanFreightCompanyId),
        etd: new Date(formData.etd).toISOString(),
        eta: new Date(formData.eta).toISOString(),
        status: formData.status,
        pOs: allocatedPOs
          .map((po) => ({
            purchaseOrderId: po.purchaseOrderId,
            items: po.selectedItems
              .filter((item) => item.loadQty > 0)
              .map((item) => ({
                purchaseOrderItemId: item.purchaseOrderItemId,
                productId: item.productId,
                loadedQty: item.loadQty,
                price: item.price,
                cbm: item.cbm,
                extraFreight: item.extraFreight,
              })),
          }))
          .filter((po) => po.items.length > 0),
      };

      if (isEditMode) {
        await containersService.update(parseInt(id!), payload as UpdateContainerRequest);
      } else {
        await containersService.create(payload);
      }

      navigate('/containers');
    } catch (error) {
      console.error('Failed to save container:', error);
      setErrors(['Failed to save container. Please try again.']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/containers')} variant="secondary" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {isEditMode ? 'Edit Container' : 'Create Container'}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {isEditMode ? 'Update container details and PO allocations' : 'Create a new shipment container'}
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                {error}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Container Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Container Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.containerNumber}
                onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="CONT-0001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Container Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.containerDate}
                onChange={(e) => setFormData({ ...formData, containerDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Shipping Company <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.shippingCompanyId}
                onChange={(e) => setFormData({ ...formData, shippingCompanyId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Shipping Company</option>
                {shippingCompanies.map((c) => (
                  <option key={c.shippingCompanyId} value={c.shippingCompanyId.toString()}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Ocean Freight Company <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.oceanFreightCompanyId}
                onChange={(e) => setFormData({ ...formData, oceanFreightCompanyId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Ocean Freight Company</option>
                {oceanFreightCompanies.map((c) => (
                  <option key={c.oceanFreightCompanyId} value={c.oceanFreightCompanyId.toString()}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                ETD <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.etd}
                onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                ETA <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.eta}
                onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </Card>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">PO Allocation</h2>
            <Button
              type="button"
              onClick={() => setShowPOModal(true)}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <Plus className="w-4 h-4" />
              Add PO
            </Button>
          </div>

          <POAllocationGrid
            allocatedPOs={poAllocationSummary}
            onView={handleViewPO}
            onEdit={handleEditPO}
            onDelete={handleDeletePO}
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" onClick={() => navigate('/containers')} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : isEditMode ? 'Update Container' : 'Create Container'}
          </Button>
        </div>
      </form>

      <POSearchModal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
        onAddPOs={handleAddPOs}
        alreadySelectedPOIds={allocatedPOs.map((po) => po.purchaseOrderId)}
      />

      {currentEditPO && (
        <POItemAllocationModal
          isOpen={itemModalState.isOpen}
          onClose={() => setItemModalState({ isOpen: false, poId: null, isViewMode: false })}
          onSave={handleSaveItemAllocation}
          poNumber={currentEditPO.poNumber}
          supplierName={currentEditPO.supplierName}
          availableItems={currentEditPO.availableItems}
          selectedItems={currentEditPO.selectedItems}
          isViewMode={itemModalState.isViewMode}
        />
      )}
    </div>
  );
};
