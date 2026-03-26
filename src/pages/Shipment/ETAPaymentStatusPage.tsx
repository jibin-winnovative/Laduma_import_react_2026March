import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { MultiSelect } from '../../components/ui/MultiSelect';
import {
  etaPaymentStatusService,
  EtaPaymentStatusSearchRequest,
  EtaPaymentStatusListItem,
  EtaPaymentStatusDetail,
} from '../../services/etaPaymentStatusService';
import { shippingCompaniesService, ShippingCompany } from '../../services/shippingCompaniesService';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'Fully Paid', label: 'Fully Paid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Overdue', label: 'Overdue' },
];

const DEFAULT_REQUEST: EtaPaymentStatusSearchRequest = {
  containerNumber: '',
  shippingCompanyId: null,
  paymentStatus: null,
  paymentStatuses: [],
  etaFromDate: null,
  etaToDate: null,
  pageNumber: 1,
  pageSize: 20,
};

const getPaymentStatusConfig = (status: string) => {
  const map: Record<string, { bgColor: string; textColor: string; icon: JSX.Element }> = {
    'fully paid': {
      bgColor: '#D1FAE5',
      textColor: '#047857',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    'partially paid': {
      bgColor: '#FEF3C7',
      textColor: '#92400E',
      icon: <Clock className="w-3 h-3" />,
    },
    'pending': {
      bgColor: '#DBEAFE',
      textColor: '#1D4ED8',
      icon: <AlertCircle className="w-3 h-3" />,
    },
    'overdue': {
      bgColor: '#FEE2E2',
      textColor: '#DC2626',
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  const key = status?.toLowerCase().trim() || '';
  return (
    map[key] || {
      bgColor: '#F3F4F6',
      textColor: '#374151',
      icon: <Clock className="w-3 h-3" />,
    }
  );
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const config = getPaymentStatusConfig(status);
  return (
    <span
      className="px-2 py-1 text-xs font-semibold rounded inline-flex items-center gap-1"
      style={{ backgroundColor: config.bgColor, color: config.textColor }}
    >
      {config.icon}
      {status}
    </span>
  );
};

const formatCurrency = (amount: number) =>
  amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00';

const formatCBM = (cbm: number) =>
  cbm?.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) ?? '0.000';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
};

export const ETAPaymentStatusPage = () => {
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);
  const [containers, setContainers] = useState<EtaPaymentStatusListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [filters, setFilters] = useState<EtaPaymentStatusSearchRequest>(DEFAULT_REQUEST);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalRecords: 0,
  });
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    loading: boolean;
    data: EtaPaymentStatusDetail | null;
  }>({ open: false, loading: false, data: null });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (initialLoadDone) {
      doSearch(filters);
    }
  }, [filters.pageNumber]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [companiesResponse, searchResponse] = await Promise.all([
        shippingCompaniesService.getList({ pageSize: 500, isActive: true }),
        etaPaymentStatusService.search(DEFAULT_REQUEST),
      ]);
      const companiesData = companiesResponse?.data || [];
      setShippingCompanies(companiesData || []);
      setContainers(searchResponse?.items || []);
      setPagination({
        currentPage: searchResponse?.currentPage || 1,
        pageSize: searchResponse?.pageSize || 20,
        totalPages: searchResponse?.totalPages || 1,
        totalRecords: searchResponse?.totalRecords || 0,
      });
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setShippingCompanies([]);
      setContainers([]);
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  };

  const doSearch = async (req: EtaPaymentStatusSearchRequest) => {
    setSearching(true);
    try {
      const response = await etaPaymentStatusService.search(req);
      setContainers(response?.items || []);
      setPagination({
        currentPage: response?.currentPage || 1,
        pageSize: response?.pageSize || 20,
        totalPages: response?.totalPages || 1,
        totalRecords: response?.totalRecords || 0,
      });
    } catch {
      setContainers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    const updated: EtaPaymentStatusSearchRequest = {
      ...filters,
      paymentStatuses: selectedStatuses,
      pageNumber: 1,
    };
    setFilters(updated);
    doSearch(updated);
  };

  const handleReset = () => {
    setSelectedStatuses([]);
    setFilters(DEFAULT_REQUEST);
    doSearch(DEFAULT_REQUEST);
  };

  const handleView = async (containerId: number) => {
    setDetailModal({ open: true, loading: true, data: null });
    try {
      const data = await etaPaymentStatusService.getDetail(containerId);
      setDetailModal({ open: true, loading: false, data });
    } catch {
      setDetailModal({ open: true, loading: false, data: null });
    }
  };

  const closeDetail = () => setDetailModal({ open: false, loading: false, data: null });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">ETA Payment Status</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Monitor container ETA payment deadlines — all POs must be paid 15 days before ETA
          </p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Search Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Container Number
            </label>
            <input
              type="text"
              value={filters.containerNumber || ''}
              onChange={(e) => setFilters({ ...filters, containerNumber: e.target.value })}
              placeholder="Search container number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Shipping Company
            </label>
            <SearchableSelect
              options={shippingCompanies.map((c) => ({
                value: c.shippingCompanyId.toString(),
                label: c.companyName,
              }))}
              value={filters.shippingCompanyId?.toString() || ''}
              onChange={(value) =>
                setFilters({
                  ...filters,
                  shippingCompanyId: value ? parseInt(value) : null,
                })
              }
              placeholder="Select Shipping Company"
            />
          </div>

          <div>
            <MultiSelect
              label="Payment Status"
              options={PAYMENT_STATUS_OPTIONS}
              selectedValues={selectedStatuses}
              onChange={setSelectedStatuses}
              placeholder="Select payment statuses..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              ETA From Date
            </label>
            <input
              type="date"
              value={filters.etaFromDate || ''}
              onChange={(e) =>
                setFilters({ ...filters, etaFromDate: e.target.value || null })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              ETA To Date
            </label>
            <input
              type="date"
              value={filters.etaToDate || ''}
              onChange={(e) =>
                setFilters({ ...filters, etaToDate: e.target.value || null })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button onClick={handleSearch} disabled={searching} className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            {searching ? 'Searching...' : 'Search'}
          </Button>
          <Button onClick={handleReset} variant="secondary">
            Reset
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Container Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipping Company
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total CBM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ETA Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading || searching ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : containers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                    No containers found
                  </td>
                </tr>
              ) : (
                containers.map((container) => (
                  <tr key={container.containerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {container.containerNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {container.shippingCompanyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${formatCurrency(container.poAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCBM(container.totalCBM)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentStatusBadge status={container.paymentStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {container.etaDueDateLabel || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(container.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleView(container.containerId)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View PO Payment Status"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !searching && containers.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing{' '}
                {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
                {Math.min(
                  pagination.currentPage * pagination.pageSize,
                  pagination.totalRecords
                )}{' '}
                of {pagination.totalRecords} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    setFilters({ ...filters, pageNumber: filters.pageNumber - 1 })
                  }
                  disabled={pagination.currentPage === 1}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  onClick={() =>
                    setFilters({ ...filters, pageNumber: filters.pageNumber + 1 })
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
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

      {detailModal.open && (
        <Modal
          isOpen={true}
          onClose={closeDetail}
          title={
            detailModal.data
              ? `PO Payment Status — ${detailModal.data.containerNumber}`
              : 'PO Payment Status'
          }
        >
          {detailModal.loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
          ) : !detailModal.data ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Failed to load details.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Shipping Company</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {detailModal.data.shippingCompanyName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ETA</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatDate(detailModal.data.eta)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date (ETA - 15d)</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatDate(detailModal.data.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Overall Status</p>
                  <div className="mt-0.5">
                    <PaymentStatusBadge status={detailModal.data.paymentStatus} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total POs</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {detailModal.data.totalPOs}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fully Paid POs</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {detailModal.data.fullyPaidPOs}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total PO Amount</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    ${formatCurrency(detailModal.data.poAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total CBM</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatCBM(detailModal.data.totalCBM)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO Number
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO Amount
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total CBM
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Terms (Paid/Total)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detailModal.data.purchaseOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                          No purchase orders found
                        </td>
                      </tr>
                    ) : (
                      detailModal.data.purchaseOrders.map((po) => (
                        <tr key={po.purchaseOrderId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                            {po.poNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                            {formatDate(po.poDate)}
                          </td>
                          <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                            {po.supplierName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-right">
                            ${formatCurrency(po.poAmount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-right">
                            {formatCBM(po.totalCBM)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <PaymentStatusBadge status={po.paymentStatus} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span
                              className={`text-sm font-semibold ${
                                po.paidPaymentTerms === po.totalPaymentTerms
                                  ? 'text-green-700'
                                  : po.paidPaymentTerms > 0
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {po.paidPaymentTerms}/{po.totalPaymentTerms}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {detailModal.data.purchaseOrders.length > 0 && (
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                          Totals
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                          $
                          {formatCurrency(
                            detailModal.data.purchaseOrders.reduce(
                              (s, p) => s + (p.poAmount || 0),
                              0
                            )
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                          {formatCBM(
                            detailModal.data.purchaseOrders.reduce(
                              (s, p) => s + (p.totalCBM || 0),
                              0
                            )
                          )}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={closeDetail}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
