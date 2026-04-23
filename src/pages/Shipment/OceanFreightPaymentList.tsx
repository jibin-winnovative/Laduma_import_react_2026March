import { useState, useEffect } from 'react';
import { Eye, Pencil, Trash2, Plus, Search, File as FileEdit, CheckCheck, DollarSign, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MultiSelect } from '../../components/ui/MultiSelect';
import {
  oceanFreightPaymentsService,
  OceanFreightPaymentListItem,
  OceanFreightPaymentDashboard,
  OceanFreightPaymentSearchRequest,
} from '../../services/oceanFreightPaymentsService';

interface OceanFreightPaymentListProps {
  onAdd: () => void;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}

export const OceanFreightPaymentList = ({ onAdd, onEdit, onView, onDelete }: OceanFreightPaymentListProps) => {
  const [items, setItems] = useState<OceanFreightPaymentListItem[]>([]);
  const [dashboard, setDashboard] = useState<OceanFreightPaymentDashboard>({
    pendingCount: 0,
    requestedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    paidCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const [containerNumber, setContainerNumber] = useState('');
  const [oceanFreightCompany, setOceanFreightCompany] = useState('');
  const [statuses, setStatuses] = useState<string[]>(['Pending', 'Requested', 'Approved', 'Rejected']);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Requested', label: 'Requested' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Paid', label: 'Paid' },
  ];

  const [appliedFilters, setAppliedFilters] = useState<OceanFreightPaymentSearchRequest>({
    statuses: ['Pending', 'Requested', 'Approved', 'Rejected'],
    pageNumber: 1,
    pageSize,
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    fetchList();
  }, [appliedFilters, currentPage]);

  const fetchDashboard = async () => {
    try {
      const data = await oceanFreightPaymentsService.getDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await oceanFreightPaymentsService.search({
        ...appliedFilters,
        pageNumber: currentPage,
        pageSize,
      });
      setItems(response.data || []);
      setTotalRecords(response.totalRecords || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch ocean freight payments:', err);
      setItems([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (statuses.includes('Paid')) {
      if (!fromDate || !toDate) {
        alert('From Date and To Date are required when "Paid" status is selected');
        return;
      }
    }
    setCurrentPage(1);
    setAppliedFilters({
      containerNumber: containerNumber || undefined,
      oceanFreightCompany: oceanFreightCompany || undefined,
      statuses: statuses.length > 0 ? statuses : undefined,
      fromDate: fromDate || null,
      toDate: toDate || null,
      pageNumber: 1,
      pageSize,
    });
  };

  const handleReset = () => {
    setContainerNumber('');
    setOceanFreightCompany('');
    setStatuses(['Pending', 'Requested', 'Approved', 'ApnUpdated', 'Rejected']);
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
    setAppliedFilters({
      statuses: ['Pending', 'Requested', 'Approved', 'ApnUpdated', 'Rejected'],
      pageNumber: 1,
      pageSize
    });
  };

  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'Pending':
        return { icon: FileEdit, color: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' };
      case 'Requested':
        return { icon: FileText, color: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' };
      case 'Approved':
        return { icon: CheckCheck, color: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' };
      case 'ApnUpdated':
        return { icon: CheckCheck, color: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' };
      case 'Rejected':
        return { icon: FileText, color: 'text-red-700', badge: 'bg-red-100 text-red-800' };
      case 'Paid':
        return { icon: DollarSign, color: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' };
      default:
        return { icon: FileText, color: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatAmount = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Ocean Freight Payments</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage ocean freight payment records</p>
        </div>
        <Button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Ocean Freight Payment</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-textSecondary)]">Pending</p>
              <p className="text-xl font-bold text-[var(--color-text)] mt-1">{dashboard.pendingCount}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileEdit className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-textSecondary)]">Requested</p>
              <p className="text-xl font-bold text-[var(--color-text)] mt-1">{dashboard.requestedCount}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-textSecondary)]">Approved</p>
              <p className="text-xl font-bold text-[var(--color-text)] mt-1">{dashboard.approvedCount}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-textSecondary)]">Rejected</p>
              <p className="text-xl font-bold text-[var(--color-text)] mt-1">{dashboard.rejectedCount}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-textSecondary)]">Paid</p>
              <p className="text-xl font-bold text-[var(--color-text)] mt-1">{dashboard.paidCount}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Container Number</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search container number..."
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Ocean Freight Company</label>
            <input
              type="text"
              placeholder="Search company..."
              value={oceanFreightCompany}
              onChange={(e) => setOceanFreightCompany(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Status</label>
            <MultiSelect
              options={statusOptions}
              selectedValues={statuses}
              onChange={setStatuses}
              placeholder="Select statuses..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={handleSearch}
              className="flex-1 bg-[var(--color-primary)] hover:opacity-90 text-white"
            >
              Search
            </Button>
            <Button onClick={handleReset} variant="secondary">
              Reset
            </Button>
          </div>
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
                  Ocean Freight Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimated Payment Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ocean Freight USD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No ocean freight payments found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const cfg = getStatusConfig(item.status);
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={item.oceanFreightPaymentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.containerNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.oceanFreightCompanyName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.paymentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatAmount(item.oceanFreightUSD)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {item.status === 'Paid' && (item as any).paidDate
                            ? `Paid - ${formatDate((item as any).paidDate)}`
                            : item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onView(item.oceanFreightPaymentId)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(item.oceanFreightPaymentId)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {(item.status === 'Pending' || item.status === 'Rejected') && (
                            <button
                              onClick={() => onDelete(item.oceanFreightPaymentId)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && items.length > 0 && (
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
