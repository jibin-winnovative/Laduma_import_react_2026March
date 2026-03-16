import { api } from './apiClient';
import { ApiResponse } from '../types/api';

const BASE_PATH = '/api/Ports';

export interface Port {
  portId: number;
  portCode: string;
  portName: string;
  country: string;
  region?: string;
  portType?: string;
  portDirection: string;
  description?: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  remarks?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PortsListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  country?: string;
  portType?: string;
  isActive?: boolean;
}

export interface PortsListResponse {
  data: Port[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface PortsSummary {
  totalPorts: number;
  activePorts: number;
  totalCountries: number;
  totalPortTypes: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const portsService = {
  getList: async (params: PortsListParams = {}): Promise<PortsListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.country) queryParams.append('country', params.country);
    if (params.portType) queryParams.append('portType', params.portType);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getById: async (id: number): Promise<Port> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  create: async (data: Partial<Port>): Promise<Port> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: Partial<Port>): Promise<Port> => {
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

  getSummary: async (): Promise<PortsSummary> => {
    const response: any = await api.get(`${BASE_PATH}/summary`);
    const data = response.data || response;
    return {
      totalPorts: data.totalPorts || 0,
      activePorts: data.activePorts || 0,
      totalCountries: data.totalCountries || 0,
      totalPortTypes: data.totalPortTypes || 0,
      lastUpdatedDate: data.lastUpdatedDate,
      lastUpdatedBy: data.lastUpdatedBy,
      formattedLastUpdated: data.formattedLastUpdated,
    };
  },

  exportExcel: async (params: PortsListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.country) queryParams.append('country', params.country);
    if (params.portType) queryParams.append('portType', params.portType);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response = await api.get(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
    return response as any;
  },

  getByDirection: async (portDirection: 'Import' | 'Export'): Promise<Port[]> => {
    const response: any = await api.get(`${BASE_PATH}/direction/${portDirection}`);
    return response.data || response;
  },
};
