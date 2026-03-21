import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Ship, Calendar, Truck, ExternalLink, FileCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { containersService, ContainerDetails } from '../../services/containersService';
import { ViewPurchaseOrder } from '../Purchase/ViewPurchaseOrder';
import { ContainerStatusWorkflow } from './ContainerStatusWorkflow';
import { ContainerEventLogTimeline } from './ContainerEventLog';

interface ViewContainerDetailsProps {
  containerId?: number;
  onClose?: () => void;
}

export const ViewContainerDetails = ({ containerId: containerIdProp, onClose }: ViewContainerDetailsProps = {}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const containerId = containerIdProp || (id ? parseInt(id) : null);
  const [details, setDetails] = useState<ContainerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);

  useEffect(() => {
    if (containerId) {
      loadDetails(containerId);
    }
  }, [containerId]);

  const loadDetails = async (containerId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await containersService.getById(containerId);
      setDetails(data);
    } catch (err: any) {
      console.error('Failed to load container details:', err);
      setError(err.message || 'Failed to load container details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCBM = (cbm: number) => {
    return cbm.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const handleStatusChanged = () => {
    if (containerId) {
      loadDetails(containerId);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/containers');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bgColor: string; textColor: string }> = {
      'draft': { bgColor: '#F3F4F6', textColor: '#374151' },
      'booked': { bgColor: '#DBEAFE', textColor: '#1D4ED8' },
      'in transit': { bgColor: '#FED7AA', textColor: '#C2410C' },
      'received': { bgColor: '#D1FAE5', textColor: '#047857' },
      'canceled': { bgColor: '#FEE2E2', textColor: '#DC2626' },
    };

    const normalizedStatus = status?.toLowerCase().trim() || '';
    const config = statusMap[normalizedStatus] || { bgColor: '#F3F4F6', textColor: '#374151' };

    return (
      <span
        className="px-3 py-1.5 text-sm font-semibold rounded-lg"
        style={{ backgroundColor: config.bgColor, color: config.textColor }}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-[var(--color-text-secondary)]">Loading container details...</div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="secondary" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Container Details</h1>
        </div>
        <Card className="p-8 text-center">
          <p className="text-red-600">{error || 'Container not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="secondary" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{details.containerNumber}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Container Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!onClose && (
            <>
              <ContainerStatusWorkflow
                containerId={details.containerId}
                currentStatus={details.status}
                hasTelexReleased={details.hasTelexReleased}
                onStatusChanged={handleStatusChanged}
              />
              {(details.status === 'Draft' || details.status === 'Booked') && (
                <Button onClick={() => navigate(`/containers/edit/${details.containerId}`)}>
                  Edit Container
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">{details.containerNumber}</h2>
              <p className="text-sm text-white/90">
                {new Date(details.containerDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(details.status)}
            {details.hasTelexReleased && (
              <span className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-purple-100 text-purple-700 flex items-center gap-1">
                <FileCheck className="w-4 h-4" />
                Telex Released
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Ship className="w-6 h-6 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Shipping Company</p>
              <p className="text-base font-semibold text-white">{details.shippingCompanyName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Truck className="w-6 h-6 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Ocean Freight Company</p>
              <p className="text-base font-semibold text-white">{details.oceanFreightCompanyName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-6 h-6 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">ETD</p>
              <p className="text-base font-semibold text-white">
                {new Date(details.etd).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-6 h-6 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">ETA</p>
              <p className="text-base font-semibold text-white">
                {new Date(details.eta).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-sm text-white/80">Total POs</p>
          <p className="text-3xl font-bold mt-2">{details.pOs?.length || 0}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-sm text-white/80">Total Amount</p>
          <p className="text-3xl font-bold mt-2">${formatCurrency(details.totalAmount)}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <p className="text-sm text-white/80">Total CBM</p>
          <p className="text-3xl font-bold mt-2">{formatCBM(details.totalCBM)}</p>
        </Card>
      </div>

      <ContainerEventLogTimeline containerId={details.containerId} />

      {details.pOs.map((po) => {
        const poTotalAmount = po.items.reduce((sum, item) => sum + item.amount, 0);
        const poTotalCBM = po.items.reduce((sum, item) => sum + item.totalCBM, 0);
        const poTotalExtraFreight = po.items.reduce((sum, item) => sum + item.extraFreight, 0);

        return (
          <Card key={po.purchaseOrderId} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-primary)] flex items-center gap-2">
                <Package className="w-5 h-5" />
                {po.poNumber} - {po.supplierName}
              </h3>
              <Button
                onClick={() => setSelectedPOId(po.purchaseOrderId)}
                variant="secondary"
                className="flex items-center gap-2 text-sm"
              >
                View More
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loaded Qty
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UOM
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CBM
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Extra Freight
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total CBM
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {po.items.map((item) => (
                    <tr key={item.purchaseOrderItemId} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {item.itemCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {item.itemName}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {item.loadedQty.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-center">
                        {item.uom}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        ${formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {formatCBM(item.cbm)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                        ${formatCurrency(item.amount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        ${formatCurrency(item.extraFreight)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCBM(item.totalCBM)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      PO Totals:
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      ${formatCurrency(poTotalAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      ${formatCurrency(poTotalExtraFreight)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatCBM(poTotalCBM)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        );
      })}

      {selectedPOId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedPOId(null)} />
          <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
            <ViewPurchaseOrder
              purchaseOrderId={selectedPOId}
              onClose={() => setSelectedPOId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
