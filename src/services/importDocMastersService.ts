import { api } from './apiClient';

const BASE_PATH = '/api/ImportDocMasters';

export interface ImportDocMaster {
  importDocMasterId: number;
  typeName: string;
  docNumber: string;
  description?: string;
  categoryDeclaration: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  product?: string;
  modelNo?: string;
  referenceNumber?: string;
  issueDate?: string;
  remarks?: string;
  issuedTo?: string;
  levyPeriod?: string;
  accountNo?: string;
  dateOfFiling?: string;
  paymentDate?: string;
}

export interface ImportDocMastersListParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  category?: string;
  isActive?: boolean;
}

export interface ImportDocMastersListResponse {
  data: ImportDocMaster[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface ImportDocMastersSummary {
  totalDocuments: number;
  activeDocuments: number;
  totalCategories: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const importDocMastersService = {
  getList: async (params: ImportDocMastersListParams = {}): Promise<ImportDocMastersListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.category) queryParams.append('category', params.category);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getById: async (id: number): Promise<ImportDocMaster> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    console.log('🔍 ImportDocMasters API raw response:', response);
    const data = response.data || response;
    console.log('📦 ImportDocMasters extracted data:', data);
    return data;
  },

  create: async (data: Partial<ImportDocMaster>): Promise<ImportDocMaster> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data || response;
  },

  update: async (id: number, data: Partial<ImportDocMaster>): Promise<ImportDocMaster> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data || response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  getSummary: async (): Promise<ImportDocMastersSummary> => {
    const response: any = await api.get(`${BASE_PATH}/summary`);
    const data = response.data || response;
    return {
      totalDocuments: data.totalDocuments || 0,
      activeDocuments: data.activeDocuments || 0,
      totalCategories: data.totalCategories || 0,
      lastUpdatedDate: data.lastUpdatedDate,
      lastUpdatedBy: data.lastUpdatedBy,
      formattedLastUpdated: data.formattedLastUpdated,
    };
  },

  exportExcel: async (params: ImportDocMastersListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.category) queryParams.append('category', params.category);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response = await api.get(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
    return response as any;
  },
};
