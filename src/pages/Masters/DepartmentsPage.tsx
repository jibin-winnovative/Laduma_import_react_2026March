import { useState, useEffect } from 'react';
import { Anchor, Plus, Search, Eye, Edit2 } from 'lucide-react';
import { departmentsService, Department } from '../../services/departmentsService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DepartmentForm } from './DepartmentForm';
import { ViewDepartment } from './ViewDepartment';

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalDepartments: 0,
    activeDepartments: 0,
    inactiveDepartments: 0,
    lastUpdatedDate: undefined as string | undefined,
    lastUpdatedBy: '',
    formattedLastUpdated: '',
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
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [currentPage, searchTerm, selectedStatus]);

  const fetchSummary = async () => {
    try {
      const data = await departmentsService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary({
        totalDepartments: 0,
        activeDepartments: 0,
        inactiveDepartments: 0,
        lastUpdatedDate: undefined,
        lastUpdatedBy: '',
        formattedLastUpdated: '',
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsService.getList({
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        isActive: selectedStatus === '' ? undefined : selectedStatus === 'active',
      });
      setDepartments(response.data);
      setTotalPages(response.totalPages);
      setTotalRecords(response.totalRecords);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number) => {
    setSelectedDepartmentId(id);
    setShowViewModal(true);
  };

  const handleEdit = (id: number) => {
    setSelectedDepartmentId(id);
    setShowEditForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedDepartmentId(null);
  };

  const handleSuccess = () => {
    fetchDepartments();
    fetchSummary();
    handleCloseForm();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDepartments();
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Department Master</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage department master data
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Department</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Departments</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalDepartments}
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
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active Departments</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-success)] mt-1">
                {summary.activeDepartments}
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
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Inactive Departments</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.inactiveDepartments}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-gray-100 rounded-lg">
              <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 sm:p-6 border-b border-[var(--color-border)]">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button onClick={handleSearch} variant="secondary">
                <Search className="w-4 h-4" />
              </Button>
              <Button onClick={handleReset} variant="secondary">
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated At
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
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
                    </div>
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No departments found
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {dept.departmentName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {dept.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {dept.updatedAt ? new Date(dept.updatedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(dept.departmentId)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(dept.departmentId)}
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

        {!loading && totalRecords > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="secondary"
                  className="px-3 py-1"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  className="px-3 py-1"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {showAddForm && (
        <DepartmentForm
          mode="add"
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showEditForm && selectedDepartmentId && (
        <DepartmentForm
          mode="edit"
          departmentId={selectedDepartmentId}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showViewModal && selectedDepartmentId && (
        <ViewDepartment
          departmentId={selectedDepartmentId}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDepartmentId(null);
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
