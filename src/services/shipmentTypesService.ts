import { api } from './apiClient';

const BASE_PATH = '/api/ShipmentTypes';

export interface ShipmentType {
  shipmentTypeId: number;
  shipmentTypeCode: string;
  shipmentTypeName: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ShipmentTypesListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
}

export interface ShipmentTypesListResponse {
  data: ShipmentType[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface CreateShipmentTypeRequest {
  shipmentTypeCode: string;
  shipmentTypeName: string;
  description?: string | null;
}

export interface UpdateShipmentTypeRequest {
  shipmentTypeName: string;
  description?: string | null;
  isActive: boolean;
}

export const shipmentTypesService = {
  getList: async (params: ShipmentTypesListParams = {}): Promise<ShipmentTypesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getById: async (id: number): Promise<ShipmentType> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data || response;
  },

  getActive: async (): Promise<ShipmentType[]> => {
    const response: any = await api.get(`${BASE_PATH}/active`);
    return response.data || response;
  },

  create: async (data: CreateShipmentTypeRequest): Promise<ShipmentType> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: UpdateShipmentTypeRequest): Promise<ShipmentType> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },
};
