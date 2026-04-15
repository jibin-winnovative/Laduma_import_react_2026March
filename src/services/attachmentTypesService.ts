import { api } from './apiClient';
import { ApiResponse } from '../types/api';

const BASE_PATH = '/api/AttachmentTypes';

export const BELONGS_TO_OPTIONS = [
  'Import Document',
  'Supplier',
  'Payment',
  'Purchase Order',
  'PO Payment',
  'Clearing Payment',
  'Local Payment',
  'Ocean Freight Payment',
] as const;

export type BelongsTo = (typeof BELONGS_TO_OPTIONS)[number];

export interface AttachmentType {
  attachmentTypeId: number;
  type: string;
  belongsTo: string;
  isActive: boolean;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
}

export interface AttachmentTypesListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  belongsTo?: string;
  isActive?: boolean;
}

export interface AttachmentTypesListResponse {
  data: AttachmentType[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AttachmentTypeSummary {
  totalTypes: number;
  activeTypes: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
}

export interface AttachmentTypeDropdownItem {
  id: number;
  name: string;
}

export const attachmentTypesService = {
  getList: async (params: AttachmentTypesListParams = {}): Promise<AttachmentTypesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.belongsTo) queryParams.append('belongsTo', params.belongsTo);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    const responseData = response.data || response;

    return {
      data: responseData.items || responseData.data || [],
      totalRecords: responseData.totalCount || responseData.totalRecords || 0,
      totalPages: responseData.totalPages || Math.ceil((responseData.totalCount || 0) / (params.pageSize || 10)),
      currentPage: responseData.pageNumber || responseData.currentPage || params.page || 1,
      pageSize: responseData.pageSize || params.pageSize || 10,
    };
  },

  getById: async (id: number): Promise<AttachmentType> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  create: async (data: { type: string; belongsTo: string; isActive: boolean }): Promise<AttachmentType> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: { type: string; belongsTo: string; isActive: boolean }): Promise<AttachmentType> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  checkExists: async (type: string, belongsTo: string, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ type, belongsTo });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-exists?${params.toString()}`);
    return response.data;
  },

  getActiveDropdown: async (belongsTo?: string): Promise<AttachmentTypeDropdownItem[]> => {
    const params = belongsTo ? `?belongsTo=${encodeURIComponent(belongsTo)}` : '';
    const response: any = await api.get(`${BASE_PATH}/active${params}`);
    return response.data || response;
  },

  getSummary: async (): Promise<AttachmentTypeSummary> => {
    const response: any = await api.get(`${BASE_PATH}/summary`);
    const data = response.data || response;
    return {
      totalTypes: data.totalTypes || 0,
      activeTypes: data.activeTypes || 0,
      lastUpdatedDate: data.lastUpdatedDate,
      lastUpdatedBy: data.lastUpdatedBy,
    };
  },
};
