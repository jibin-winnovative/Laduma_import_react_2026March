import { api } from './apiClient';

const BASE_PATH = '/api/Currency';

export interface Currency {
  currencyId: number;
  currencyCode: string;
  country: string;
  conversionRate: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CurrencyListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
}

export interface CurrencyListResponse {
  data: Currency[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface CreateCurrencyRequest {
  currencyCode: string;
  country: string;
  conversionRate: number;
}

export interface UpdateCurrencyRequest {
  country: string;
  conversionRate: number;
  isActive: boolean;
}

export const currencyService = {
  getList: async (params: CurrencyListParams = {}): Promise<CurrencyListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getById: async (id: number): Promise<Currency> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  getActive: async (): Promise<Currency[]> => {
    const response: any = await api.get(`${BASE_PATH}/active`);
    return response.data || response;
  },

  create: async (data: CreateCurrencyRequest): Promise<Currency> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: UpdateCurrencyRequest): Promise<Currency> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },
};
