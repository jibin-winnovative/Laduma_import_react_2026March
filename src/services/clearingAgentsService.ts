import { api } from './apiClient';
import {
  PaginatedResponse,
  ClearingAgent,
  ClearingAgentSummary,
  CreateClearingAgentRequest,
  UpdateClearingAgentRequest,
  ApiResponse,
} from '../types/api';

export const clearingAgentsService = {
  getAll: async (params: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    isActive?: boolean;
    country?: string;
  }): Promise<PaginatedResponse<ClearingAgent>> => {
    const queryParams = new URLSearchParams();
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.country) queryParams.append('country', params.country);

    const response = await api.get<{ data: PaginatedResponse<ClearingAgent> }>(
      `/api/ClearingAgents?${queryParams.toString()}`
    );
    return response.data;
  },

  getById: async (id: number): Promise<ClearingAgent> => {
    const response = await api.get<{ data: ClearingAgent }>(`/api/ClearingAgents/${id}`);
    return response.data;
  },

  create: async (data: CreateClearingAgentRequest): Promise<ClearingAgent> => {
    const response = await api.post<{ data: ClearingAgent }>('/api/ClearingAgents', data);
    return response.data;
  },

  update: async (id: number, data: UpdateClearingAgentRequest): Promise<ClearingAgent> => {
    const response = await api.put<{ data: ClearingAgent }>(`/api/ClearingAgents/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/ClearingAgents/${id}`);
  },

  getSummary: async (): Promise<ClearingAgentSummary> => {
    const response = await api.get<{ data: ClearingAgentSummary }>('/api/ClearingAgents/summary');
    return response.data;
  },

  getCountries: async (): Promise<string[]> => {
    const response = await api.get<{ data: string[] }>('/api/ClearingAgents/countries');
    return response.data;
  },

  exportToExcel: async (params: {
    searchTerm?: string;
    isActive?: boolean;
    country?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.country) queryParams.append('country', params.country);

    const response = await api.get(`/api/ClearingAgents/export/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response;
  },

  checkCodeExists: async (code: string, excludeId?: number): Promise<boolean> => {
    const queryParams = new URLSearchParams();
    queryParams.append('code', code);
    if (excludeId) queryParams.append('excludeId', excludeId.toString());

    const response = await api.get<ApiResponse<boolean>>(
      `/api/ClearingAgents/check-code?${queryParams.toString()}`
    );
    return response.data;
  },

  checkVatExists: async (vatNumber: string, excludeId?: number): Promise<boolean> => {
    const queryParams = new URLSearchParams();
    queryParams.append('vatNumber', vatNumber);
    if (excludeId) queryParams.append('excludeId', excludeId.toString());

    const response = await api.get<ApiResponse<boolean>>(
      `/api/ClearingAgents/check-vat?${queryParams.toString()}`
    );
    return response.data;
  },

  getDropdown: async (): Promise<Array<{ clearingAgentId: number; agentName: string }>> => {
    const response = await api.get<{ data: Array<{ clearingAgentId: number; agentName: string }> }>(
      '/api/ClearingAgents/dropdown'
    );
    return response.data;
  },
};
