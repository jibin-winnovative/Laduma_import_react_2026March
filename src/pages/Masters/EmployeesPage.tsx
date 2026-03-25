import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Eye, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { employeesService } from '../../services/employeesService';
import { rolesService } from '../../services/rolesService';
import { Employee } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmployeeForm } from './EmployeeForm';
import { ViewEmployee } from './ViewEmployee';

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    totalEmployees: number;
    activeEmployees: number;
    totalRoles: number;
    lastUpdated?: string;
  }>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalRoles: 0,
  });
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm, selectedRole, selectedStatus]);

  const fetchSummary = async () => {
    try {
      const data = await employeesService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary({ totalEmployees: 0, activeEmployees: 0, totalRoles: 0 });
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await rolesService.getAll({ isActive: true });
      setRoles(Array.isArray(data) ? data.map((r: any) => ({ id: r.roleId, name: r.roleName })) : []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setRoles([]);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        pageSize,
      };

      if (searchTerm) params.searchTerm = searchTerm;
      if (selectedRole) params.roleId = selectedRole;
      if (selectedStatus !== '') params.isActive = selectedStatus === 'active';

      const response = await employeesService.getList(params);
      setEmployees(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.totalPages || 1);
      setTotalRecords(response.totalRecords || 0);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number) => {
    console.log('View clicked for employee ID:', id);
    setSelectedEmployeeId(id);
    setShowViewModal(true);
  };

  const handleEdit = (id: number) => {
    console.log('Edit clicked for employee ID:', id);
    setSelectedEmployeeId(id);
    setShowEditForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      await employeesService.delete(id);
      fetchEmployees();
      fetchSummary();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Failed to delete employee');
    }
  };

  const handleFormSuccess = () => {
    fetchEmployees();
    fetchSummary();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEmployees();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedRole(undefined);
    setSelectedStatus('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Employees</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage employee master data
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Employee</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Employees</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalEmployees}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active Employees</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-success)] mt-1">
                {summary.activeEmployees}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Roles</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalRoles}
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
              {summary.lastUpdated && summary.lastUpdated !== '0001-01-01T00:00:00'
                ? new Date(summary.lastUpdated).toLocaleString()
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Code, Name, Email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Role
              </label>
              <select
                value={selectedRole || ''}
                onChange={(e) => setSelectedRole(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
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
                className="flex-1"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button onClick={handleReset} variant="secondary" className="flex-1">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No employees found</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-[var(--color-primary)] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Employee Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Contact No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee, index) => (
                    <tr
                      key={employee.employeeId}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[var(--color-primary)]">
                        {employee.employeeCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.roleName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.contactNo || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            employee.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleView(employee.employeeId);
                            }}
                            className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors border border-transparent hover:border-blue-200"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleEdit(employee.employeeId);
                            }}
                            className="inline-flex items-center justify-center p-1.5 text-[var(--color-secondary)] hover:bg-yellow-50 rounded transition-colors border border-transparent hover:border-yellow-200"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDelete(employee.employeeId);
                            }}
                            className="inline-flex items-center justify-center p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors border border-transparent hover:border-red-200"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} employees
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="px-3 py-1 text-sm"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="px-3 py-1 text-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {showAddForm && (
        <EmployeeForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            handleFormSuccess();
          }}
        />
      )}

      {showEditForm && selectedEmployeeId && (
        <>
          {console.log('Rendering EmployeeForm (edit mode) for ID:', selectedEmployeeId)}
          <EmployeeForm
            employeeId={selectedEmployeeId}
            onClose={() => {
              setShowEditForm(false);
              setSelectedEmployeeId(null);
            }}
            onSuccess={() => {
              setShowEditForm(false);
              setSelectedEmployeeId(null);
              handleFormSuccess();
            }}
          />
        </>
      )}

      {showViewModal && selectedEmployeeId && (
        <>
          {console.log('Rendering ViewEmployee modal for ID:', selectedEmployeeId)}
          <ViewEmployee
            employeeId={selectedEmployeeId}
            onClose={() => {
              setShowViewModal(false);
              setSelectedEmployeeId(null);
            }}
            onEdit={() => {
              setShowViewModal(false);
              setShowEditForm(true);
            }}
          />
        </>
      )}
    </div>
  );
};
