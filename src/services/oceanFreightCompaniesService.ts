import { api } from './apiClient';
import { ApiResponse } from '../types/api';

const BASE_PATH = '/api/OceanFreightCompanies';

export interface OceanFreightCompany {
  oceanFreightCompanyId: number;
  code: string;
  companyName: string;
  serviceType: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  country: string;
  address?: string;
  faxNumber?: string;
  website?: string;
  alternateContactPerson?: string;
  alternateEmail?: string;
  alternatePhoneNumber?: string;
  remarks?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface OceanFreightCompaniesListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  country?: string;
  isActive?: boolean;
}

export interface OceanFreightCompaniesListResponse {
  data: OceanFreightCompany[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface OceanFreightCompaniesSummary {
  totalFreightCompanies: number;
  activeFreightCompanies: number;
  totalCountries: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const oceanFreightCompaniesService = {
  getList: async (params: OceanFreightCompaniesListParams = {}): Promise<OceanFreightCompaniesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.country) queryParams.append('country', params.country);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getById: async (id: number): Promise<OceanFreightCompany> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  create: async (data: Partial<OceanFreightCompany>): Promise<OceanFreightCompany> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: Partial<OceanFreightCompany>): Promise<OceanFreightCompany> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  checkCodeExists: async (code: string, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ code });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-code?${params.toString()}`);
    return response.data;
  },

  checkNameExists: async (name: string, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ name });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-name?${params.toString()}`);
    return response.data;
  },

  checkEmailExists: async (email: string, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ email });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-email?${params.toString()}`);
    return response.data;
  },

  getSummary: async (): Promise<OceanFreightCompaniesSummary> => {
    const response: any = await api.get(`${BASE_PATH}/summary`);
    const data = response.data || response;
    return {
      totalFreightCompanies: data.totalFreightCompanies || 0,
      activeFreightCompanies: data.activeFreightCompanies || 0,
      totalCountries: data.totalCountries || 0,
      lastUpdatedDate: data.lastUpdatedDate,
      lastUpdatedBy: data.lastUpdatedBy,
      formattedLastUpdated: data.formattedLastUpdated,
    };
  },

  exportExcel: async (params: OceanFreightCompaniesListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.country) queryParams.append('country', params.country);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response = await api.get(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
    return response as any;
  },

  getActive: async (): Promise<OceanFreightCompany[]> => {
    const response: any = await api.get(`${BASE_PATH}/active`);
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },
};
