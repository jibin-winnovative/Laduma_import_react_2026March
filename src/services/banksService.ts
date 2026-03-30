import { api } from './apiClient';
import {
  PaginatedResponse,
  Bank,
  BankSummary,
  ApiResponse,
} from '../types/api';

export const banksService = {
  getAll: async (params: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Bank>> => {
    const queryParams = new URLSearchParams();
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const response = await api.get<{ data: PaginatedResponse<Bank> }>(
      `/api/Banks?${queryParams.toString()}`
    );
    return response.data;
  },

  getActive: async (): Promise<Array<{ bankId: number; name: string; accountNumber: string }>> => {
    const response = await api.get<{ data: Array<{ bankId: number; name: string; accountNumber: string }> }>(
      '/api/Banks/active'
    );
    return response.data;
  },

  getById: async (id: number): Promise<Bank> => {
    const response = await api.get<{ data: Bank }>(`/api/Banks/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    accountNumber: string;
    branchCode?: string;
    branch?: string;
    address?: string;
    contactNumber?: string;
    isActive: boolean;
  }): Promise<Bank> => {
    const response = await api.post<{ data: Bank }>('/api/Banks', data);
    return response.data;
  },

  update: async (
    id: number,
    data: {
      name: string;
      accountNumber: string;
      branchCode?: string;
      branch?: string;
      address?: string;
      contactNumber?: string;
      isActive: boolean;
    }
  ): Promise<Bank> => {
    const response = await api.put<{ data: Bank }>(`/api/Banks/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/Banks/${id}`);
  },

  getSummary: async (): Promise<BankSummary> => {
    const response = await api.get<{ data: BankSummary }>('/api/Banks/summary');
    return response.data;
  },

  checkAccountNumberExists: async (accountNumber: string, excludeId?: number): Promise<boolean> => {
    const queryParams = new URLSearchParams();
    queryParams.append('accountNumber', accountNumber);
    if (excludeId) queryParams.append('excludeId', excludeId.toString());

    const response = await api.get<ApiResponse<boolean>>(
      `/api/Banks/check-account-number?${queryParams.toString()}`
    );
    return response.data;
  },
};
