import { api } from './apiClient';

const BASE_PATH = '/api/AddonCharges';

export interface AddonCharge {
  addonChargeId: number;
  chargeName: string;
  description: string;
  isActive: boolean;
  createdDate?: string;
  modifiedDate?: string;
}

export interface AddonChargeDto {
  addonChargeId?: number;
  chargeName: string;
  description: string;
  isActive: boolean;
}

export interface AddonChargesListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
}

export interface AddonChargesListResponse {
  data: AddonCharge[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const addonChargesService = {
  getAll: async (): Promise<AddonCharge[]> => {
    const response: any = await api.get(BASE_PATH);
    return response.data || response;
  },

  getList: async (params: AddonChargesListParams = {}): Promise<AddonChargesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getActive: async (): Promise<AddonCharge[]> => {
    const response: any = await api.get(`${BASE_PATH}/active`);
    return response.data || response;
  },

  getById: async (id: number): Promise<AddonCharge> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  create: async (data: AddonChargeDto): Promise<AddonCharge> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: AddonChargeDto): Promise<AddonCharge> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },
};
