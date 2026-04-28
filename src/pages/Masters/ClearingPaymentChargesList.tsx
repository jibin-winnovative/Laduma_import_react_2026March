import { useState, useEffect } from 'react';
import { Plus, Search, Eye, CreditCard as Edit2, Receipt, CheckCircle, XCircle } from 'lucide-react';
import { clearingPaymentChargesService, ClearingPaymentCharge } from '../../services/clearingPaymentChargesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ClearingPaymentChargeForm } from './ClearingPaymentChargeForm';
import { ViewClearingPaymentCharge } from './ViewClearingPaymentCharge';

export const ClearingPaymentChargesList = () => {
  const [charges, setCharges] = useState<ClearingPaymentCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalCharges: 0,
    activeCharges: 0,
    inactiveCharges: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [appliedStatus, setAppliedStatus] = useState<string>('');
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
  }, [currentPage, appliedSearchTerm, appliedStatus]);

  const fetchSummary = async () => {
    try {
      const allData = await clearingPaymentChargesService.getAll();
      const total = allData.length;
      const active = allData.filter((c) => c.isActive).length;
      setSummary({
        totalCharges: total,
        activeCharges: active,
        inactiveCharges: total - active,
      });
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary({ totalCharges: 0, activeCharges: 0, inactiveCharges: 0 });
    }
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      const statusParam = appliedStatus === 'active' ? 'Active' : appliedStatus === 'inactive' ? 'Inactive' : 'All';
      const response = await clearingPaymentChargesService.getList({
        page: currentPage,
        pageSize,
        searchTerm: appliedSearchTerm || undefined,
        status: statusParam,
      });

      if (Array.isArray(response)) {
        let filtered = response as ClearingPaymentCharge[];
        if (appliedSearchTerm) {
          const lower = appliedSearchTerm.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.chargeName.toLowerCase().includes(lower) ||
              (c.description && c.description.toLowerCase().includes(lower))
          );
        }
        if (appliedStatus === 'active') {
          filtered = filtered.filter((c) => c.isActive);
        } else if (appliedStatus === 'inactive') {
          filtered = filtered.filter((c) => !c.isActive);
        }
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / pageSize));
        const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        setCharges(paginated);
        setTotalPages(pages);
        setTotalRecords(total);
      } else {
        setCharges(response.data);
        setTotalPages(response.totalPages);
        setTotalRecords(response.totalRecords);
      }
    } catch (error) {
      console.error('Failed to fetch clearing payment charges:', error);
      setCharges([]);
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
    setAppliedSearchTerm(searchTerm);
    setAppliedStatus(selectedStatus);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setAppliedSearchTerm('');
    setAppliedStatus('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Clearing Payment Charges</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage clearing payment charge master data
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Clearing Payment Charge</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Charges</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalCharges}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active Charges</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-success)] mt-1">
                {summary.activeCharges}
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
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Inactive Charges</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">
                {summary.inactiveCharges}
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
                  placeholder="Search by name, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
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
                  Charge Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VAT (%)
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In Costing
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Is Duty
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
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : charges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No clearing payment charges found
                  </td>
                </tr>
              ) : (
                charges.map((item) => (
                  <tr key={item.clearingPaymentChargeId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {item.chargeName}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-text)] max-w-xs truncate">
                      {item.description || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-[var(--color-text)]">
                      {item.vat != null ? `${item.vat}%` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      {item.isIncludedInCosting ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Yes</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      {item.isDuty ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Yes</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No</span>
                      )}
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
                          onClick={() => handleView(item.clearingPaymentChargeId)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item.clearingPaymentChargeId)}
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

        {!loading && charges.length > 0 && (
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
        <ClearingPaymentChargeForm
          mode="add"
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showEditForm && selectedId && (
        <ClearingPaymentChargeForm
          mode="edit"
          clearingPaymentChargeId={selectedId}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showViewModal && selectedId && (
        <ViewClearingPaymentCharge
          clearingPaymentChargeId={selectedId}
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
