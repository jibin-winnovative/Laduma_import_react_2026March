import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { rolesService, RoleClaim } from '../../services/rolesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface RoleClaimsFormProps {
  roleId: number;
  roleName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ClaimDefinition {
  claimType: string;
  claimValue: string;
  description: string;
}

interface ClaimGroup {
  groupName: string;
  claims: ClaimDefinition[];
}

const CLAIM_GROUPS: ClaimGroup[] = [
  {
    groupName: 'Role Management',
    claims: [
      { claimType: 'Role.View', claimValue: 'View', description: 'View roles' },
      { claimType: 'Role.Create', claimValue: 'Create', description: 'Create new roles' },
      { claimType: 'Role.Edit', claimValue: 'Edit', description: 'Edit existing roles' },
      { claimType: 'Role.Delete', claimValue: 'Delete', description: 'Delete roles' },
      { claimType: 'Role.ManageClaims', claimValue: 'ManageClaims', description: 'Manage role claims' },
    ],
  },
  {
    groupName: 'Employee Management',
    claims: [
      { claimType: 'Employee.View', claimValue: 'View', description: 'View employees' },
      { claimType: 'Employee.Create', claimValue: 'Create', description: 'Create new employees' },
      { claimType: 'Employee.Edit', claimValue: 'Edit', description: 'Edit employee details' },
      { claimType: 'Employee.Delete', claimValue: 'Delete', description: 'Delete employees' },
    ],
  },
  {
    groupName: 'Company Management',
    claims: [
      { claimType: 'Company.View', claimValue: 'View', description: 'View companies' },
      { claimType: 'Company.Create', claimValue: 'Create', description: 'Create new companies' },
      { claimType: 'Company.Update', claimValue: 'Update', description: 'Update company details' },
      { claimType: 'Company.Delete', claimValue: 'Delete', description: 'Delete companies' },
    ],
  },
  {
    groupName: 'Port Management',
    claims: [
      { claimType: 'Port.View', claimValue: 'View', description: 'View ports' },
      { claimType: 'Port.Create', claimValue: 'Create', description: 'Create new ports' },
      { claimType: 'Port.Update', claimValue: 'Update', description: 'Update port details' },
      { claimType: 'Port.Delete', claimValue: 'Delete', description: 'Delete ports' },
    ],
  },
  {
    groupName: 'Import Documents',
    claims: [
      { claimType: 'Import.View', claimValue: 'View', description: 'View import documents' },
      { claimType: 'Import.Create', claimValue: 'Create', description: 'Create import documents' },
      { claimType: 'Import.Update', claimValue: 'Update', description: 'Update import documents' },
      { claimType: 'Import.Delete', claimValue: 'Delete', description: 'Delete import documents' },
    ],
  },
  {
    groupName: 'Shipping Companies',
    claims: [
      { claimType: 'ShippingCompany.View', claimValue: 'View', description: 'View shipping companies' },
      { claimType: 'ShippingCompany.Create', claimValue: 'Create', description: 'Create shipping companies' },
      { claimType: 'ShippingCompany.Update', claimValue: 'Update', description: 'Update shipping companies' },
      { claimType: 'ShippingCompany.Delete', claimValue: 'Delete', description: 'Delete shipping companies' },
    ],
  },
  {
    groupName: 'Clearing Agents',
    claims: [
      { claimType: 'ClearingAgent.View', claimValue: 'View', description: 'View clearing agents' },
      { claimType: 'ClearingAgent.Create', claimValue: 'Create', description: 'Create clearing agents' },
      { claimType: 'ClearingAgent.Update', claimValue: 'Update', description: 'Update clearing agents' },
      { claimType: 'ClearingAgent.Delete', claimValue: 'Delete', description: 'Delete clearing agents' },
    ],
  },
  {
    groupName: 'Ocean Freight Companies',
    claims: [
      { claimType: 'OceanFreight.View', claimValue: 'View', description: 'View ocean freight companies' },
      { claimType: 'OceanFreight.Create', claimValue: 'Create', description: 'Create ocean freight companies' },
      { claimType: 'OceanFreight.Update', claimValue: 'Update', description: 'Update ocean freight companies' },
      { claimType: 'OceanFreight.Delete', claimValue: 'Delete', description: 'Delete ocean freight companies' },
    ],
  },
  {
    groupName: 'Local Transport Companies',
    claims: [
      { claimType: 'LocalTransport.View', claimValue: 'View', description: 'View local transport companies' },
      { claimType: 'LocalTransport.Create', claimValue: 'Create', description: 'Create local transport companies' },
      { claimType: 'LocalTransport.Update', claimValue: 'Update', description: 'Update local transport companies' },
      { claimType: 'LocalTransport.Delete', claimValue: 'Delete', description: 'Delete local transport companies' },
    ],
  },
  {
    groupName: 'Reports',
    claims: [
      { claimType: 'Report.View', claimValue: 'View', description: 'View reports' },
      { claimType: 'Report.Generate', claimValue: 'Generate', description: 'Generate reports' },
      { claimType: 'Report.Export', claimValue: 'Export', description: 'Export reports' },
    ],
  },
];

export const RoleClaimsForm = ({ roleId, roleName, onClose, onSuccess }: RoleClaimsFormProps) => {
  const [existingClaims, setExistingClaims] = useState<RoleClaim[]>([]);
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, [roleId]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await rolesService.getClaims(roleId);
      setExistingClaims(data);

      const selected = new Set<string>();
      data.forEach((claim) => {
        selected.add(`${claim.claimType}|${claim.claimValue}`);
      });
      setSelectedClaims(selected);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleClaim = (claimType: string, claimValue: string) => {
    const key = `${claimType}|${claimValue}`;
    const newSelected = new Set(selectedClaims);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }

    setSelectedClaims(newSelected);
  };

  const getSelectedCountForGroup = (group: ClaimGroup): number => {
    return group.claims.filter((claim) =>
      selectedClaims.has(`${claim.claimType}|${claim.claimValue}`)
    ).length;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const claimsToAdd: ClaimDefinition[] = [];
      const claimsToRemove: number[] = [];

      CLAIM_GROUPS.forEach((group) => {
        group.claims.forEach((claim) => {
          const key = `${claim.claimType}|${claim.claimValue}`;
          const isSelected = selectedClaims.has(key);
          const existingClaim = existingClaims.find(
            (ec) => ec.claimType === claim.claimType && ec.claimValue === claim.claimValue
          );

          if (isSelected && !existingClaim) {
            claimsToAdd.push(claim);
          } else if (!isSelected && existingClaim) {
            claimsToRemove.push(existingClaim.roleClaimId);
          }
        });
      });

      for (const claim of claimsToAdd) {
        await rolesService.createClaim({
          roleId,
          claimType: claim.claimType,
          claimValue: claim.claimValue,
          description: claim.description,
          isActive: true,
        });
      }

      for (const claimId of claimsToRemove) {
        await rolesService.deleteClaim(claimId);
      }

      alert('Claims updated successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save claims:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save claims';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-4xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  Manage Role Claims
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Configure permissions for role: <span className="font-semibold">{roleName}</span>
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="secondary"
                className="bg-gray-600 hover:bg-gray-700 text-white flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-4 sm:p-6 md:p-8" style={{ backgroundColor: '#F9FAFB' }}>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto"></div>
              </div>
            ) : (
              <>
                <Card className="p-4 sm:p-6 mb-4 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">Total Claims Selected</h3>
                      <p className="text-3xl font-bold text-[var(--color-primary)]">
                        {selectedClaims.size}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        out of{' '}
                        <span className="font-semibold text-gray-800">
                          {CLAIM_GROUPS.reduce((acc, group) => acc + group.claims.length, 0)}
                        </span>{' '}
                        available
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="space-y-3">
                  {CLAIM_GROUPS.map((group) => {
                    const isExpanded = expandedGroups.has(group.groupName);
                    const selectedCount = getSelectedCountForGroup(group);
                    const totalCount = group.claims.length;

                    return (
                      <Card key={group.groupName} className="overflow-hidden border border-gray-200">
                        <button
                          onClick={() => toggleGroup(group.groupName)}
                          className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <h3 className="text-base sm:text-lg font-semibold text-[var(--color-text)]">
                                {group.groupName}
                              </h3>
                            </div>
                            <div className="flex-shrink-0">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedCount > 0
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {selectedCount}/{totalCount}
                              </span>
                            </div>
                          </div>
                        </button>

                        <div
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="px-4 sm:px-6 pb-4 border-t border-gray-200 bg-white">
                            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {group.claims.map((claim) => {
                                const key = `${claim.claimType}|${claim.claimValue}`;
                                const isSelected = selectedClaims.has(key);

                                return (
                                  <button
                                    key={key}
                                    onClick={() => toggleClaim(claim.claimType, claim.claimValue)}
                                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                                      isSelected
                                        ? 'border-[var(--color-primary)] bg-blue-50 shadow-md'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <span className="text-sm font-semibold text-[var(--color-text)] flex-1">
                                        {claim.claimType}
                                      </span>
                                      {isSelected && (
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                          <svg
                                            className="w-3 h-3 text-white"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="3"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path d="M5 13l4 4L19 7" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mb-2">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        {claim.claimValue}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                      {claim.description}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-gray-300 px-4 sm:px-6 md:px-8 py-4 bg-white flex-shrink-0">
            <div className="flex justify-end gap-3">
              <Button onClick={onClose} variant="secondary" disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[var(--color-primary)] hover:opacity-90 text-white flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
