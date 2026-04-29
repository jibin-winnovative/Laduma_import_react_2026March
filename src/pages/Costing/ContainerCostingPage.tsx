import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  FolderOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  containerCostingsService,
  ContainerCostingListRow,
} from '../../services/containerCostingsService';

const COSTING_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Not Created', label: 'Not Created' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Requested', label: 'Requested' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Approved', label: 'Approved' },
];

const COSTING_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Actual', label: 'Actual' },
  { value: 'Custom', label: 'Custom' },
];

const getCostingStatusBadge = (status: ContainerCostingListRow['costingStatus']) => {
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    'Not Created': {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      icon: <FileText className="w-3 h-3" />,
    },
    Draft: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: <Clock className="w-3 h-3" />,
    },
    Requested: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      icon: <AlertCircle className="w-3 h-3" />,
    },
    Rejected: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: <XCircle className="w-3 h-3" />,
    },
    Approved: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: <CheckCircle className="w-3 h-3" />,
    },
  };
  const cfg = map[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', icon: null };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.icon}
      {status}
    </span>
  );
};

const formatDate = (val: string | null): string => {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleDateString();
  } catch {
    return val;
  }
};

const formatDateTime = (val: string | null): string => {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleString();
  } catch {
    return val;
  }
};

export const ContainerCostingPage = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<ContainerCostingListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<number | null>(null);

  const [searchText, setSearchText] = useState('');
  const [costingStatus, setCostingStatus] = useState('');
  const [costingType, setCostingType] = useState('');

  const [appliedSearchText, setAppliedSearchText] = useState('');
  const [appliedCostingStatus, setAppliedCostingStatus] = useState('');
  const [appliedCostingType, setAppliedCostingType] = useState('');

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalRecords: 0,
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchList = async (page = pagination.currentPage) => {
    setLoading(true);
    try {
      const res = await containerCostingsService.getList({
        searchText: appliedSearchText || undefined,
        costingStatus: appliedCostingStatus || undefined,
        costingType: appliedCostingType || undefined,
        pageNumber: page,
        pageSize: pagination.pageSize,
      });
      setRows(res.data ?? []);
      setPagination({
        currentPage: res.currentPage,
        pageSize: res.pageSize,
        totalPages: res.totalPages,
        totalRecords: res.totalRecords,
      });
    } catch (err) {
      console.error('Failed to load container costings:', err);
      setRows([]);
      showToast('Failed to load container costings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1);
  }, [appliedSearchText, appliedCostingStatus, appliedCostingType]);

  const handleSearch = () => {
    setAppliedSearchText(searchText);
    setAppliedCostingStatus(costingStatus);
    setAppliedCostingType(costingType);
  };

  const handleReset = () => {
    setSearchText('');
    setCostingStatus('');
    setCostingType('');
    setAppliedSearchText('');
    setAppliedCostingStatus('');
    setAppliedCostingType('');
  };

  const handlePageChange = (page: number) => {
    fetchList(page);
  };

  const handleCreateCosting = async (row: ContainerCostingListRow) => {
    setCreatingId(row.containerId);
    try {
      const res = await containerCostingsService.initialize(row.containerId);
      const newId = res?.containerCostingId;
      if (newId) {
        showToast('Costing created successfully.', 'success');
        navigate(`/costing/container-costing/${newId}`);
      } else {
        showToast('Costing created successfully.', 'success');
        await fetchList(pagination.currentPage);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create costing.';
      showToast(msg, 'error');
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Container Costing
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage costing for imported containers
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Search by container no..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Costing Status
            </label>
            <select
              value={costingStatus}
              onChange={(e) => setCostingStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm"
            >
              {COSTING_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Costing Type
            </label>
            <select
              value={costingType}
              onChange={(e) => setCostingType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm"
            >
              {COSTING_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Container No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ETA
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costing Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costing Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-primary)]" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500 text-sm">
                    No container costing records found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={`${row.containerId}-${row.containerCostingId ?? 'none'}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {row.containerNo}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {formatDate(row.eta)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-[var(--color-text)]">
                      {row.poCount}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {getCostingStatusBadge(row.costingStatus)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {row.costingType ?? '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {formatDateTime(row.lastUpdated)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {row.costingStatus === 'Not Created' ? (
                        <Button
                          onClick={() => handleCreateCosting(row)}
                          disabled={creatingId === row.containerId}
                          className="flex items-center gap-1.5 bg-[var(--color-primary)] hover:opacity-90 text-white text-xs px-3 py-1.5"
                        >
                          {creatingId === row.containerId ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          Create Costing
                        </Button>
                      ) : row.containerCostingId != null ? (
                        <Button
                          onClick={() =>
                            navigate(`/costing/container-costing/${row.containerCostingId}`)
                          }
                          className="flex items-center gap-1.5 bg-[var(--color-secondary)] hover:opacity-90 text-[var(--color-primary)] text-xs px-3 py-1.5"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Open Costing
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing{' '}
                {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)}{' '}
                of {pagination.totalRecords} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
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
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
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
    </div>
  );
};
