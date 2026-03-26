import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, AlertCircle, Clock, XCircle, Ship, Calendar, DollarSign, Package, TrendingUp, X } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDetail}
          />
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden bg-white">
            {detailModal.loading ? (
              <div className="flex items-center justify-center h-64 bg-white">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Loading payment details...</p>
                </div>
              </div>
            ) : !detailModal.data ? (
              <div className="flex items-center justify-center h-64 bg-white">
                <p className="text-sm text-gray-500">Failed to load details.</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Ship className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-0.5">
                          Container
                        </p>
                        <h2 className="text-xl font-bold text-white tracking-wide">
                          {detailModal.data.containerNumber}
                        </h2>
                        <p className="text-sm text-slate-300 mt-0.5">
                          {detailModal.data.shippingCompanyName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PaymentStatusBadge status={detailModal.data.paymentStatus} />
                      <button
                        onClick={closeDetail}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    <div className="bg-white/10 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        <p className="text-xs text-slate-300 font-medium">ETA</p>
                      </div>
                      <p className="text-sm font-semibold text-white">{formatDate(detailModal.data.eta)}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        <p className="text-xs text-slate-300 font-medium">Payment Due</p>
                      </div>
                      <p className="text-sm font-semibold text-white">{formatDate(detailModal.data.dueDate)}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-300" />
                        <p className="text-xs text-slate-300 font-medium">Total Amount</p>
                      </div>
                      <p className="text-sm font-semibold text-white">${formatCurrency(detailModal.data.poAmount)}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-3.5 h-3.5 text-slate-300" />
                        <p className="text-xs text-slate-300 font-medium">Total CBM</p>
                      </div>
                      <p className="text-sm font-semibold text-white">{formatCBM(detailModal.data.totalCBM)}</p>
                    </div>
                  </div>

                  <div className="mt-4 bg-white/10 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-slate-300" />
                        <p className="text-xs text-slate-300 font-medium">
                          PO Completion — {detailModal.data.fullyPaidPOs} of {detailModal.data.totalPOs} fully paid
                        </p>
                      </div>
                      <p className="text-xs font-bold text-white">
                        {detailModal.data.totalPOs > 0
                          ? Math.round((detailModal.data.fullyPaidPOs / detailModal.data.totalPOs) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${detailModal.data.totalPOs > 0 ? (detailModal.data.fullyPaidPOs / detailModal.data.totalPOs) * 100 : 0}%`,
                          backgroundColor:
                            detailModal.data.fullyPaidPOs === detailModal.data.totalPOs
                              ? '#34d399'
                              : detailModal.data.fullyPaidPOs > 0
                              ? '#fbbf24'
                              : '#f87171',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Purchase Order Details
                      </h3>
                      <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-full">
                        {detailModal.data.purchaseOrders.length} records
                      </span>
                    </div>

                    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
                      <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              PO Number
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              PO Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Supplier
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              CBM
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Terms Progress
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {detailModal.data.purchaseOrders.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                                No purchase orders found for this container.
                              </td>
                            </tr>
                          ) : (
                            detailModal.data.purchaseOrders.map((po, idx) => {
                              const pct = po.totalPaymentTerms > 0
                                ? (po.paidPaymentTerms / po.totalPaymentTerms) * 100
                                : 0;
                              const barColor =
                                po.paidPaymentTerms === po.totalPaymentTerms
                                  ? '#10b981'
                                  : po.paidPaymentTerms > 0
                                  ? '#f59e0b'
                                  : '#ef4444';
                              return (
                                <tr
                                  key={po.purchaseOrderId}
                                  className={`transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                >
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <span className="font-semibold text-gray-900 text-sm">{po.poNumber}</span>
                                  </td>
                                  <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">
                                    {formatDate(po.poDate)}
                                  </td>
                                  <td className="px-4 py-3.5 text-gray-700 text-sm max-w-[180px]">
                                    <span className="block truncate" title={po.supplierName}>
                                      {po.supplierName}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                    <span className="font-medium text-gray-900 text-sm">
                                      ${formatCurrency(po.poAmount)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 whitespace-nowrap text-right text-gray-700 text-sm">
                                    {formatCBM(po.totalCBM)}
                                  </td>
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <PaymentStatusBadge status={po.paymentStatus} />
                                  </td>
                                  <td className="px-4 py-3.5 min-w-[140px]">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className="h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                                        />
                                      </div>
                                      <span
                                        className="text-xs font-semibold tabular-nums whitespace-nowrap"
                                        style={{ color: barColor }}
                                      >
                                        {po.paidPaymentTerms}/{po.totalPaymentTerms}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        {detailModal.data.purchaseOrders.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-800">
                              <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Grand Total
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-white">
                                ${formatCurrency(
                                  detailModal.data.purchaseOrders.reduce((s, p) => s + (p.poAmount || 0), 0)
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-white">
                                {formatCBM(
                                  detailModal.data.purchaseOrders.reduce((s, p) => s + (p.totalCBM || 0), 0)
                                )}
                              </td>
                              <td colSpan={2} />
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Payment deadline is 15 days before ETA date
                  </p>
                  <Button variant="secondary" onClick={closeDetail}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
