import { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  ChevronDown,
  ChevronRight,
  Save,
  Search,
  ChevronsDown,
  ChevronsUp,
  CheckSquare,
  Square,
  MinusSquare,
  X,
} from 'lucide-react';
import { permissionsService } from '../../services/permissionsService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ClaimWithSelection {
  key: string;
  label: string;
  selected: boolean;
}

interface PermissionGroupWithSelection {
  module: string;
  claims: ClaimWithSelection[];
  isExpanded: boolean;
}

interface ClaimSettingsProps {
  roleId: number;
  roleName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClaimSettings = ({ roleId, roleName, onClose, onSuccess }: ClaimSettingsProps) => {
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroupWithSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPermissions();
  }, [roleId]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const [allClaims, roleClaimKeys] = await Promise.all([
        permissionsService.getAll(),
        permissionsService.getRoleClaimKeys(roleId),
      ]);

      const groupsWithSelection: PermissionGroupWithSelection[] = allClaims.map((group) => ({
        module: group.module,
        claims: group.claims.map((claim) => ({
          ...claim,
          selected: roleClaimKeys.includes(claim.key),
        })),
        isExpanded: true,
      }));

      setPermissionGroups(groupsWithSelection);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      alert('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleClaim = (moduleIndex: number, claimIndex: number) => {
    setPermissionGroups((prev) =>
      prev.map((group, gIdx) => {
        if (gIdx === moduleIndex) {
          return {
            ...group,
            claims: group.claims.map((claim, cIdx) =>
              cIdx === claimIndex ? { ...claim, selected: !claim.selected } : claim
            ),
          };
        }
        return group;
      })
    );
  };

  const toggleModule = (moduleIndex: number) => {
    setPermissionGroups((prev) =>
      prev.map((group, idx) => {
        if (idx === moduleIndex) {
          return {
            ...group,
            isExpanded: !group.isExpanded,
          };
        }
        return group;
      })
    );
  };

  const selectAllInModule = (moduleIndex: number, selectAll: boolean) => {
    setPermissionGroups((prev) =>
      prev.map((group, idx) => {
        if (idx === moduleIndex) {
          return {
            ...group,
            claims: group.claims.map((claim) => ({ ...claim, selected: selectAll })),
          };
        }
        return group;
      })
    );
  };

  const expandAll = () => {
    setPermissionGroups((prev) => prev.map((group) => ({ ...group, isExpanded: true })));
  };

  const collapseAll = () => {
    setPermissionGroups((prev) => prev.map((group) => ({ ...group, isExpanded: false })));
  };

  const selectAllClaims = () => {
    setPermissionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        claims: group.claims.map((claim) => ({ ...claim, selected: true })),
      }))
    );
  };

  const deselectAllClaims = () => {
    setPermissionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        claims: group.claims.map((claim) => ({ ...claim, selected: false })),
      }))
    );
  };

  const handleSave = async () => {
    const selectedClaimKeys = permissionGroups.flatMap((group) =>
      group.claims.filter((claim) => claim.selected).map((claim) => claim.key)
    );

    setSaving(true);
    try {
      await permissionsService.saveRoleClaims(roleId, selectedClaimKeys);
      alert('Role claims saved successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save claims:', error);
      alert('Failed to save role claims');
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return permissionGroups;

    return permissionGroups
      .map((group) => ({
        ...group,
        claims: group.claims.filter(
          (claim) =>
            claim.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.key.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((group) => group.claims.length > 0);
  }, [permissionGroups, searchTerm]);

  const totalClaims = permissionGroups.reduce((sum, group) => sum + group.claims.length, 0);
  const totalSelected = permissionGroups.reduce(
    (sum, group) => sum + group.claims.filter((c) => c.selected).length,
    0
  );

  const getModuleSelectionState = (group: PermissionGroupWithSelection) => {
    const selectedCount = group.claims.filter((c) => c.selected).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === group.claims.length) return 'all';
    return 'partial';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] lg:max-w-6xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div
            className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0"
            style={{ backgroundColor: '#1B3A57' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Manage Claims for Role
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Role: <span className="font-semibold">{roleName}</span>
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

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          ) : (
            <>
              <div className="overflow-y-auto flex-1" style={{ backgroundColor: '#F9FAFB' }}>
                <div className="p-4 sm:p-6 space-y-4">
                  <Card className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="text-xl font-bold text-[var(--color-primary)]">{totalClaims}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                        <p className="text-xs text-gray-600">Selected</p>
                        <p className="text-xl font-bold text-green-700">{totalSelected}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                        <p className="text-xs text-gray-600">Modules</p>
                        <p className="text-xl font-bold text-purple-700">{permissionGroups.length}</p>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
                        <p className="text-xs text-gray-600">Coverage</p>
                        <p className="text-xl font-bold text-[var(--color-secondary)]">
                          {totalClaims > 0 ? Math.round((totalSelected / totalClaims) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex flex-col lg:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search claims..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button onClick={expandAll} variant="secondary" className="flex items-center gap-1 text-xs px-2 py-1.5">
                          <ChevronsDown className="w-3 h-3" />
                          <span className="hidden sm:inline">Expand</span>
                        </Button>
                        <Button onClick={collapseAll} variant="secondary" className="flex items-center gap-1 text-xs px-2 py-1.5">
                          <ChevronsUp className="w-3 h-3" />
                          <span className="hidden sm:inline">Collapse</span>
                        </Button>
                        <Button
                          onClick={selectAllClaims}
                          className="flex items-center gap-1 text-xs px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span className="hidden sm:inline">All</span>
                        </Button>
                        <Button
                          onClick={deselectAllClaims}
                          className="flex items-center gap-1 text-xs px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Square className="w-3 h-3" />
                          <span className="hidden sm:inline">None</span>
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-3">
                    {filteredGroups.map((group) => {
                      const originalIndex = permissionGroups.findIndex((g) => g.module === group.module);
                      const selectionState = getModuleSelectionState(group);
                      const selectedCount = group.claims.filter((c) => c.selected).length;

                      return (
                        <Card key={group.module} className="overflow-hidden">
                          <div
                            className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            style={{ backgroundColor: group.isExpanded ? '#F9FAFB' : 'white' }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div
                                className="flex items-center gap-2 flex-1"
                                onClick={() => toggleModule(originalIndex)}
                              >
                                {group.isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-[var(--color-primary)]" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                                <h3 className="text-sm sm:text-base font-semibold text-[var(--color-primary)]">
                                  {group.module}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  ({selectedCount}/{group.claims.length})
                                </span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAllInModule(originalIndex, selectionState !== 'all');
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                              >
                                {selectionState === 'all' ? (
                                  <CheckSquare className="w-4 h-4 text-green-600" />
                                ) : selectionState === 'partial' ? (
                                  <MinusSquare className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-400" />
                                )}
                                <span className="text-xs font-medium text-gray-700 hidden sm:inline">
                                  {selectionState === 'all' ? 'Deselect' : 'Select'}
                                </span>
                              </button>
                            </div>
                          </div>

                          {group.isExpanded && (
                            <div className="border-t border-gray-200 p-3 sm:p-4 bg-white">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {group.claims.map((claim) => {
                                  const originalClaimIndex = permissionGroups[originalIndex].claims.findIndex(
                                    (c) => c.key === claim.key
                                  );
                                  return (
                                    <label
                                      key={claim.key}
                                      className={`flex items-start gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                                        claim.selected
                                          ? 'border-[var(--color-primary)] bg-blue-50'
                                          : 'border-gray-200 hover:border-gray-300 bg-white'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={claim.selected}
                                        onChange={() => toggleClaim(originalIndex, originalClaimIndex)}
                                        className="w-4 h-4 mt-0.5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-gray-900">{claim.label}</div>
                                        <div className="text-xs text-gray-500 truncate">{claim.key}</div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>

                  {filteredGroups.length === 0 && (
                    <Card className="p-8 text-center">
                      <p className="text-gray-500">No claims found matching your search</p>
                    </Card>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-300 px-4 sm:px-6 py-3 bg-white flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-gray-600">
                    <span className="font-semibold text-[var(--color-primary)]">{totalSelected}</span> of{' '}
                    <span className="font-semibold">{totalClaims}</span> claims selected
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={onClose}
                      variant="secondary"
                      disabled={saving}
                      className="flex-1 sm:flex-initial"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[var(--color-primary)] hover:opacity-90 text-white flex items-center gap-2 flex-1 sm:flex-initial"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Claims'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
