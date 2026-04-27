import { useState, useEffect, useMemo } from 'react';
import {
  Pencil, Eye, Search, FileText, Clock, Ship, DollarSign, Plus,
  FileEdit, CheckCircle, Send, Truck, PackageCheck, PackageOpen, CheckCheck, XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { companiesService } from '../../services/companiesService';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';

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
  expectedShipmentYear: number | null;
  expectedShipmentMonth: number | null;
}

interface PurchaseOrderListProps {
  onView?: (po: PurchaseOrder) => void;
  onEdit?: (po: PurchaseOrder) => void;
  onAdd?: () => void;
}

export const PurchaseOrderList = ({ onView, onEdit, onAdd }: PurchaseOrderListProps) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Draft', 'Approved', 'Submitted', 'Rejected']);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const pageSize = 10;

  const [summary, setSummary] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalInShipment: 0,
    totalPendingPayments: 0,
  });

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const statusOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'PartiallyReceived', label: 'Partially Received' },
    { value: 'Received', label: 'Received' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Rejected', label: 'Rejected' },
  ];
  const paymentStatusOptions = ['Pending Payment', 'Partially Paid', 'Fully Paid'];

  const fetchSummary = () => {
    const draft = purchaseOrders.filter(po => po.poStatus === 'Draft').length;
    const confirmed = purchaseOrders.filter(po => po.poStatus === 'Confirmed').length;
    const inShipment = purchaseOrders.filter(po => po.poStatus === 'In Shipment').length;
    const pendingPayments = purchaseOrders.filter(po => po.poStatus === 'Pending Payment').length;

    setSummary({
      totalPending: draft,
      totalApproved: confirmed,
      totalInShipment: inShipment,
      totalPendingPayments: pendingPayments,
    });
  };

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        pageNumber: currentPage,
        pageSize: pageSize,
      };

      if (selectedCompanyId) {
        params.companyId = selectedCompanyId;
      }

      if (searchTerm) {
        params.searchTerm = searchTerm;
      }

      if (selectedStatuses && selectedStatuses.length > 0) {
        params.statuses = selectedStatuses;
      }

      if (fromDate) {
        params.fromDate = fromDate;
      }

      if (toDate) {
        params.toDate = toDate;
      }

      const response = await purchaseOrdersService.getList(params);

      setPurchaseOrders(response.data || []);
      setTotalRecords(response.totalRecords || 0);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      setPurchaseOrders([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companiesService.getActive();
      setCompanies(response || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [currentPage, selectedCompanyId]);

  useEffect(() => {
    fetchSummary();
  }, [purchaseOrders]);

  const handleSearchClick = () => {
    setCurrentPage(1);
    fetchPurchaseOrders();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedStatuses(['Draft', 'Approved', 'Submitted', 'Rejected']);
    setSelectedPaymentStatus('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
    setSelectedCompanyId(null);
    fetchPurchaseOrders();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Draft':
        return {
          icon: FileEdit,
          color: 'text-[rgb(209,115,3)]',
        };
      case 'Approved':
        return {
          icon: CheckCircle,
          color: 'text-green-700 dark:text-green-400',
        };
      case 'Submitted':
        return {
          icon: Send,
          color: 'text-cyan-700 dark:text-cyan-400',
        };
      case 'Shipped':
        return {
          icon: Truck,
          color: 'text-indigo-700 dark:text-indigo-400',
        };
      case 'PartiallyReceived':
        return {
          icon: PackageOpen,
          color: 'text-orange-700 dark:text-orange-400',
        };
      case 'Received':
        return {
          icon: PackageCheck,
          color: 'text-teal-700 dark:text-teal-400',
        };
      case 'Completed':
        return {
          icon: CheckCheck,
          color: 'text-green-700 dark:text-green-400',
        };
      case 'Rejected':
        return {
          icon: XCircle,
          color: 'text-red-700 dark:text-red-400',
        };
      default:
        return {
          icon: FileText,
          color: 'text-gray-700 dark:text-gray-400',
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Purchase Orders</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage purchase orders and shipments
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={onAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Purchase Order</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-textSecondary)]">Total Draft POs</p>
              <p className="text-2xl font-bold text-[var(--color-text)] mt-2">{summary.totalPending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-textSecondary)]">Total Confirmed</p>
              <p className="text-2xl font-bold text-[var(--color-text)] mt-2">{summary.totalApproved}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-textSecondary)]">Total In Shipment</p>
              <p className="text-2xl font-bold text-[var(--color-text)] mt-2">{summary.totalInShipment}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Ship className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-textSecondary)]">Total Pending Payments</p>
              <p className="text-2xl font-bold text-[var(--color-text)] mt-2">{summary.totalPendingPayments}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Company
              </label>
              <select
                value={selectedCompanyId || ''}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value ? parseInt(e.target.value, 10) : null);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="">All</option>
                {companies.map((company) => (
                  <option key={company.companyId} value={company.companyId}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="PO Number / Supplier"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <MultiSelect
                label="Status"
                options={statusOptions}
                selectedValues={selectedStatuses}
                onChange={setSelectedStatuses}
                placeholder="Select statuses..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Payment Status
              </label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="">All Payment Status</option>
                {paymentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleSearchClick}
                className="flex-1 bg-[var(--color-primary)] hover:opacity-90 text-white"
              >
                Search
              </Button>
              <Button onClick={handleReset} variant="secondary">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Delivery Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => {
                  const company = companies.find(c => c.companyId === po.companyId);
                  const expectedDeliveryMonth = po.expectedShipmentMonth && po.expectedShipmentYear
                    ? new Date(po.expectedShipmentYear, po.expectedShipmentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : '';
                  return (
                    <tr key={po.purchaseOrderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {po.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {company?.companyName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {po.supplierName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expectedDeliveryMonth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(po.poDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const statusConfig = getStatusConfig(po.poStatus);
                          const StatusIcon = statusConfig.icon;
                          return (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusConfig.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {po.poStatus}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {po.currencyCode || ''} {po.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onView && onView(po)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit && onEdit(po)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && purchaseOrders.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
