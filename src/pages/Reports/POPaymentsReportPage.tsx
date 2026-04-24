import { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { suppliersService } from '../../services/suppliersService';
import {
  poPaymentsReportService,
  POPaymentsReportRow,
  POPaymentsReportSearchParams,
} from '../../services/poPaymentsReportService';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Requested', label: 'Requested' },
  { value: 'Paid', label: 'Paid' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastId = 0;

const getPaymentStatusStyle = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'Requested':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Pending':
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

export const POPaymentsReportPage = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [poNumber, setPoNumber] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);

  const [rows, setRows] = useState<POPaymentsReportRow[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searched, setSearched] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    suppliersService
      .getDropdown()
      .then((res) => setSuppliers(res || []))
      .catch(() => {});
  }, []);

  const buildParams = (page: number, size = pageSize): POPaymentsReportSearchParams => ({
    poNumber: poNumber || undefined,
    supplierId: selectedSupplierId,
    paymentStatuses: selectedPaymentStatuses,
    pageNumber: page,
    pageSize: size,
  });

  const runSearch = async (page: number, size = pageSize) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await poPaymentsReportService.search(buildParams(page, size));
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

  const handleSearch = () => runSearch(1);

  const handleReset = () => {
    setPoNumber('');
    setSelectedSupplierId(null);
    setSelectedPaymentStatuses([]);
    setPageSize(10);
    setRows([]);
    setTotalRecords(0);
    setCurrentPage(1);
    setSearched(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await poPaymentsReportService.exportExcel(buildParams(currentPage));
      addToast('success', 'Excel export downloaded successfully.');
    } catch {
      addToast('error', 'Failed to export Excel. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    if (searched) runSearch(1, newSize);
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">PO Payments Report</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Search and export purchase order payment data
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* PO Number */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">PO Number</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by PO Number..."
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>
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

          {/* Payment Statuses */}
          <div>
            <MultiSelect
              label="Payment Statuses"
              options={PAYMENT_STATUS_OPTIONS}
              selectedValues={selectedPaymentStatuses}
              onChange={setSelectedPaymentStatuses}
              placeholder="All payment statuses..."
            />
          </div>

          {/* Page size */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Results Per Page</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white text-[var(--color-text)]"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s} per page</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2 sm:col-span-2">
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
                  'PO Amount (USD)',
                  'Total CBM',
                  'Payment Status',
                  'Payment Terms',
                  'Payment Amount',
                  'Expected Payment Date',
                  'Paid Amount (ZAR)',
                  'Paid Date',
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
                  <td colSpan={11} className="px-6 py-8 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : !searched ? (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-sm text-gray-400">
                    Use the filters above and click Search to view results.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-sm text-gray-500">
                    No records found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.purchaseOrderPaymentId} className="hover:bg-gray-50 transition-colors">
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
                      {formatAmount(row.poAmountInUsd)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                      {row.totalCBM != null ? row.totalCBM.toFixed(3) : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusStyle(row.paymentStatus)}`}
                      >
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {row.paymentTerms || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatAmount(row.paymentAmount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(row.expectedPaymentDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatAmount(row.paidAmountInRand)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(row.paidDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {searched && !loading && rows.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalRecords)} of{' '}
                {totalRecords} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => runSearch(currentPage - 1)}
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
                  onClick={() => runSearch(currentPage + 1)}
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
