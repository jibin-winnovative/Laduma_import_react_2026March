import { api } from './apiClient';
import { ApiResponse } from '../types/api';

const BASE_PATH = '/api/categories';

export interface Category {
  categoryId: number;
  categoryName: string;
  departmentId: number;
  departmentName?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CategoriesListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  departmentId?: number;
}

export interface CategoriesListResponse {
  data: Category[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface CategoriesSummary {
  totalCategories: number;
  activeCategories: number;
  totalDepartments: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const categoriesService = {
  getList: async (params: CategoriesListParams = {}): Promise<CategoriesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.departmentId) queryParams.append('departmentId', params.departmentId.toString());

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getById: async (id: number): Promise<Category> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  getActiveByDepartment: async (departmentId: number): Promise<Category[]> => {
    const response: any = await api.get(`${BASE_PATH}/active?departmentId=${departmentId}`);
    return response.data || response;
  },

  getByDepartment: async (departmentId: number, isActive?: boolean): Promise<Category[]> => {
    const queryParams = new URLSearchParams();
    if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}/by-department/${departmentId}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  create: async (data: Partial<Category>): Promise<Category> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: Partial<Category>): Promise<Category> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  checkNameExists: async (name: string, departmentId: number, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ name, departmentId: departmentId.toString() });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-name?${params.toString()}`);
    return response.data;
  },

  getSummary: async (): Promise<CategoriesSummary> => {
    const response: any = await api.get(`${BASE_PATH}/summary`);
    const data = response.data || response;
    return {
      totalCategories: data.totalCategories || 0,
      activeCategories: data.activeCategories || 0,
      totalDepartments: data.totalDepartments || 0,
      lastUpdatedDate: data.lastUpdatedDate,
      lastUpdatedBy: data.lastUpdatedBy,
      formattedLastUpdated: data.formattedLastUpdated,
    };
  },

  exportExcel: async (params: CategoriesListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.departmentId) queryParams.append('departmentId', params.departmentId.toString());

    const query = queryParams.toString();
    const response = await api.get(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
    return response as any;
  },
};
