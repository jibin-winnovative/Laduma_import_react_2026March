import { api } from './apiClient';
import { ApiResponse } from '../types/api';

const BASE_PATH = '/api/subtypes';

export interface SubType {
  subTypeId: number;
  subTypeName: string;
  typeId: number;
  typeName?: string;
  categoryId?: number;
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

export interface SubTypesListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  productTypeId?: number;
  categoryId?: number;
  departmentId?: number;
}

export interface SubTypesListResponse {
  data: SubType[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface SubTypesSummary {
  totalSubTypes: number;
  activeSubTypes: number;
  totalProductTypes: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const subTypesService = {
  getList: async (params: SubTypesListParams = {}): Promise<SubTypesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.productTypeId) queryParams.append('productTypeId', params.productTypeId.toString());
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.departmentId) queryParams.append('departmentId', params.departmentId.toString());
    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getById: async (id: number): Promise<SubType> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  getActiveByProductType: async (typeId: number): Promise<SubType[]> => {
    const response: any = await api.get(`${BASE_PATH}/active?typeId=${typeId}`);
    return response.data || response;
  },

  getByProductType: async (typeId: number, isActive?: boolean): Promise<SubType[]> => {
    const queryParams = new URLSearchParams();
    if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}/by-producttype/${typeId}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  create: async (data: Partial<SubType>): Promise<SubType> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: Partial<SubType>): Promise<SubType> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  checkNameExists: async (name: string, typeId: number, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ name, typeId: typeId.toString() });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-name?${params.toString()}`);
    return response.data;
  },

  getSummary: async (): Promise<SubTypesSummary> => {
    const response: any = await api.get(`${BASE_PATH}/summary`);
    const data = response.data || response;
    return {
      totalSubTypes: data.totalSubTypes || 0,
      activeSubTypes: data.activeSubTypes || 0,
      totalProductTypes: data.totalProductTypes || 0,
      lastUpdatedDate: data.lastUpdatedDate,
      lastUpdatedBy: data.lastUpdatedBy,
      formattedLastUpdated: data.formattedLastUpdated,
    };
  },

  exportExcel: async (params: SubTypesListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.productTypeId) queryParams.append('productTypeId', params.productTypeId.toString());
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.departmentId) queryParams.append('departmentId', params.departmentId.toString());

    const query = queryParams.toString();
    const response = await api.get(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
    return response as any;
  },
};
