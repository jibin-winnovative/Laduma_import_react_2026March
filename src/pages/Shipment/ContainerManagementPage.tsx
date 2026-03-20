import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Ship, Truck, Archive, Search, Plus, Eye, CreditCard as Edit2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import {
  containersService,
  ContainerDashboard,
  ContainerSearchRequest,
  ContainerListItem,
  StatusChangeRequest,
} from '../../services/containersService';
import { companiesService } from '../../services/companiesService';
import { Company } from '../../types/api';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Confirmed', label: 'Booked' },
  { value: 'InShipment', label: 'In Transit' },
  { value: 'Closed', label: 'Received' },
];

export const ContainerManagementPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<ContainerDashboard>({
    draftCount: 0,
    bookedCount: 0,
    inTransitCount: 0,
    receivedCount: 0,
  });
  const [containers, setContainers] = useState<ContainerListItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState<{
    containerId: number;
    action: 'book' | 'mark-in-transit' | 'mark-received' | 'cancel';
    label: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFormData, setStatusFormData] = useState({
    statusChangeDate: new Date().toISOString().split('T')[0],
    remark: '',
  });

  const [filters, setFilters] = useState<ContainerSearchRequest>({
    companyId: undefined,
    searchText: '',
    status: '',
    fromDate: null,
    toDate: null,
    pageNumber: 1,
    pageSize: 20,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalRecords: 0,
  });

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (initialLoadDone) {
      searchContainers();
    }
  }, [filters.pageNumber]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [dashboardData, companiesData, searchResponse] = await Promise.all([
        containersService.getDashboard(),
        companiesService.getActive(),
        containersService.search(filters),
      ]);
      setDashboard(dashboardData || {
        draftCount: 0,
        bookedCount: 0,
        inTransitCount: 0,
        receivedCount: 0,
      });
      setCompanies(companiesData || []);
      setContainers(searchResponse?.items || []);
      setPagination({
        currentPage: searchResponse?.currentPage || 1,
        pageSize: searchResponse?.pageSize || 20,
        totalPages: searchResponse?.totalPages || 1,
        totalRecords: searchResponse?.totalRecords || 0,
      });
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setDashboard({
        draftCount: 0,
        bookedCount: 0,
        inTransitCount: 0,
        receivedCount: 0,
      });
      setCompanies([]);
      setContainers([]);
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  };

  const searchContainers = async () => {
    setSearching(true);
    try {
      const response = await containersService.search(filters);
      setContainers(response?.items || []);
      setPagination({
        currentPage: response?.currentPage || 1,
        pageSize: response?.pageSize || 20,
        totalPages: response?.totalPages || 1,
        totalRecords: response?.totalRecords || 0,
      });
    } catch (error) {
      console.error('Failed to search containers:', error);
      setContainers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, pageNumber: 1 });
    searchContainers();
  };

  const handleReset = () => {
    setFilters({
      companyId: undefined,
      searchText: '',
      status: '',
      fromDate: null,
      toDate: null,
      pageNumber: 1,
      pageSize: 20,
    });
    setTimeout(() => searchContainers(), 0);
  };

  const openStatusModal = (
    containerId: number,
    action: 'book' | 'mark-in-transit' | 'mark-received' | 'cancel',
    label: string
  ) => {
    setStatusAction({ containerId, action, label });
    setStatusFormData({
      statusChangeDate: new Date().toISOString().split('T')[0],
      remark: '',
    });
    setShowStatusModal(true);
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusAction) return;

    setSubmitting(true);
    try {
      const request: StatusChangeRequest = {
        statusChangeDate: new Date(statusFormData.statusChangeDate).toISOString(),
        remark: statusFormData.remark || undefined,
      };

      switch (statusAction.action) {
        case 'book':
          await containersService.book(statusAction.containerId, request);
          break;
        case 'mark-in-transit':
          await containersService.markInTransit(statusAction.containerId, request);
          break;
        case 'mark-received':
          await containersService.markReceived(statusAction.containerId, request);
          break;
        case 'cancel':
          await containersService.cancel(statusAction.containerId, request);
          break;
      }

      setShowStatusModal(false);
      setStatusAction(null);
      await loadInitialData();
    } catch (error) {
      console.error('Failed to change status:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      Draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
      Confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Booked' },
      InShipment: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'In Transit' },
      Closed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Received' },
      Canceled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Canceled' },
    };

    const config = configs[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCBM = (cbm: number) => {
    return cbm.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Container Management</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Manage shipment containers and PO allocations
          </p>
        </div>
        <Button onClick={() => navigate('/containers/create')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Container
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Draft Containers</p>
              <p className="text-3xl font-bold mt-2">{dashboard.draftCount}</p>
            </div>
            <Package className="w-12 h-12 text-white/50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Booked Containers</p>
              <p className="text-3xl font-bold mt-2">{dashboard.bookedCount}</p>
            </div>
            <Ship className="w-12 h-12 text-white/50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">In Transit</p>
              <p className="text-3xl font-bold mt-2">{dashboard.inTransitCount}</p>
            </div>
            <Truck className="w-12 h-12 text-white/50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Received Containers</p>
              <p className="text-3xl font-bold mt-2">{dashboard.receivedCount}</p>
            </div>
            <Archive className="w-12 h-12 text-white/50" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Search Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Company
            </label>
            <SearchableSelect
              options={companies.map((c) => ({ value: c.companyId.toString(), label: c.companyName }))}
              value={filters.companyId?.toString() || ''}
              onChange={(value) => setFilters({ ...filters, companyId: value ? parseInt(value) : undefined })}
              placeholder="Select Company"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              placeholder="Container, PO, or Supplier"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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
              value={filters.fromDate || ''}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.toDate || ''}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  Container Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipping Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total POs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total CBM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
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
              {searching ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : containers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No containers found
                  </td>
                </tr>
              ) : (
                containers.map((container) => (
                  <tr key={container.containerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {container.containerNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(container.containerDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {container.shippingCompanyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {container.totalPOs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCBM(container.totalCBM)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${formatCurrency(container.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(container.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/containers/view/${container.containerId}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(container.status === 'Draft' || container.status === 'Confirmed') && (
                          <button
                            onClick={() => navigate(`/containers/edit/${container.containerId}`)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {container.status === 'Draft' && (
                          <>
                            <button
                              onClick={() => openStatusModal(container.containerId, 'book', 'Book')}
                              className="text-blue-600 hover:text-blue-900"
                              title="Book"
                            >
                              <Ship className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(container.containerId, 'cancel', 'Cancel')}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {container.status === 'Confirmed' && (
                          <>
                            <button
                              onClick={() => openStatusModal(container.containerId, 'mark-in-transit', 'Mark In Transit')}
                              className="text-orange-600 hover:text-orange-900"
                              title="Mark In Transit"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(container.containerId, 'cancel', 'Cancel')}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {container.status === 'InShipment' && (
                          <button
                            onClick={() => openStatusModal(container.containerId, 'mark-received', 'Mark Received')}
                            className="text-green-600 hover:text-green-900"
                            title="Mark Received"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!searching && containers.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of{' '}
                {pagination.totalRecords} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setFilters({ ...filters, pageNumber: filters.pageNumber - 1 })}
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
                  onClick={() => setFilters({ ...filters, pageNumber: filters.pageNumber + 1 })}
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

      {showStatusModal && statusAction && (
        <Modal
          isOpen={true}
          onClose={() => setShowStatusModal(false)}
          title={statusAction.label}
        >
          <form onSubmit={handleStatusChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Status Change Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={statusFormData.statusChangeDate}
                onChange={(e) => setStatusFormData({ ...statusFormData, statusChangeDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Remark
              </label>
              <textarea
                value={statusFormData.remark}
                onChange={(e) => setStatusFormData({ ...statusFormData, remark: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Optional remark about this status change..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowStatusModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
