import { useState, useEffect } from 'react';
import { Anchor, Plus, Search, Filter, Eye, CreditCard as Edit2 } from 'lucide-react';
import { portsService, Port } from '../../services/portsService';
import { mastersService } from '../../services/mastersService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PortForm } from './PortForm';
import { ViewPort } from './ViewPort';

export const PortsList = () => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalPorts: 0,
    activePorts: 0,
    totalPortTypes: 0,
    lastUpdatedDate: undefined as string | undefined,
    lastUpdatedBy: '',
    formattedLastUpdated: '',
  });
  const [countries, setCountries] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPortId, setSelectedCompanyId] = useState<number | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [currentPage, searchTerm, selectedCountry, selectedStatus]);

  const fetchSummary = async () => {
    try {
      const data = await portsService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary({
        totalPorts: 0,
        activePorts: 0,
        totalPortTypes: 0,
        lastUpdatedDate: undefined,
        lastUpdatedBy: '',
        formattedLastUpdated: '',
      });
    }
  };

  const fetchCountries = async () => {
    try {
      const data = await mastersService.getCountries();
      setCountries(data);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await portsService.getList({
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        country: selectedCountry || undefined,
        isActive: selectedStatus === '' ? undefined : selectedStatus === 'active',
      });
      setPorts(response.data);
      setTotalPages(response.totalPages);
      setTotalRecords(response.totalRecords);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      setPorts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number) => {
    setSelectedCompanyId(id);
    setShowViewModal(true);
  };

  const handleEdit = (id: number) => {
    setSelectedCompanyId(id);
    setShowEditForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedCompanyId(null);
  };

  const handleSuccess = () => {
    fetchCompanies();
    fetchSummary();
    handleCloseForm();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCompanies();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCountry('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Ports</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage ports master data
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Port</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Ports</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalPorts}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active Ports</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-success)] mt-1">
                {summary.activePorts}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Port Types</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalPortTypes}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
              <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-secondary)]" />
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
                  placeholder="Search by code, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
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
                  Port Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Port Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Port Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Port Direction
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Number
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
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : ports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No ports found
                  </td>
                </tr>
              ) : (
                ports.map((port) => (
                  <tr key={port.portId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {port.portCode}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {port.portName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {port.country}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {port.region || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {port.portType || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {port.portDirection === 'Import' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Import
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Export
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {port.contactNumber || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {port.isActive ? (
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
                          onClick={() => handleView(port.portId)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(port.portId)}
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

        {!loading && ports.length > 0 && (
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
        <PortForm
          mode="add"
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showEditForm && selectedPortId && (
        <PortForm
          mode="edit"
          portId={selectedPortId}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showViewModal && selectedPortId && (
        <ViewPort
          portId={selectedPortId}
          onClose={() => {
            setShowViewModal(false);
            setSelectedCompanyId(null);
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
