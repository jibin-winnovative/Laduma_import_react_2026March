import { useState, useEffect } from 'react';
import { X, Edit2, Shield } from 'lucide-react';
import { rolesService, Role } from '../../services/rolesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ViewRoleProps {
  roleId: number;
  onClose: () => void;
  onEdit: () => void;
  userPermissions?: string[];
}

export const ViewRole = ({
  roleId,
  onClose,
  onEdit,
  userPermissions = []
}: ViewRoleProps) => {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRole();
  }, [roleId]);

  const fetchRole = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rolesService.getById(roleId);
      setRole(data);
    } catch (err) {
      console.error('Failed to fetch role:', err);
      setError('Failed to load role details');
    } finally {
      setLoading(false);
    }
  };

  const hasEditPermission = () => {
    return (
      userPermissions.includes('Role.Manage') ||
      userPermissions.includes('Employee.Edit')
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 p-8">
          <div className="text-center py-12">
            <p className="text-[var(--color-error)] text-lg mb-4">
              {error || 'No record found'}
            </p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-5xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  Role Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Detailed role profile and permissions
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasEditPermission() && role?.roleName.toLowerCase() !== 'admin' && (
                  <Button
                    onClick={onEdit}
                    className="bg-[var(--color-secondary)] hover:bg-[#E5A804] text-[var(--color-primary)] flex items-center gap-2"
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Role Information
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Role Name
                      </label>
                      <div className="text-lg font-bold text-[var(--color-primary)]">
                        {role.roleName}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Description
                      </label>
                      <div className="text-base text-[var(--color-text)]">
                        {role.description || '-'}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          role.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Record Information
                  </h3>

                  <div className="space-y-4">
                    {role.createdAt && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Created At
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {new Date(role.createdAt).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {role.createdBy && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Created By
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {role.createdBy}
                        </div>
                      </div>
                    )}

                    {role.updatedAt && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Last Updated
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {new Date(role.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {role.updatedBy && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Updated By
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {role.updatedBy}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Role Claims ({role.roleClaims?.length || 0})
                  </h3>

                  {!role.roleClaims || role.roleClaims.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
                      No claims assigned to this role
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {role.roleClaims.map((claim) => (
                        <div key={claim.roleClaimId} className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-[var(--color-primary)]">
                                {claim.claimType}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {claim.claimValue}
                              </div>
                              {claim.description && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {claim.description}
                                </div>
                              )}
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                                claim.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {claim.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
