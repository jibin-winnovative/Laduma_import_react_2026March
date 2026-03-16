import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Eye, Edit2, Package, CheckCircle, XCircle } from 'lucide-react';
import { shipmentTypesService, ShipmentType } from '../../services/shipmentTypesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ShipmentTypeForm } from './ShipmentTypeForm';
import { ViewShipmentType } from './ViewShipmentType';

export const ShipmentTypesList = () => {
  const [shipmentTypes, setShipmentTypes] = useState<ShipmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalTypes: 0,
    activeTypes: 0,
    inactiveTypes: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchList();
  }, [currentPage, searchTerm, selectedStatus]);

  const fetchSummary = async () => {
    try {
      const allResponse = await shipmentTypesService.getList({ page: 1, pageSize: 1 });
      const activeList = await shipmentTypesService.getActive();
      const total = allResponse.totalRecords || 0;
      const active = activeList.length || 0;
      setSummary({
        totalTypes: total,
        activeTypes: active,
        inactiveTypes: total - active,
      });
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary({ totalTypes: 0, activeTypes: 0, inactiveTypes: 0 });
    }
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await shipmentTypesService.getList({
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        isActive: selectedStatus === '' ? undefined : selectedStatus === 'active',
      });
      setShipmentTypes(response.data);
      setTotalPages(response.totalPages);
      setTotalRecords(response.totalRecords);
    } catch (error) {
      console.error('Failed to fetch shipment types:', error);
      setShipmentTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number) => {
    setSelectedId(id);
    setShowViewModal(true);
  };

  const handleEdit = (id: number) => {
    setSelectedId(id);
    setShowEditForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedId(null);
  };

  const handleSuccess = () => {
    fetchList();
    fetchSummary();
    handleCloseForm();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchList();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Shipment Types</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage shipment type master data
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Shipment Type</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Types</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalTypes}
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
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active Types</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-success)] mt-1">
                {summary.activeTypes}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Inactive Types</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">
                {summary.inactiveTypes}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by code, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
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
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : shipmentTypes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No shipment types found
                  </td>
                </tr>
              ) : (
                shipmentTypes.map((item) => (
                  <tr key={item.shipmentTypeId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {item.shipmentTypeCode}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {item.shipmentTypeName}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-text)] max-w-xs truncate">
                      {item.description || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {item.isActive ? (
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
                          onClick={() => handleView(item.shipmentTypeId)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item.shipmentTypeId)}
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

        {!loading && shipmentTypes.length > 0 && (
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
        <ShipmentTypeForm
          mode="add"
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showEditForm && selectedId && (
        <ShipmentTypeForm
          mode="edit"
          shipmentTypeId={selectedId}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showViewModal && selectedId && (
        <ViewShipmentType
          shipmentTypeId={selectedId}
          onClose={() => {
            setShowViewModal(false);
            setSelectedId(null);
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
