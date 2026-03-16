import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, DollarSign, Clock, CheckCircle, AlertCircle, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { poPaymentsService, POPaymentListItem, POPaymentTiles } from '../../services/poPaymentsService';
import { companiesService } from '../../services/companiesService';
import { suppliersService } from '../../services/suppliersService';

interface POPaymentsListProps {
  onSelectPayment: (paymentId: number) => void;
}

export const POPaymentsList = ({ onSelectPayment }: POPaymentsListProps) => {
  const [tiles, setTiles] = useState<POPaymentTiles>({
    totalPending: 0,
    totalRequested: 0,
    totalPaid: 0,
    totalOverdue: 0,
    pendingAmount: 0,
    requestedAmount: 0,
    paidAmount: 0,
  });
  const [payments, setPayments] = useState<POPaymentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 20;

  const [companies, setCompanies] = useState<Array<{ value: number; label: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ value: number; label: string }>>([]);

  const [filters, setFilters] = useState({
    companyId: undefined as number | undefined,
    supplierId: undefined as number | undefined,
    statuses: ['Pending', 'Requested', 'Approved', 'Rejected'] as string[],
    fromDate: '',
    toDate: '',
    searchTerm: '',
  });

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Requested', label: 'Requested' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Paid', label: 'Paid' },
  ];

  useEffect(() => {
    loadCompanies();
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadTiles();
    loadPayments();
  }, [currentPage]);

  const loadCompanies = async () => {
    try {
      const response = await companiesService.getActive();
      const data = Array.isArray(response) ? response : (response.data || []);
      setCompanies(data.map((c: any) => ({ value: c.companyId, label: c.companyName })));
    } catch (error) {
      console.error('Failed to load companies:', error);
      setCompanies([]);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await suppliersService.getDropdown();
      const data = Array.isArray(response) ? response : (response.data || []);
      setSuppliers(data.map((s: any) => ({ value: s.supplierId, label: s.supplierName })));
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      setSuppliers([]);
    }
  };

  const loadTiles = async () => {
    try {
      const data = await poPaymentsService.getTiles(filters.companyId);
      setTiles(data);
    } catch (error) {
      console.error('Failed to load tiles:', error);
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await poPaymentsService.getList({
        pageNumber: currentPage,
        pageSize,
        companyId: filters.companyId,
        supplierId: filters.supplierId,
        statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        searchTerm: filters.searchTerm || undefined,
      });
      setPayments(response.data);
      setTotalPages(response.totalPages);
      setTotalRecords(response.totalRecords);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (filters.statuses.includes('Paid')) {
      if (!filters.fromDate || !filters.toDate) {
        alert('From Date and To Date are required when "Paid" status is selected');
        return;
      }
    }
    if (filters.fromDate && !filters.toDate) {
      alert('Please select a "To Date" when using "From Date"');
      return;
    }
    if (!filters.fromDate && filters.toDate) {
      alert('Please select a "From Date" when using "To Date"');
      return;
    }
    setCurrentPage(1);
    loadPayments();
  };

  const handleStatusChange = (newStatuses: string[]) => {
    const wasPaidSelected = filters.statuses.includes('Paid');
    const isPaidSelected = newStatuses.includes('Paid');

    if (!wasPaidSelected && isPaidSelected) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      setFilters({
        ...filters,
        statuses: newStatuses,
        fromDate: thirtyDaysAgo.toISOString().split('T')[0],
        toDate: today.toISOString().split('T')[0],
      });
    } else {
      setFilters({ ...filters, statuses: newStatuses });
    }
  };

  const handleReset = () => {
    setFilters({
      companyId: undefined,
      supplierId: undefined,
      statuses: ['Pending', 'Requested', 'Approved', 'Rejected'],
      fromDate: '',
      toDate: '',
      searchTerm: '',
    });
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadTiles();
    loadPayments();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Requested':
        return 'bg-blue-100 text-blue-800';
      case 'Approved':
        return 'bg-purple-100 text-purple-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (expectedDate: string, status: string) => {
    if (status === 'Paid') return false;
    const today = new Date();
    const expected = new Date(expectedDate);
    return expected < today;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 mb-2">Pending</p>
              <p className="text-2xl font-bold text-yellow-900 mb-3">{tiles.totalPending}</p>
              <div className="bg-yellow-200/50 rounded-lg px-3 py-2 border border-yellow-300">
                <p className="text-sm font-semibold text-yellow-800 mb-1">Amount</p>
                <p className="text-2xl font-bold text-yellow-900">${formatCurrency(tiles.pendingAmount)}</p>
              </div>
            </div>
            <Clock className="w-10 h-10 text-yellow-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 mb-2">Requested</p>
              <p className="text-2xl font-bold text-blue-900 mb-3">{tiles.totalRequested}</p>
              <div className="bg-blue-200/50 rounded-lg px-3 py-2 border border-blue-300">
                <p className="text-sm font-semibold text-blue-800 mb-1">Amount</p>
                <p className="text-2xl font-bold text-blue-900">${formatCurrency(tiles.requestedAmount)}</p>
              </div>
            </div>
            <DollarSign className="w-10 h-10 text-blue-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-2">Paid in the Last 30 Days</p>
              <p className="text-2xl font-bold text-green-900 mb-3">{tiles.totalPaid}</p>
              <div className="bg-green-200/50 rounded-lg px-3 py-2 border border-green-300">
                <p className="text-sm font-semibold text-green-800 mb-1">Amount</p>
                <p className="text-2xl font-bold text-green-900">${formatCurrency(tiles.paidAmount)}</p>
              </div>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-2">Overdue</p>
              <p className="text-2xl font-bold text-red-900 mb-3">{tiles.totalOverdue}</p>
              <div className="bg-red-200/50 rounded-lg px-3 py-2 border border-red-300">
                <p className="text-sm font-semibold text-red-800">Needs attention</p>
              </div>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[var(--color-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Company</label>
            <SearchableSelect
              options={companies}
              value={filters.companyId}
              onChange={(value) => setFilters({ ...filters, companyId: value })}
              placeholder="Select Company"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Supplier</label>
            <SearchableSelect
              options={suppliers}
              value={filters.supplierId}
              onChange={(value) => setFilters({ ...filters, supplierId: value })}
              placeholder="Select Supplier"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Status</label>
            <MultiSelect
              options={statusOptions}
              selectedValues={filters.statuses}
              onChange={handleStatusChange}
              placeholder="Select Status"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Search</label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              placeholder="PO Number / Supplier"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSearch} className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </Button>
          <Button onClick={handleReset} variant="secondary">
            Reset
          </Button>
          <Button onClick={handleRefresh} variant="secondary" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            PO Payments ({totalRecords})
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-text-secondary)]">No payments found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total PO Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Amount
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Date
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr
                      key={payment.purchaseOrderPaymentId}
                      className={`hover:bg-gray-50 transition-colors ${
                        isOverdue(payment.expectedDate, payment.status) ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {payment.poNumber}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{payment.supplierName}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(payment.totalPOAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(payment.expectedAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(payment.paidAmount)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-center">
                        {new Date(payment.expectedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onSelectPayment(payment.purchaseOrderPaymentId)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-[var(--color-text-secondary)]">
                Showing {payments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
