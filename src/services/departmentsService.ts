import { api } from './apiClient';
import { ApiResponse } from '../types/api';

const BASE_PATH = '/api/Departments';

export interface Department {
  departmentId: number;
  departmentName: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface DepartmentsListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
}

export interface DepartmentsListResponse {
  data: Department[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface DepartmentsSummary {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const departmentsService = {
  getList: async (params: DepartmentsListParams = {}): Promise<DepartmentsListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getActive: async (): Promise<Department[]> => {
    const response: any = await api.get(`${BASE_PATH}/active`);
    return response.data || response;
  },

  getById: async (id: number): Promise<Department> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  create: async (data: Partial<Department>): Promise<Department> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: Partial<Department>): Promise<Department> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  checkNameExists: async (name: string, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ name });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-name?${params.toString()}`);
    return response.data;
  },

  getSummary: async (): Promise<DepartmentsSummary> => {
    const response: any = await api.get(`${BASE_PATH}/summary`);
    const data = response.data || response;
    return {
      totalDepartments: data.totalDepartments || 0,
      activeDepartments: data.activeDepartments || 0,
      inactiveDepartments: data.inactiveDepartments || 0,
      lastUpdatedDate: data.lastUpdatedDate,
      lastUpdatedBy: data.lastUpdatedBy,
      formattedLastUpdated: data.formattedLastUpdated,
    };
  },

  exportExcel: async (params: DepartmentsListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response = await api.get(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
    return response as any;
  },
};
