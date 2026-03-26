import apiClient from './apiClient';

export interface EtaPaymentStatusSearchRequest {
  containerNumber?: string;
  shippingCompanyId?: number | null;
  paymentStatus?: string | null;
  paymentStatuses?: string[];
  etaFromDate?: string | null;
  etaToDate?: string | null;
  pageNumber: number;
  pageSize: number;
}

export interface EtaPaymentStatusListItem {
  containerId: number;
  containerNumber: string;
  shippingCompanyName: string;
  poAmount: number;
  totalCBM: number;
  paymentStatus: string;
  etaDueDateLabel: string;
  dueDate: string;
}

export interface EtaPaymentStatusSearchApiResponse {
  data: EtaPaymentStatusListItem[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface EtaPaymentStatusSearchResponse {
  items: EtaPaymentStatusListItem[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface EtaPaymentStatusPO {
  purchaseOrderId: number;
  poNumber: string;
  poDate: string;
  supplierName: string;
  poAmount: number;
  totalCBM: number;
  paymentStatus: string;
  totalPaymentTerms: number;
  paidPaymentTerms: number;
}

export interface EtaPaymentStatusDetail {
  containerId: number;
  containerNumber: string;
  shippingCompanyName: string;
  poAmount: number;
  totalCBM: number;
  paymentStatus: string;
  dueDate: string;
  eta: string;
  totalPOs: number;
  fullyPaidPOs: number;
  purchaseOrders: EtaPaymentStatusPO[];
}

export const etaPaymentStatusService = {
  search: async (
    request: EtaPaymentStatusSearchRequest
  ): Promise<EtaPaymentStatusSearchResponse> => {
    const response = await apiClient.post<EtaPaymentStatusSearchApiResponse>(
      '/api/containers/eta-payment-status/search',
      request
    );
    const apiData = response.data;
    return {
      items: apiData.data || [],
      currentPage: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.totalPages,
      totalRecords: apiData.totalRecords,
    };
  },

  getDetail: async (containerId: number): Promise<EtaPaymentStatusDetail> => {
    const response = await apiClient.get<EtaPaymentStatusDetail>(
      `/api/containers/${containerId}/eta-payment-status`
    );
    return response.data;
  },
};
