import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, X, FileText, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { purchaseOrdersService, type PurchaseOrderResponse } from '../../services/purchaseOrdersService';
import { suppliersService } from '../../services/suppliersService';
import { companiesService } from '../../services/companiesService';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Cancelled'];

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'submitted': return 'bg-blue-100 text-blue-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-gray-100 text-gray-600';
    default: return 'bg-yellow-100 text-yellow-800';
  }
};

export const POReportsPage = () => {
  const [items, setItems] = useState<PurchaseOrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [suppliers, setSuppliers] = useState<{ supplierId: number; supplierName: string }[]>([]);
  const [companies, setCompanies] = useState<{ companyId: number; companyName: string }[]>([]);

  useEffect(() => {
    suppliersService.getAll()
      .then((d: any) => setSuppliers(Array.isArray(d) ? d : d?.data ?? []))
      .catch(() => {});
    companiesService.getAll()
      .then((d: any) => setCompanies(Array.isArray(d) ? d : d?.data ?? []))
      .catch(() => {});
  }, []);

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { pageNumber: page, pageSize: PAGE_SIZE };
      if (searchTerm) params.searchTerm = searchTerm;
      if (filterStatus) params.statuses = [filterStatus];
      if (filterSupplierId) params.supplierId = parseInt(filterSupplierId, 10);
      if (filterCompanyId) params.companyId = parseInt(filterCompanyId, 10);
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const result = await purchaseOrdersService.getList(params);
      setItems(result.data ?? []);
      setTotalRecords(result.totalRecords ?? 0);
      setTotalPages(result.totalPages ?? 1);
      setCurrentPage(result.currentPage ?? page);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus, filterSupplierId, filterCompanyId, fromDate, toDate]);

  useEffect(() => { fetchItems(1); }, [fetchItems]);

  const handleReset = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterSupplierId('');
    setFilterCompanyId('');
    setFromDate('');
    setToDate('');
  };

  const handleExportCSV = () => {
    if (!items.length) return;
    const headers = ['PO Number', 'PO Date', 'Supplier', 'Company', 'Currency', 'Status', 'Total Amount'];
    const rows = items.map(r => [
      r.poNumber,
      r.poDate ? new Date(r.poDate).toLocaleDateString() : '',
      r.supplierName ?? '',
      r.companyName ?? '',
      r.currencyCode ?? '',
      r.status ?? '',
      r.totalAmount ?? '',
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `po-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString() : '—';
  const formatAmount = (n: number | null | undefined) =>
    n != null ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">PO Reports</h1>
          <p className="text-sm text-gray-500 mt-1">{totalRecords} record{totalRecords !== 1 ? 's' : ''} found</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={!items.length}>
          <Download className="w-4 h-4 mr-2" />Export CSV
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search PO number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchItems(1)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>
          <select
            value={filterSupplierId}
            onChange={(e) => setFilterSupplierId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}
          </select>
          <select
            value={filterCompanyId}
            onChange={(e) => setFilterCompanyId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            <option value="">All Companies</option>
            {companies.map((c) => <option key={c.companyId} value={c.companyId}>{c.companyName}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="primary" size="sm" onClick={() => fetchItems(1)}><Search className="w-4 h-4 mr-1" />Search</Button>
          <Button variant="outline" size="sm" onClick={handleReset}><X className="w-4 h-4 mr-1" />Reset</Button>
          <Button variant="outline" size="sm" onClick={() => fetchItems(currentPage)}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['PO Number', 'PO Date', 'Supplier', 'Company', 'Currency', 'Status', 'Total Amount', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" /></div>
                </td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No records found.</td></tr>
              ) : items.map((item) => (
                <tr key={item.purchaseOrderId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--color-primary)] whitespace-nowrap">{item.poNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDate(item.poDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.supplierName ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.companyName ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.currencyCode ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-right">{formatAmount(item.totalAmount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => purchaseOrdersService.printPdf(item.purchaseOrderId).catch(() => {})}
                      title="Print PDF"
                      className="text-gray-500 hover:text-[var(--color-primary)] transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages} &mdash; {totalRecords} total records
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchItems(currentPage - 1)} disabled={currentPage <= 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => fetchItems(currentPage + 1)} disabled={currentPage >= totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
