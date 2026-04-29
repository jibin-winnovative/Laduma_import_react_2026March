import { api } from './apiClient';

const BASE_PATH = '/api/ContainerCostings';

export type ContainerCostingListRow = {
  containerId: number;
  containerCostingId: number | null;
  containerNo: string;
  eta: string | null;
  poCount: number;
  costingStatus: 'Not Created' | 'Draft' | 'Requested' | 'Rejected' | 'Approved';
  costingType: 'Actual' | 'Custom' | null;
  lastUpdated: string | null;
};

export interface ContainerCostingListParams {
  searchText?: string;
  costingStatus?: string;
  costingType?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ContainerCostingListResponse {
  data: ContainerCostingListRow[];
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface InitializeResponse {
  containerCostingId?: number;
  [key: string]: unknown;
}

export const containerCostingsService = {
  getList: async (params: ContainerCostingListParams = {}): Promise<ContainerCostingListResponse> => {
    const q = new URLSearchParams();
    if (params.searchText) q.append('searchText', params.searchText);
    if (params.costingStatus) q.append('costingStatus', params.costingStatus);
    if (params.costingType) q.append('costingType', params.costingType);
    q.append('pageNumber', String(params.pageNumber ?? 1));
    q.append('pageSize', String(params.pageSize ?? 20));

    const response: any = await api.get(`${BASE_PATH}?${q.toString()}`);
    const body = response.data ?? response;
    // Handle wrapped { success, data: { data, currentPage, ... } }
    if (body?.data && Array.isArray(body.data.data)) return body.data;
    if (body?.data && Array.isArray(body.data)) return body;
    return body;
  },

  initialize: async (containerId: number): Promise<InitializeResponse> => {
    const response: any = await api.post(`${BASE_PATH}/container/${containerId}/initialize`, {});
    return response.data ?? response;
  },
};
