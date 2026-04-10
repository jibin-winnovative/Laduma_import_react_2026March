import { api } from './apiClient';
import { ApiResponse } from '../types/api';

const BASE_PATH = '/api/Suppliers';

export interface PaymentTerm {
  description: string;
  percentage: number;
}

export interface Supplier {
  supplierId: number;
  supplierName: string;
  address?: string;
  zipCode?: string;
  portIds?: number[];
  ports?: string;
  portList?: Array<{ portId: number; portName: string }>;
  socialMediaGroupId?: number;
  socialMediaGroupName?: string;
  performanceRating: number;
  remarks?: string;
  beneficiaryName?: string;
  beneficiaryAddress?: string;
  beneficiaryBankName?: string;
  beneficiaryBankAddress?: string;
  beneficiaryAccountNo?: string;
  swiftCode?: string;
  bankBranchCode?: string;
  isActive: boolean;
  paymentTerms: PaymentTerm[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SuppliersListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  portId?: number;
  isActive?: boolean;
}

export interface SuppliersListResponse {
  data: Supplier[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface SuppliersSummary {
  totalSuppliers: number;
  activeSuppliers: number;
  averageRating: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const suppliersService = {
  getList: async (params: SuppliersListParams = {}): Promise<SuppliersListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('pageNumber', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('searchTerm', params.search);
      if (params.portId) queryParams.append('portId', params.portId.toString());
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

      const query = queryParams.toString();
      const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);

      const dataWrapper = response.data || response;
      const responseData = Array.isArray(dataWrapper) ? dataWrapper : (dataWrapper.data || []);
      const totalRecords = dataWrapper.totalRecords || responseData.length;

      return {
        data: responseData,
        totalRecords,
        totalPages: dataWrapper.totalPages || Math.ceil(totalRecords / (params.pageSize || 10)),
        currentPage: dataWrapper.currentPage || params.page || 1,
        pageSize: dataWrapper.pageSize || params.pageSize || 10,
      };
    } catch (error) {
      console.error('API Error in getList:', error);
      return {
        data: [],
        totalRecords: 0,
        totalPages: 1,
        currentPage: params.page || 1,
        pageSize: params.pageSize || 10,
      };
    }
  },

  getById: async (id: number): Promise<Supplier> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    return response;
  },

  create: async (data: Partial<Supplier>): Promise<Supplier> => {
    const response: any = await api.post(BASE_PATH, data);
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    return response;
  },

  update: async (id: number, data: Partial<Supplier>): Promise<Supplier> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    return response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  checkExists: async (supplierName: string, portIds: number[], excludeId?: number): Promise<boolean> => {
    try {
      for (const portId of portIds) {
        const params = new URLSearchParams({
          supplierName,
          portId: portId.toString()
        });
        if (excludeId) params.append('excludeId', excludeId.toString());
        const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-exists?${params.toString()}`);
        if (response.data) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('API Error in checkExists:', error);
      return false;
    }
  },

  getSummary: async (): Promise<SuppliersSummary> => {
    try {
      const response: any = await api.get(`${BASE_PATH}/summary`);
      const data = response.data || response;
      return {
        totalSuppliers: data.totalSuppliers || 0,
        activeSuppliers: data.activeSuppliers || 0,
        averageRating: data.averageRating || 0,
        lastUpdatedDate: data.lastUpdated,
        lastUpdatedBy: data.lastUpdatedBy,
        formattedLastUpdated: data.formattedLastUpdated,
      };
    } catch (error) {
      console.error('API Error in getSummary:', error);
      return {
        totalSuppliers: 0,
        activeSuppliers: 0,
        averageRating: 0,
        lastUpdatedDate: undefined,
        lastUpdatedBy: '',
        formattedLastUpdated: '',
      };
    }
  },

  exportExcel: async (params: SuppliersListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('searchTerm', params.search);
    if (params.portId) queryParams.append('portId', params.portId.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response = await api.get(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
    return response as any;
  },

  getAll: async (): Promise<Supplier[]> => {
    try {
      const response: any = await api.get(`${BASE_PATH}`);
      const data = response.data || response;
      return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
      console.error('API Error in getAll:', error);
      return [];
    }
  },

  getDropdown: async (): Promise<Array<{ supplierId: number; supplierName: string }>> => {
    try {
      const response: any = await api.get(`${BASE_PATH}/dropdown`);
      return response.data || response;
    } catch (error) {
      console.error('API Error in getDropdown:', error);
      return [];
    }
  },

  getPaymentTerms: async (supplierId: number): Promise<any> => {
    try {
      const response: any = await api.get(`${BASE_PATH}/${supplierId}/payment-terms`);
      return response;
    } catch (error) {
      console.error('API Error in getPaymentTerms:', error);
      return { data: { paymentTerms: [] } };
    }
  },

  getTopPort: async (supplierId: number): Promise<{ portId: number; portName: string } | null> => {
    try {
      const response: any = await api.get(`${BASE_PATH}/${supplierId}/top-port`);
      const data = response.data || response;
      if (data?.portId) return { portId: data.portId, portName: data.portName };
      return null;
    } catch {
      return null;
    }
  },
};
