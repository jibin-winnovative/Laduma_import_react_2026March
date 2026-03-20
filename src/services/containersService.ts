import apiClient from './apiClient';

export interface ContainerDashboard {
  draftCount: number;
  bookedCount: number;
  inTransitCount: number;
  receivedCount: number;
}

export interface ContainerSearchRequest {
  companyId?: number;
  searchText?: string;
  status?: string;
  fromDate?: string | null;
  toDate?: string | null;
  pageNumber: number;
  pageSize: number;
}

export interface ContainerListItem {
  containerId: number;
  containerNumber: string;
  containerDate: string;
  shippingCompanyName: string;
  totalPOs: number;
  totalCBM: number;
  totalAmount: number;
  status: string;
}

export interface ContainerSearchApiResponse {
  data: Array<{
    id: number;
    containerNumber: string;
    containerDate: string;
    shippingCompanyName: string;
    totalPOs: number;
    totalCBM: number;
    totalAmount: number;
    status: string;
  }>;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ContainerSearchResponse {
  items: ContainerListItem[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface ContainerItem {
  purchaseOrderItemId: number;
  productId: number;
  loadedQty: number;
  price: number;
  cbm: number;
  extraFreight: number;
}

export interface ContainerPO {
  purchaseOrderId: number;
  items: ContainerItem[];
}

export interface CreateContainerRequest {
  containerNumber: string;
  containerDate: string;
  shippingCompanyId: number;
  oceanFreightCompanyId: number;
  etd: string;
  eta: string;
  status: string;
  pOs: ContainerPO[];
}

export interface UpdateContainerRequest extends CreateContainerRequest {
  containerId: number;
}

export interface ContainerDetails {
  containerId: number;
  containerNumber: string;
  containerDate: string;
  shippingCompanyId: number;
  shippingCompanyName: string;
  oceanFreightCompanyId: number;
  oceanFreightCompanyName: string;
  etd: string;
  eta: string;
  status: string;
  pOs: ContainerPODetails[];
  totalPOs: number;
  totalCBM: number;
  totalAmount: number;
}

export interface ContainerPODetails {
  purchaseOrderId: number;
  poNumber: string;
  poDate: string;
  supplierName: string;
  totalAmount: number;
  items: ContainerItemDetails[];
}

export interface ContainerItemDetails {
  containerItemId: number;
  purchaseOrderItemId: number;
  productId: number;
  productName: string;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  loadedQty: number;
  price: number;
  cbm: number;
  extraFreight: number;
  amount: number;
  totalCBM: number;
  uom: string;
}

export interface POForSelection {
  purchaseOrderId: number;
  poNumber: string;
  supplierName: string;
  poAmount: number;
  totalCBM: number;
}

export interface POItemForAllocation {
  purchaseOrderItemId: number;
  productId: number;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  loadedQty: number;
  remainingQty: number;
  loadQty: number;
  uom: string;
  price: number;
  cbm: number;
  amount: number;
  extraFreight: number;
  totalCBM: number;
}

export interface ClearingAgentInfo {
  clearingAgentId: number;
  companyName: string;
}

export interface OceanFreightCompanyInfo {
  oceanFreightCompanyId: number;
  oceanFreightCompanyName: string;
}

export interface ClearingPaymentStatus {
  containerId: number;
  hasClearingPayment: boolean;
  clearingPaymentId: number | null;
  status: string | null;
}

export interface OceanFreightPaymentStatus {
  containerId: number;
  hasOceanFreightPayment: boolean;
  oceanFreightPaymentId: number | null;
  status: string | null;
}

export interface StatusChangeRequest {
  statusChangeDate: string;
  remark?: string;
}

export interface StatusChangeResponse {
  containerId: number;
  status: string;
  statusChangeDate: string;
  remark?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ContainerStatusHistory {
  containerStatusHistoryId: number;
  fromStatus: string;
  toStatus: string;
  statusChangeDate: string;
  remark?: string;
  changedBy: string;
  createdAt: string;
}

export const containersService = {
  getDashboard: async (): Promise<ContainerDashboard> => {
    const response = await apiClient.get<ContainerDashboard>('/api/containers/dashboard');
    return response.data;
  },

  search: async (request: ContainerSearchRequest): Promise<ContainerSearchResponse> => {
    const response = await apiClient.post<ContainerSearchApiResponse>('/api/containers/search', request);
    const apiData = response.data;
    return {
      items: (apiData.data || []).map((item) => ({
        containerId: item.id,
        containerNumber: item.containerNumber,
        containerDate: item.containerDate,
        shippingCompanyName: item.shippingCompanyName,
        totalPOs: item.totalPOs,
        totalCBM: item.totalCBM,
        totalAmount: item.totalAmount,
        status: item.status,
      })),
      currentPage: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.totalPages,
      totalRecords: apiData.totalRecords,
    };
  },

  getById: async (id: number): Promise<ContainerDetails> => {
    const response = await apiClient.get<ContainerDetails>(`/api/containers/${id}`);
    return response.data;
  },

  create: async (request: CreateContainerRequest): Promise<void> => {
    await apiClient.post('/api/containers', request);
  },

  update: async (id: number, request: UpdateContainerRequest): Promise<void> => {
    await apiClient.put(`/api/containers/${id}`, request);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/containers/${id}`);
  },

  getAvailablePOs: async (): Promise<POForSelection[]> => {
    const response = await apiClient.get<POForSelection[]>('/api/containers/available-pos');
    return response.data;
  },

  getPOItems: async (poId: number): Promise<POItemForAllocation[]> => {
    const response = await apiClient.get<POItemForAllocation[]>(`/api/PurchaseOrders/${poId}/items`);
    return response.data;
  },

  getClearingAgents: async (containerId: number): Promise<ClearingAgentInfo[]> => {
    const response = await apiClient.get<ClearingAgentInfo[]>(`/api/containers/${containerId}/clearing-agents`);
    return response.data;
  },

  getOceanFreightCompany: async (containerId: number): Promise<OceanFreightCompanyInfo> => {
    const response = await apiClient.get<OceanFreightCompanyInfo>(`/api/containers/${containerId}/ocean-freight-company`);
    return response.data;
  },

  getClearingPaymentStatus: async (containerId: number): Promise<ClearingPaymentStatus> => {
    const response = await apiClient.get<ClearingPaymentStatus>(`/api/containers/${containerId}/clearing-payment-status`);
    return response.data;
  },

  getOceanFreightPaymentStatus: async (containerId: number): Promise<OceanFreightPaymentStatus> => {
    const response = await apiClient.get<OceanFreightPaymentStatus>(`/api/containers/${containerId}/ocean-freight-payment-status`);
    return response.data;
  },

  book: async (id: number, request: StatusChangeRequest): Promise<StatusChangeResponse> => {
    const response = await apiClient.post<StatusChangeResponse>(`/api/containers/${id}/book`, request);
    return response.data;
  },

  markInTransit: async (id: number, request: StatusChangeRequest): Promise<StatusChangeResponse> => {
    const response = await apiClient.post<StatusChangeResponse>(`/api/containers/${id}/mark-in-transit`, request);
    return response.data;
  },

  markReceived: async (id: number, request: StatusChangeRequest): Promise<StatusChangeResponse> => {
    const response = await apiClient.post<StatusChangeResponse>(`/api/containers/${id}/mark-received`, request);
    return response.data;
  },

  cancel: async (id: number, request: StatusChangeRequest): Promise<StatusChangeResponse> => {
    const response = await apiClient.post<StatusChangeResponse>(`/api/containers/${id}/cancel`, request);
    return response.data;
  },

  getStatusHistory: async (id: number): Promise<ContainerStatusHistory[]> => {
    const response = await apiClient.get<ContainerStatusHistory[]>(`/api/containers/${id}/status-history`);
    return response.data;
  },
};
