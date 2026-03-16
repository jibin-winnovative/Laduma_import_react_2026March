import { api } from './apiClient';

const BASE_PATH = '/api/Roles';

export interface RoleClaim {
  roleClaimId: number;
  roleId: number;
  claimType: string;
  claimValue: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  roleId: number;
  roleName: string;
  description?: string;
  isActive: boolean;
  roleClaims?: RoleClaim[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface RolesListParams {
  isActive?: boolean;
  searchTerm?: string;
}

export const rolesService = {
  getAll: async (params: RolesListParams = {}): Promise<Role[]> => {
    const queryParams = new URLSearchParams();
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getById: async (id: number): Promise<Role> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  create: async (data: Partial<Role>): Promise<Role> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: Partial<Role>): Promise<Role> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  getClaims: async (roleId: number): Promise<RoleClaim[]> => {
    const response: any = await api.get(`${BASE_PATH}/${roleId}/claims`);
    return response.data || response;
  },

  createClaim: async (data: Partial<RoleClaim>): Promise<RoleClaim> => {
    const response: any = await api.post(`${BASE_PATH}/claims`, data);
    return response.data || response;
  },

  updateClaim: async (id: number, data: Partial<RoleClaim>): Promise<RoleClaim> => {
    const response: any = await api.put(`${BASE_PATH}/claims/${id}`, data);
    return response.data || response;
  },

  deleteClaim: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/claims/${id}`);
  },

  checkRoleNameExists: async (roleName: string, excludeId?: number): Promise<boolean> => {
    try {
      const roles = await rolesService.getAll();
      return roles.some(
        (role) =>
          role.roleName.toLowerCase() === roleName.toLowerCase() &&
          role.roleId !== excludeId
      );
    } catch (error) {
      console.error('Failed to check role name:', error);
      return false;
    }
  },
};
