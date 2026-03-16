import { api } from './apiClient';
import { ApiResponse } from '../types/api';

const BASE_PATH = '/api/producttypes';

export interface ProductType {
  typeId: number;
  typeName: string;
  categoryId: number;
  categoryName?: string;
  departmentId?: number;
  departmentName?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ProductTypesListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  categoryId?: number;
  departmentId?: number;
  status?: string;
}

export interface ProductTypesListResponse {
  data: ProductType[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface ProductTypesSummary {
  totalProductTypes: number;
  activeProductTypes: number;
  totalCategories: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const productTypesService = {
  getList: async (params: ProductTypesListParams = {}): Promise<ProductTypesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.departmentId) queryParams.append('departmentId', params.departmentId.toString());
    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getById: async (id: number): Promise<ProductType> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  getActiveByCategory: async (categoryId: number): Promise<ProductType[]> => {
    const response: any = await api.get(`${BASE_PATH}/active?categoryId=${categoryId}`);
    return response.data || response;
  },

  getByCategory: async (categoryId: number, isActive?: boolean): Promise<ProductType[]> => {
    const queryParams = new URLSearchParams();
    if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}/by-category/${categoryId}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  create: async (data: Partial<ProductType>): Promise<ProductType> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: Partial<ProductType>): Promise<ProductType> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  checkNameExists: async (name: string, categoryId: number, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ name, categoryId: categoryId.toString() });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-name?${params.toString()}`);
    return response.data;
  },

  getSummary: async (): Promise<ProductTypesSummary> => {
    const response: any = await api.get(`${BASE_PATH}/summary`);
    const data = response.data || response;
    return {
      totalProductTypes: data.totalTypes || 0,
      activeProductTypes: data.activeTypes || 0,
      totalCategories: data.totalCategories || 0,
      lastUpdatedDate: data.lastUpdatedDate,
      lastUpdatedBy: data.lastUpdatedBy,
      formattedLastUpdated: data.formattedLastUpdated,
    };
  },

  exportExcel: async (params: ProductTypesListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.departmentId) queryParams.append('departmentId', params.departmentId.toString());

    const query = queryParams.toString();
    const response = await api.get(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
    return response as any;
  },
};
