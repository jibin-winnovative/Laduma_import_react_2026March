import { useState, useEffect } from 'react';
import { Package, Plus, Download, Search, Eye, Edit2, Star } from 'lucide-react';
import { suppliersService, Supplier } from '../../services/suppliersService';
import { portsService, Port } from '../../services/portsService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SupplierForm } from './SupplierForm';
import { ViewSupplier } from './ViewSupplier';

export const SuppliersList = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    averageRating: 0,
    lastUpdatedDate: undefined as string | undefined,
    lastUpdatedBy: '',
    formattedLastUpdated: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchPorts();
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, searchTerm, selectedPort, selectedStatus]);

  const fetchSummary = async () => {
    try {
      const data = await suppliersService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary({
        totalSuppliers: 0,
        activeSuppliers: 0,
        averageRating: 0,
        lastUpdatedDate: undefined,
        lastUpdatedBy: '',
        formattedLastUpdated: '',
      });
    }
  };

  const fetchPorts = async () => {
    try {
      const response = await portsService.getList({ pageSize: 1000, isActive: true });
      setPorts(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch ports:', error);
      setPorts([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersService.getList({
        page: currentPage,
        pageSize,
        search: searchTerm || undefined,
        portId: selectedPort ? parseInt(selectedPort) : undefined,
        isActive: selectedStatus === '' ? undefined : selectedStatus === 'active',
      });
      setSuppliers(response?.data || []);
      setTotalPages(response?.totalPages || 1);
      setTotalRecords(response?.totalRecords || 0);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      setSuppliers([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number) => {
    setSelectedSupplierId(id);
    setShowViewModal(true);
  };

  const handleEdit = (id: number) => {
    setSelectedSupplierId(id);
    setShowEditForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedSupplierId(null);
  };

  const handleSuccess = () => {
    fetchSuppliers();
    fetchSummary();
    handleCloseForm();
  };

  const handleExport = async () => {
    try {
      const blob = await suppliersService.exportExcel({
        search: searchTerm || undefined,
        portId: selectedPort ? parseInt(selectedPort) : undefined,
        isActive: selectedStatus === '' ? undefined : selectedStatus === 'active',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suppliers-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export data');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSuppliers();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedPort('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 8) return 'bg-green-100 text-green-800';
    if (rating >= 6) return 'bg-blue-100 text-blue-800';
    if (rating >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Suppliers</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage supplier master data and payment terms
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExport}
            variant="secondary"
            className="flex items-center gap-2 flex-1 sm:flex-initial"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Supplier</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Suppliers</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalSuppliers}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active Suppliers</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-success)] mt-1">
                {summary.activeSuppliers}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Average Rating</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.averageRating.toFixed(1)}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-secondary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Last Updated</p>
            <p className="text-sm sm:text-base font-semibold text-[var(--color-text)] mt-1">
              {summary.lastUpdatedDate && summary.lastUpdatedDate !== '0001-01-01T00:00:00'
                ? new Date(summary.lastUpdatedDate).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by supplier name or address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Port
              </label>
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="">All Ports</option>
                {ports.map((port) => (
                  <option key={port.portId} value={port.portId}>
                    {port.portName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Social Media Group
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ports
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance Rating
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.supplierId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {supplier.supplierName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {supplier.socialMediaGroupName || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-text)]">
                      {supplier.ports || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRatingBadgeColor(supplier.performanceRating)}`}>
                        {supplier.performanceRating}/10
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {supplier.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(supplier.supplierId)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(supplier.supplierId)}
                          className="p-1 text-[var(--color-primary)] hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && suppliers.length > 0 && (
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

      {showAddForm && (
        <SupplierForm
          mode="add"
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showEditForm && selectedSupplierId && (
        <SupplierForm
          mode="edit"
          supplierId={selectedSupplierId}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showViewModal && selectedSupplierId && (
        <ViewSupplier
          supplierId={selectedSupplierId}
          onClose={() => {
            setShowViewModal(false);
            setSelectedSupplierId(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditForm(true);
          }}
        />
      )}
    </div>
  );
};
