import apiClient from './apiClient';

const BASE = '/api/clearing-payments';

export interface ClearingPaymentDashboard {
  draftCount: number;
  completedCount: number;
}

export interface ClearingPaymentSearchRequest {
  containerNumber?: string;
  clearingAgent?: string;
  status?: string;
  fromDate?: string | null;
  toDate?: string | null;
  pageNumber: number;
  pageSize: number;
}

export interface ClearingPaymentListItem {
  clearingPaymentId: number;
  containerNumber: string;
  clearingAgentName: string;
  paymentDate: string;
  clearingAmount: number;
  status: string;
}

export interface ClearingPaymentSearchResponse {
  data: ClearingPaymentListItem[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface ClearingPaymentChargeLine {
  chargeLineId?: number;
  clearingPaymentChargeId: number;
  clearingPaymentChargeName?: string;
  amountExcl: number;
  vat: number;
  amountIncl: number;
}

export interface ClearingPaymentPO {
  clearingPaymentPoId?: number;
  purchaseOrderId: number;
  poNumber?: string;
  supplierName?: string;
  invoiceAmount?: number;
  totalCbm?: number;
  chargeLines: ClearingPaymentChargeLine[];
  totalCharges?: number;
}

export interface ClearingPaymentDetail {
  clearingPaymentId?: number;
  containerId: number;
  containerNumber?: string;
  clearingAgentId: number;
  clearingAgentName?: string;
  paymentDate: string;
  billDate: string;
  clearingAmount: number;
  status: string;
  purchaseOrders: ClearingPaymentPO[];
}

export interface ContainerPOItem {
  purchaseOrderId: number;
  poNumber: string;
  poDate: string;
  supplierName: string;
  invoiceAmount: number;
  totalCbm: number;
}

export const clearingPaymentsService = {
  getDashboard: async (): Promise<ClearingPaymentDashboard> => {
    const response = await apiClient.get<ClearingPaymentDashboard>(`${BASE}/dashboard`);
    return response.data;
  },

  search: async (request: ClearingPaymentSearchRequest): Promise<ClearingPaymentSearchResponse> => {
    const response = await apiClient.post<ClearingPaymentSearchResponse>(`${BASE}/search`, request);
    return response.data;
  },

  getById: async (id: number): Promise<ClearingPaymentDetail> => {
    const response = await apiClient.get<ClearingPaymentDetail>(`${BASE}/${id}`);
    return response.data;
  },

  create: async (data: ClearingPaymentDetail): Promise<ClearingPaymentDetail> => {
    const response = await apiClient.post<ClearingPaymentDetail>(BASE, data);
    return response.data;
  },

  update: async (id: number, data: ClearingPaymentDetail): Promise<ClearingPaymentDetail> => {
    const response = await apiClient.put<ClearingPaymentDetail>(`${BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  getContainerPOs: async (containerId: number): Promise<ContainerPOItem[]> => {
    const response = await apiClient.get<ContainerPOItem[]>(`/api/containers/${containerId}/purchase-orders`);
    return response.data;
  },
};
