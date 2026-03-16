import { useState, useEffect } from 'react';
import { Shield, Plus, Eye, Edit2, Settings } from 'lucide-react';
import { rolesService, Role } from '../../services/rolesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { RoleForm } from './RoleForm';
import { ViewRole } from './ViewRole';
import { RoleClaimsForm } from './RoleClaimsForm';

export const RolesList = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showClaimsForm, setShowClaimsForm] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState<string>('');

  useEffect(() => {
    fetchRoles();
  }, [selectedStatus]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await rolesService.getAll({
        isActive: selectedStatus === '' ? undefined : selectedStatus === 'active',
      });
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number) => {
    setSelectedRoleId(id);
    setShowViewModal(true);
  };

  const handleEdit = (id: number, roleName: string) => {
    // Prevent editing Admin role
    if (roleName.toLowerCase() === 'admin') {
      alert('Admin role cannot be edited');
      return;
    }
    setSelectedRoleId(id);
    setShowEditForm(true);
  };

  const handleManageClaims = (id: number, roleName: string) => {
    setSelectedRoleId(id);
    setSelectedRoleName(roleName);
    setShowClaimsForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedRoleId(null);
  };

  const handleCloseClaimsForm = () => {
    setShowClaimsForm(false);
    setSelectedRoleId(null);
    setSelectedRoleName('');
  };

  const handleSuccess = () => {
    fetchRoles();
    handleCloseForm();
  };

  const filteredRoles = roles.filter((role) =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRoles = roles.length;
  const activeRoles = roles.filter(r => r.isActive).length;
  const totalClaims = roles.reduce((sum, role) => sum + (role.roleClaims?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Roles Management</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage system roles and view permissions
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Role</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Roles</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {totalRoles}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active Roles</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-success)] mt-1">
                {activeRoles}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Claims</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {totalClaims}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-secondary)]" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
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

          <div className="flex items-end">
            <Button
              onClick={() => { setSearchTerm(''); setSelectedStatus(''); }}
              variant="secondary"
              className="w-full"
            >
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claims Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
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
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No roles found
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.roleId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--color-primary)]" />
                        {role.roleName}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-text)]">
                      {role.description || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {role.roleClaims?.length || 0} claims
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {role.isActive ? (
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
                      {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(role.roleId)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {role.roleName.toLowerCase() !== 'admin' && (
                          <button
                            onClick={() => handleEdit(role.roleId, role.roleName)}
                            className="p-1 text-[var(--color-primary)] hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleManageClaims(role.roleId, role.roleName)}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Manage Claims"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddForm && (
        <RoleForm
          mode="add"
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showEditForm && selectedRoleId && (
        <RoleForm
          mode="edit"
          roleId={selectedRoleId}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showViewModal && selectedRoleId && (
        <ViewRole
          roleId={selectedRoleId}
          onClose={() => {
            setShowViewModal(false);
            setSelectedRoleId(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditForm(true);
          }}
        />
      )}

      {showClaimsForm && selectedRoleId && (
        <RoleClaimsForm
          roleId={selectedRoleId}
          roleName={selectedRoleName}
          onClose={handleCloseClaimsForm}
          onSuccess={fetchRoles}
        />
      )}
    </div>
  );
};
