import { api } from './apiClient';
import { ApiResponse } from '../types/api';

const BASE_PATH = '/api/SocialMediaGroups';

export interface SocialMediaGroup {
  socialMediaGroupId: number;
  groupName: string;
  socialMedia: string;
  contactPerson: string;
  contactNo?: string;
  idNumber?: string;
  emailId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SocialMediaGroupsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  socialMedia?: string;
  isActive?: boolean;
}

export interface SocialMediaGroupsListResponse {
  data: SocialMediaGroup[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface SocialMediaGroupsSummary {
  totalGroups: number;
  activeGroups: number;
  totalDistinctContacts: number;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  formattedLastUpdated?: string;
}

export const socialMediaGroupsService = {
  getList: async (params: SocialMediaGroupsListParams = {}): Promise<SocialMediaGroupsListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('pageNumber', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('searchTerm', params.search);
      if (params.socialMedia) queryParams.append('socialMedia', params.socialMedia);
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

  getById: async (id: number): Promise<SocialMediaGroup> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    return response;
  },

  create: async (data: Partial<SocialMediaGroup>): Promise<SocialMediaGroup> => {
    const response: any = await api.post(BASE_PATH, data);
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    return response;
  },

  update: async (id: number, data: Partial<SocialMediaGroup>): Promise<SocialMediaGroup> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    return response;
  },

  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  checkExists: async (groupName: string, socialMedia: string, excludeId?: number): Promise<boolean> => {
    try {
      const params = new URLSearchParams({ groupName, socialMedia });
      if (excludeId) params.append('excludeId', excludeId.toString());
      const response = await api.get<ApiResponse<boolean>>(`${BASE_PATH}/check-exists?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('API Error in checkExists:', error);
      return false;
    }
  },

  getSummary: async (): Promise<SocialMediaGroupsSummary> => {
    try {
      const response: any = await api.get(`${BASE_PATH}/summary`);
      const data = response.data || response;
      return {
        totalGroups: data.totalGroups || 0,
        activeGroups: data.activeGroups || 0,
        totalDistinctContacts: data.totalDistinctContacts || 0,
        lastUpdatedDate: data.lastUpdated,
        lastUpdatedBy: data.lastUpdatedBy,
        formattedLastUpdated: data.formattedLastUpdated,
      };
    } catch (error) {
      console.error('API Error in getSummary:', error);
      return {
        totalGroups: 0,
        activeGroups: 0,
        totalDistinctContacts: 0,
        lastUpdatedDate: undefined,
        lastUpdatedBy: '',
        formattedLastUpdated: '',
      };
    }
  },

  exportExcel: async (params: SocialMediaGroupsListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('searchTerm', params.search);
    if (params.socialMedia) queryParams.append('socialMedia', params.socialMedia);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const response = await api.get(`${BASE_PATH}/export/excel${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
    return response as any;
  },
};
