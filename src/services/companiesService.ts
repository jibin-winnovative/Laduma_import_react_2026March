import { api } from './apiClient';
import { Company } from '../types/api';

const BASE_PATH = '/api/Companies';

interface CompaniesListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  country?: string;
  isActive?: boolean;
}

interface CompaniesListResponse {
  data: Company[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CompaniesSummary {
  totalCompanies: number;
  activeCompanies: number;
  totalCountries: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const companiesService = {
  getList: async (params: CompaniesListParams = {}): Promise<CompaniesListResponse> => {
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

  getAll: async (): Promise<Company[]> => {
    return api.get<Company[]>(BASE_PATH);
  },

  getById: async (id: number): Promise<Company> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  create: async (data: Partial<Company>): Promise<Company> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: Partial<Company>): Promise<Company> => {
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

  checkRegNoExists: async (regNo: string, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ regNo });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-regno?${params.toString()}`);
    return response.data;
  },

  checkVatNoExists: async (vatNo: string, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ vatNo });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-vatno?${params.toString()}`);
    return response.data;
  },

  checkEmailExists: async (email: string, excludeId?: number): Promise<boolean> => {
    const params = new URLSearchParams({ email });
    if (excludeId) params.append('excludeId', excludeId.toString());
    const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-email?${params.toString()}`);
    return response.data;
  },

  getSummary: async (): Promise<CompaniesSummary> => {
    const response: any = await api.get(`${BASE_PATH}/summary`);
    const data = response.data || response;
    return {
      totalCompanies: data.totalCompanies || 0,
      activeCompanies: data.activeCompanies || 0,
      totalCountries: data.totalCountries || 0,
      lastUpdatedDate: data.lastUpdatedDate,
      lastUpdatedBy: data.lastUpdatedBy,
      formattedLastUpdated: data.formattedLastUpdated,
    };
  },

  exportExcel: async (params: CompaniesListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.country) queryParams.append('country', params.country);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    return api.get<Blob>(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
  },

  getActive: async (): Promise<Company[]> => {
    const response: any = await api.get(`${BASE_PATH}/active`);
    return response.data || response;
  },
};
