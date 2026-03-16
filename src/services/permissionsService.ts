import { api } from './apiClient';

export interface Claim {
  key: string;
  label: string;
  selected?: boolean;
}

export interface PermissionGroup {
  module: string;
  claims: Claim[];
}

export interface AllClaimsResponse {
  success: boolean;
  message: string;
  data: PermissionGroup[];
}

export interface RoleClaimBulkItem {
  claimType: string;
  claimValue: string;
}

export interface BulkSaveRoleClaimsRequest {
  claims: RoleClaimBulkItem[];
}

export const permissionsService = {
  getAll: async (): Promise<PermissionGroup[]> => {
    const response: any = await api.get('/api/Roles/claims/all');
    const data = response.data || response;

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  },

  getRoleClaimKeys: async (roleId: number): Promise<string[]> => {
    try {
      const response: any = await api.get(`/api/Roles/${roleId}/claims`);
      const claims = response.data || response;

      if (Array.isArray(claims)) {
        return claims
          .filter((claim: any) => claim.isActive)
          .map((claim: any) => claim.claimType);
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch role claims:', error);
      return [];
    }
  },

  saveRoleClaims: async (roleId: number, claimKeys: string[]): Promise<void> => {
    const payload: BulkSaveRoleClaimsRequest = {
      claims: claimKeys.map((claimType) => ({
        claimType,
        claimValue: 'true',
      })),
    };
    await api.post(`/api/Roles/${roleId}/claims/bulk`, payload);
  },
};
