import { useEffect, useState } from 'react';
import { X, FileText, Calendar, User, Package, DollarSign, Ship, MapPin, File as FileEdit, CheckCircle, Send, Truck, PackageCheck, PackageOpen, CheckCheck, XCircle, Download, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';
import { attachmentService } from '../../services/attachmentService';

interface ViewPurchaseOrderProps {
  purchaseOrderId: number;
  onClose: () => void;
}

interface PurchaseOrderItem {
  purchaseOrderItemId: number;
  productId: number;
  itemCode: string;
  itemName: string;
  barcode: string | null;
  uom: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  unitPriceForeign: number;
  unitPriceLocal: number;
  lineTotalForeign: number;
  lineTotalLocal: number;
  cbm: number | null;
  totalCBM: number | null;
  grossWeight: number | null;
  isClosed: boolean;
}

interface PurchaseOrderCharge {
  purchaseOrderChargeId: number;
  addonChargeId: number;
  chargeName: string;
  amountForeign: number;
  amountLocal: number;
  isLandedCost: boolean;
}

interface PurchaseOrderPayment {
  purchaseOrderPaymentId: number;
  description: string;
  percentage: number;
  expectedAmount: number;
  paidAmount: number;
  expectedDate: string;
  paidDate: string | null;
  isPaid: boolean;
}

interface PurchaseOrderAttachment {
  attachmentId: number;
  fileName: string;
  fileUrl: string;
  uploadedAt?: string;
}

interface PurchaseOrderDetails {
  purchaseOrderId: number;
  companyId: number;
  companyName?: string;
  poNumber: string;
  poDate: string;
  supplierId: number;
  supplierName: string;
  currencyId: number;
  currencyCode: string | null;
  exchangeRate: number;
  incoterm: string | null;
  priceTerms: string | null;
  remarks: string | null;
  exportPortId: number | null;
  exportPortName: string | null;
  importPortId: number | null;
  importPortName: string | null;
  shipmentTypeId: number;
  shipmentTypeName: string | null;
  modeOfPayment: string | null;
  modeOfShipment: string | null;
  expectedShipmentYear: number | null;
  expectedShipmentMonth: number | null;
  expectedShipmentPeriod: string | null;
  subTotalForeign: number;
  chargesForeign: number;
  grandTotalForeign: number;
  grandTotalLocal: number;
  totalAmount: number;
  poStatus: string;
  paymentStatus: string;
  isApproved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  items: PurchaseOrderItem[];
  charges: PurchaseOrderCharge[];
  payments: PurchaseOrderPayment[];
  attachments: PurchaseOrderAttachment[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export const ViewPurchaseOrder = ({ purchaseOrderId, onClose }: ViewPurchaseOrderProps) => {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchaseOrder();
  }, [purchaseOrderId]);

  const fetchPurchaseOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await purchaseOrdersService.getById(purchaseOrderId);
      setPurchaseOrder(data);
    } catch (err: any) {
      console.error('Failed to fetch purchase order:', err);
      setError(err.message || 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Draft':
        return {
          icon: FileEdit,
          color: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        };
      case 'Approved':
        return {
          icon: CheckCircle,
          color: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        };
      case 'Submitted':
        return {
          icon: Send,
          color: 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800',
        };
      case 'Shipped':
        return {
          icon: Truck,
          color: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
        };
      case 'PartiallyReceived':
        return {
          icon: PackageOpen,
          color: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
        };
      case 'Received':
        return {
          icon: PackageCheck,
          color: 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800',
        };
      case 'Completed':
        return {
          icon: CheckCheck,
          color: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        };
      case 'Rejected':
        return {
          icon: XCircle,
          color: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        };
      default:
        return {
          icon: FileText,
          color: 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        };
    }
  };

  const formatCurrency = (amount: number, currencyCode?: string | null) => {
    const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currencyCode ? `${currencyCode} ${formatted}` : formatted;
  };

  const handleDownload = async (attachmentId: number, fileName: string) => {
    try {
      const downloadUrl = await attachmentService.getDownloadUrl(attachmentId);
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const handleView = async (attachmentId: number) => {
    try {
      const downloadUrl = await attachmentService.getDownloadUrl(attachmentId);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to view file:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-[var(--color-text)]">Loading purchase order...</div>
      </div>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg text-red-600 mb-4">{error || 'Purchase order not found'}</div>
        <Button onClick={onClose} variant="secondary">
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Purchase Order Details
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            View complete purchase order information
          </p>
        </div>
        <Button onClick={onClose} variant="secondary" className="flex items-center gap-2">
          <X className="w-4 h-4" />
          Close
        </Button>
      </div>

      <Card className="p-6 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">
                {purchaseOrder.poNumber}
              </h2>
            </div>
            <p className="text-sm text-white/90">
              Company: {purchaseOrder.companyName || `ID: ${purchaseOrder.companyId}`}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            {(() => {
              const statusConfig = getStatusConfig(purchaseOrder.poStatus);
              const StatusIcon = statusConfig.icon;
              return (
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg flex items-center gap-2 ${statusConfig.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {purchaseOrder.poStatus}
                </span>
              );
            })()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">PO Date</p>
              <p className="text-base font-semibold text-white">
                {new Date(purchaseOrder.poDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Currency</p>
              <p className="text-base font-semibold text-white">
                {purchaseOrder.currencyCode || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Supplier</p>
              <p className="text-base font-semibold text-white">
                {purchaseOrder.supplierName || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Export Port</p>
              <p className="text-base font-semibold text-white">
                {purchaseOrder.exportPortName || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Import Port</p>
              <p className="text-base font-semibold text-white">
                {purchaseOrder.importPortName || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Price Terms</p>
              <p className="text-base font-semibold text-white">
                {purchaseOrder.priceTerms || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Ship className="w-5 h-5 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Shipment Type</p>
              <p className="text-base font-semibold text-white">
                {purchaseOrder.shipmentTypeName || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Mode of Payment</p>
              <p className="text-base font-semibold text-white">
                {purchaseOrder.modeOfPayment || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Mode of Shipment</p>
              <p className="text-base font-semibold text-white">
                {purchaseOrder.modeOfShipment || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-white/80 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/70">Expected Delivery</p>
              <p className="text-base font-semibold text-white">
                {purchaseOrder.expectedShipmentMonth && purchaseOrder.expectedShipmentYear
                  ? `${new Date(purchaseOrder.expectedShipmentYear, purchaseOrder.expectedShipmentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {purchaseOrder.remarks && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-sm font-medium text-white/70 mb-2">Remarks</p>
            <p className="text-base text-white">{purchaseOrder.remarks}</p>
          </div>
        )}

        {purchaseOrder.incoterm && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-sm font-medium text-white/70 mb-2">Incoterm</p>
            <p className="text-base text-white">{purchaseOrder.incoterm}</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Order Items
        </h3>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UOM
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CBM
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total CBM
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight (kg)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrder.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-4 text-center text-sm text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                purchaseOrder.items.map((item) => (
                  <tr key={item.purchaseOrderItemId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {item.itemCode}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.itemName}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {item.barcode || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center">
                      {item.uom}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      {item.orderedQty}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      {formatCurrency(item.unitPriceForeign, purchaseOrder.currencyCode)}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(item.lineTotalForeign, purchaseOrder.currencyCode)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      {item.cbm ? item.cbm.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      {item.totalCBM ? item.totalCBM.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      {item.grossWeight ? item.grossWeight.toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {purchaseOrder.items.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    Subtotal:
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(purchaseOrder.subTotalForeign, purchaseOrder.currencyCode)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {purchaseOrder.charges.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">Additional Charges</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Charge Name
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrder.charges.map((charge) => (
                  <tr key={charge.purchaseOrderChargeId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">{charge.chargeName}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(charge.amountForeign, purchaseOrder.currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    Total Charges:
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(purchaseOrder.chargesForeign, purchaseOrder.currencyCode)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">Order Summary</h3>
        <div className="space-y-3 max-w-md ml-auto">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-base text-[var(--color-text-secondary)]">Subtotal:</span>
            <span className="text-base font-semibold text-[var(--color-text)]">
              {formatCurrency(purchaseOrder.subTotalForeign, purchaseOrder.currencyCode)}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-base text-[var(--color-text-secondary)]">Additional Charges:</span>
            <span className="text-base font-semibold text-[var(--color-text)]">
              {formatCurrency(purchaseOrder.chargesForeign, purchaseOrder.currencyCode)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-4 px-4 py-4 rounded-lg" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 59, 130, 246), 0.1)' }}>
            <span className="text-xl font-bold text-[var(--color-text)]">Grand Total:</span>
            <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(purchaseOrder.grandTotalForeign, purchaseOrder.currencyCode)}
            </span>
          </div>
        </div>
      </Card>

      {purchaseOrder.payments.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">Payment Terms</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrder.payments.map((payment) => (
                  <tr key={payment.purchaseOrderPaymentId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">{payment.description}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center">
                      {payment.percentage.toFixed(2)}%
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(payment.expectedAmount, purchaseOrder.currencyCode)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      {formatCurrency(payment.paidAmount, purchaseOrder.currencyCode)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center">
                      {new Date(payment.expectedDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center">
                      {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.isPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {payment.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">Total:</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-center">
                    {purchaseOrder.payments.reduce((sum, p) => sum + p.percentage, 0).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(
                      purchaseOrder.payments.reduce((sum, p) => sum + p.expectedAmount, 0),
                      purchaseOrder.currencyCode
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(
                      purchaseOrder.payments.reduce((sum, p) => sum + p.paidAmount, 0),
                      purchaseOrder.currencyCode
                    )}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {purchaseOrder.attachments.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Attachments</h3>
          <div className="grid grid-cols-1 gap-3">
            {purchaseOrder.attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                  <span className="text-sm text-[var(--color-text)] truncate">
                    {attachment.fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => handleDownload(attachment.attachmentId, attachment.fileName)}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-2 text-sm"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    onClick={() => handleView(attachment.attachmentId)}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-2 text-sm"
                    title="View in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(purchaseOrder.createdAt || purchaseOrder.approvedBy) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchaseOrder.createdBy && (
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Created By</p>
                <p className="text-base text-[var(--color-text)]">{purchaseOrder.createdBy}</p>
              </div>
            )}
            {purchaseOrder.createdAt && purchaseOrder.createdAt !== '0001-01-01T00:00:00' && (
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Created At</p>
                <p className="text-base text-[var(--color-text)]">
                  {new Date(purchaseOrder.createdAt).toLocaleString()}
                </p>
              </div>
            )}
            {purchaseOrder.approvedBy && (
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Approved By</p>
                <p className="text-base text-[var(--color-text)]">{purchaseOrder.approvedBy}</p>
              </div>
            )}
            {purchaseOrder.approvedAt && (
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Approved At</p>
                <p className="text-base text-[var(--color-text)]">
                  {new Date(purchaseOrder.approvedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
