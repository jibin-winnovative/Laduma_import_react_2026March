import { useState, useEffect } from 'react';
import { Search, Download, Activity, File as FileEdit, CheckCircle, Send, CheckCheck, XCircle, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { companiesService } from '../../services/companiesService';
import { suppliersService } from '../../services/suppliersService';
import { poReportsService, POReportRow, POReportSearchParams } from '../../services/poReportsService';

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Rejected', label: 'Rejected' },
];

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 'Goods Ready From Supplier', label: 'Goods Ready From Supplier' },
  { value: 'Customs Clearance', label: 'Customs Clearance' },
  { value: 'Goods Collected By Transporter', label: 'Goods Collected By Transporter' },
  { value: 'Goods Receipt In Warehouse', label: 'Goods Receipt In Warehouse' },
  { value: 'GRV Completed', label: 'GRV Completed' },
];

const PAGE_SIZE = 10;

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Draft': return { icon: FileEdit, color: 'text-amber-600' };
    case 'Approved': return { icon: CheckCircle, color: 'text-green-700' };
    case 'Submitted': return { icon: Send, color: 'text-cyan-700' };
    case 'Completed': return { icon: CheckCheck, color: 'text-green-700' };
    case 'Rejected': return { icon: XCircle, color: 'text-red-700' };
    default: return { icon: FileText, color: 'text-gray-500' };
  }
};

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastId = 0;

export const POReportsPage = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedOperationalStatuses, setSelectedOperationalStatuses] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [rows, setRows] = useState<POReportRow[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searched, setSearched] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [companiesRes, suppliersRes] = await Promise.all([
          companiesService.getActive(),
          suppliersService.getDropdown(),
        ]);
        setCompanies(companiesRes || []);
        setSuppliers(suppliersRes || []);
      } catch {
        // silently ignore — dropdowns are best-effort
      }
    };
    loadDropdowns();
  }, []);

  const buildParams = (page: number): POReportSearchParams => ({
    companyId: selectedCompanyId,
    supplierId: selectedSupplierId,
    searchTerm: searchTerm || undefined,
    statuses: selectedStatuses,
    operationalStatuses: selectedOperationalStatuses,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    pageNumber: page,
    pageSize: PAGE_SIZE,
  });

  const runSearch = async (page: number) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await poReportsService.search(buildParams(page));
      setRows(res.data || []);
      setTotalRecords(res.totalRecords || 0);
      setCurrentPage(page);
    } catch {
      setRows([]);
      setTotalRecords(0);
      addToast('error', 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    runSearch(1);
  };

  const handleReset = () => {
    setSelectedCompanyId(null);
    setSelectedSupplierId(null);
    setSearchTerm('');
    setSelectedStatuses([]);
    setSelectedOperationalStatuses([]);
    setFromDate('');
    setToDate('');
    setRows([]);
    setTotalRecords(0);
    setCurrentPage(1);
    setSearched(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await poReportsService.exportExcel(buildParams(currentPage));
      addToast('success', 'Excel export downloaded successfully.');
    } catch {
      addToast('error', 'Failed to export Excel. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (page: number) => {
    runSearch(page);
  };

  const formatDate = (val: string | null) => {
    if (!val) return '—';
    try { return new Date(val).toLocaleDateString(); } catch { return val; }
  };

  const formatAmount = (val: number | null) => {
    if (val == null) return '—';
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[99999] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all duration-300 ${
              t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">PO Reports</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Search and export purchase order data
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Company</label>
            <select
              value={selectedCompanyId ?? ''}
              onChange={(e) => setSelectedCompanyId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white text-[var(--color-text)]"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Supplier</label>
            <select
              value={selectedSupplierId ?? ''}
              onChange={(e) => setSelectedSupplierId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white text-[var(--color-text)]"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>
              ))}
            </select>
          </div>

          {/* Search term */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="PO Number / Supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Statuses */}
          <div>
            <MultiSelect
              label="Statuses"
              options={STATUS_OPTIONS}
              selectedValues={selectedStatuses}
              onChange={setSelectedStatuses}
              placeholder="All statuses..."
            />
          </div>

          {/* Operational Statuses */}
          <div>
            <MultiSelect
              label="Operational Statuses"
              options={OPERATIONAL_STATUS_OPTIONS}
              selectedValues={selectedOperationalStatuses}
              onChange={setSelectedOperationalStatuses}
              placeholder="All operational statuses..."
            />
          </div>

          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 sm:flex-none bg-[var(--color-primary)] hover:opacity-90 text-white flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button onClick={handleReset} variant="secondary" disabled={loading}>
              Reset
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || !searched}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'PO Number',
                  'PO Date',
                  'Supplier',
                  'PO Amount',
                  'Total CBM',
                  'Exporter Port',
                  'Type of Shipment',
                  'Mode of Shipment',
                  'Expected Delivery Month',
                  'Status',
                  'Operational Status',
                  'Latest Completed Event',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : !searched ? (
                <tr>
                  <td colSpan={12} className="px-6 py-10 text-center text-sm text-gray-400">
                    Use the filters above and click Search to view results.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-sm text-gray-500">
                    No records found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const statusCfg = getStatusConfig(row.status);
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={row.purchaseOrderId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.poNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(row.poDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.supplierName || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatAmount(row.poAmount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                        {row.totalCBM != null ? row.totalCBM.toFixed(3) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {row.exportPortName || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {row.shipmentTypeName || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {row.modeOfShipment || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {row.expectedDeliveryMonth || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusCfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.operationalStatus ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Activity className="w-3 h-3" />
                            {row.operationalStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {row.latestCompletedEventStatus || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {searched && !loading && rows.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalRecords)} of{' '}
                {totalRecords} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
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
                  onClick={() => handlePageChange(currentPage + 1)}
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
