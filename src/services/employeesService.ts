import { api } from './apiClient';
import { Employee, ApiResponse } from '../types/api';

const BASE_PATH = '/api/Employees';

interface EmployeesListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  roleId?: number;
  isActive?: boolean;
}

interface EmployeesListResponse {
  data: Employee[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface EmployeesSummary {
  totalEmployees: number;
  activeEmployees: number;
  totalRoles: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const employeesService = {
  getList: async (params: EmployeesListParams = {}): Promise<EmployeesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.roleId) queryParams.append('roleId', params.roleId.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getAll: async (): Promise<Employee[]> => {
    return api.get<Employee[]>(BASE_PATH);
  },

  getById: async (id: number): Promise<Employee> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  create: async (data: Partial<Employee>): Promise<Employee> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: Partial<Employee>): Promise<Employee> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  checkCodeExists: async (code: string, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ code });
    if (excludeId) params.append('excludeEmployeeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-code?${params.toString()}`);
    return response.data;
  },

  checkEmailExists: async (email: string, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ email });
    if (excludeId) params.append('excludeEmployeeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-email?${params.toString()}`);
    return response.data;
  },

  getSummary: async (): Promise<EmployeesSummary> => {
    const response: any = await api.get(`${BASE_PATH}/summary`);
    const data = response.data || response;
    return {
      totalEmployees: data.totalEmployees || 0,
      activeEmployees: data.activeEmployees || 0,
      totalRoles: data.totalRoles || 0,
      lastUpdatedDate: data.lastUpdatedDate,
      lastUpdatedBy: data.lastUpdatedBy,
      formattedLastUpdated: data.formattedLastUpdated,
    };
  },

  exportExcel: async (params: EmployeesListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.roleId) queryParams.append('roleId', params.roleId.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    return api.get<Blob>(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
  },
};
