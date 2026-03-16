import apiClient from './apiClient';

export interface POPaymentTiles {
  totalPending: number;
  totalRequested: number;
  totalPaid: number;
  totalOverdue: number;
  pendingAmount: number;
  requestedAmount: number;
  paidAmount: number;
}

export interface POPaymentListItem {
  purchaseOrderPaymentId: number;
  purchaseOrderId: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  totalPOAmount: number;
  expectedAmount: number;
  paidAmount: number;
  status: string;
  expectedDate: string;
}

export interface POPaymentListResponse {
  data: POPaymentListItem[];
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface POPaymentDetails {
  purchaseOrderPaymentId: number;
  purchaseOrderId: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  totalPOAmount: number;
  paidAmount: number;
  requestedAmount: number;
  expectedAmount: number;
  defaultDueDate: string;
  status: string;
  description?: string;
  paymentRequestId?: number;
}

export interface POPaymentFilters {
  pageNumber?: number;
  pageSize?: number;
  companyId?: number;
  searchTerm?: string;
  statuses?: string[];
  supplierId?: number;
  fromDate?: string;
  toDate?: string;
}

export const poPaymentsService = {
  getTiles: async (companyId?: number): Promise<POPaymentTiles> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get('/api/POPaymentDashboard/tiles', { params });
    return response.data;
  },

  getList: async (filters: POPaymentFilters): Promise<POPaymentListResponse> => {
    const searchParams = new URLSearchParams();

    searchParams.append('pageNumber', (filters.pageNumber || 1).toString());
    searchParams.append('pageSize', (filters.pageSize || 20).toString());

    if (filters.companyId) searchParams.append('companyId', filters.companyId.toString());
    if (filters.searchTerm) searchParams.append('searchTerm', filters.searchTerm);
    if (filters.supplierId) searchParams.append('supplierId', filters.supplierId.toString());
    if (filters.fromDate) searchParams.append('fromDate', filters.fromDate);
    if (filters.toDate) searchParams.append('toDate', filters.toDate);

    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach((status) => {
        searchParams.append('statuses', status);
      });
    }

    const response = await apiClient.get(`/api/POPaymentDashboard/list?${searchParams.toString()}`);
    return response.data;
  },

  getDetails: async (poPaymentId: number): Promise<POPaymentDetails> => {
    const response = await apiClient.get(`/api/POPaymentDashboard/details/${poPaymentId}`);
    return response.data;
  },

  requestPayment: async (purchaseOrderPaymentId: number): Promise<{ purchaseOrderPaymentId: number; status: string }> => {
    const response = await apiClient.post(`/api/Payments/purchase/${purchaseOrderPaymentId}/request`);
    return response.data;
  },

  approveRequest: async (purchaseOrderPaymentId: number): Promise<any> => {
    const response = await apiClient.post(`/api/Payments/purchase/${purchaseOrderPaymentId}/approve`);
    return response.data;
  },

  rejectRequest: async (purchaseOrderPaymentId: number): Promise<{ purchaseOrderPaymentId: number; status: string }> => {
    const response = await apiClient.post(`/api/Payments/purchase/${purchaseOrderPaymentId}/reject`);
    return response.data;
  },
};
