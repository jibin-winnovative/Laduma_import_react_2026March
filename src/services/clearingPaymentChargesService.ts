import { api } from './apiClient';

const BASE_PATH = '/api/ClearingPaymentCharges';

export interface ClearingPaymentCharge {
  clearingPaymentChargeId: number;
  chargeName: string;
  description: string;
  vat: number | null;
  isIncludedInCosting: boolean;
  isDuty: boolean;
  isActive: boolean;
  createdDate?: string;
  modifiedDate?: string;
}

export interface ClearingPaymentChargeDto {
  clearingPaymentChargeId?: number;
  chargeName: string;
  description: string;
  vat: number | null;
  isIncludedInCosting: boolean;
  isDuty: boolean;
  isActive: boolean;
}

export interface ClearingPaymentChargesListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
}

export interface ClearingPaymentChargesListResponse {
  data: ClearingPaymentCharge[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const clearingPaymentChargesService = {
  getAll: async (): Promise<ClearingPaymentCharge[]> => {
    const response: any = await api.get(BASE_PATH);
    return response.data || response;
  },

  getList: async (params: ClearingPaymentChargesListParams = {}): Promise<ClearingPaymentChargesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getActive: async (): Promise<ClearingPaymentCharge[]> => {
    const response: any = await api.get(`${BASE_PATH}/active`);
    return response.data || response;
  },

  getById: async (id: number): Promise<ClearingPaymentCharge> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  create: async (data: ClearingPaymentChargeDto): Promise<ClearingPaymentCharge> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: ClearingPaymentChargeDto): Promise<ClearingPaymentCharge> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },
};
