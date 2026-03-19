import { useState, useEffect } from 'react';
import { Eye, Pencil, Trash2, Plus, Search, File as FileEdit, CheckCheck, DollarSign, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MultiSelect } from '../../components/ui/MultiSelect';
import {
  localPaymentsService,
  LocalPaymentListItem,
  LocalPaymentDashboard,
  LocalPaymentSearchRequest,
} from '../../services/localPaymentsService';

interface LocalPaymentListProps {
  onAdd: () => void;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}

export const LocalPaymentList = ({ onAdd, onEdit, onView, onDelete }: LocalPaymentListProps) => {
  const [items, setItems] = useState<LocalPaymentListItem[]>([]);
  const [dashboard, setDashboard] = useState<LocalPaymentDashboard>({
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
  const [paymentNature, setPaymentNature] = useState('');
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

  const [appliedFilters, setAppliedFilters] = useState<LocalPaymentSearchRequest>({
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
      const data = await localPaymentsService.getDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await localPaymentsService.search({
        ...appliedFilters,
        pageNumber: currentPage,
        pageSize,
      });
      setItems(response.data || []);
      setTotalRecords(response.totalRecords || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch local payments:', err);
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
      paymentNature: paymentNature || undefined,
      statuses: statuses.length > 0 ? statuses : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      pageNumber: 1,
      pageSize,
    });
  };

  const handleReset = () => {
    setContainerNumber('');
    setPaymentNature('');
    setStatuses(['Pending', 'Requested', 'Approved', 'Rejected']);
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
    setAppliedFilters({
      statuses: ['Pending', 'Requested', 'Approved', 'Rejected'],
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
        return { icon: CheckCheck, color: 'text-green-700', badge: 'bg-green-100 text-green-800' };
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Local Payments</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage local payment records</p>
        </div>
        <Button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Local Payment</span>
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

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-text)]">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Container Number
            </label>
            <input
              type="text"
              value={containerNumber}
              onChange={(e) => setContainerNumber(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)]"
              placeholder="Enter container number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Payment Nature
            </label>
            <input
              type="text"
              value={paymentNature}
              onChange={(e) => setPaymentNature(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)]"
              placeholder="Enter payment nature"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Status
            </label>
            <MultiSelect
              options={statusOptions}
              value={statuses}
              onChange={setStatuses}
              placeholder="Select statuses"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)]"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSearch} className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left p-4 font-semibold text-[var(--color-text)]">Container Number</th>
                <th className="text-left p-4 font-semibold text-[var(--color-text)]">Payment Nature</th>
                <th className="text-left p-4 font-semibold text-[var(--color-text)]">Company</th>
                <th className="text-right p-4 font-semibold text-[var(--color-text)]">Amount</th>
                <th className="text-left p-4 font-semibold text-[var(--color-text)]">Payment Date</th>
                <th className="text-left p-4 font-semibold text-[var(--color-text)]">Status</th>
                <th className="text-center p-4 font-semibold text-[var(--color-text)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-[var(--color-text-secondary)]">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-[var(--color-text-secondary)]">
                    No local payments found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const statusCfg = getStatusConfig(item.status);
                  return (
                    <tr
                      key={item.localPaymentId}
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <td className="p-4 text-[var(--color-text)]">{item.containerNumber}</td>
                      <td className="p-4 text-[var(--color-text)]">{item.paymentNature}</td>
                      <td className="p-4 text-[var(--color-text)]">{item.companyName || '-'}</td>
                      <td className="p-4 text-right text-[var(--color-text)]">
                        {formatAmount(item.amountIncl)}
                      </td>
                      <td className="p-4 text-[var(--color-text)]">{formatDate(item.paymentDate)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.badge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(item.localPaymentId)}
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item.localPaymentId)}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(item.localPaymentId)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--color-border)]">
            <div className="text-sm text-[var(--color-text-secondary)]">
              Showing {items.length} of {totalRecords} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-[var(--color-text)]">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
