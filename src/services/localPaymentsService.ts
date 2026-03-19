import apiClient from './apiClient';

export interface LocalPayment {
  localPaymentId: number;
  containerId: number;
  containerNumber: string;
  paymentNature: string;
  localTransportCompanyId?: number | null;
  companyName?: string;
  amountExcl: number;
  vat: number;
  amountIncl: number;
  paymentDate: string;
  billDate: string;
  remarks?: string;
  status: string;
  createdDate: string;
  createdBy: string;
  updatedDate?: string | null;
  updatedBy?: string | null;
  attachments?: any[];
}

export interface CreateLocalPaymentRequest {
  containerId: number;
  paymentNature: string;
  localTransportCompanyId?: number | null;
  amountExcl: number;
  vat: number;
  paymentDate: string;
  billDate: string;
  remarks?: string;
  status: string;
}

export interface UpdateLocalPaymentRequest extends CreateLocalPaymentRequest {
  localPaymentId: number;
}

export interface LocalPaymentListItem {
  localPaymentId: number;
  containerNumber: string;
  paymentNature: string;
  localTransportCompanyId?: number | null;
  companyName?: string;
  amountIncl: number;
  paymentDate: string;
  status: string;
}

export interface LocalPaymentListResponse {
  data: LocalPaymentListItem[];
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface LocalPaymentSearchRequest {
  containerNumber?: string;
  paymentNature?: string;
  companyName?: string;
  statuses?: string[];
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface LocalPaymentDashboard {
  pendingCount: number;
  requestedCount: number;
  approvedCount: number;
  paidCount: number;
  rejectedCount: number;
}

export const localPaymentsService = {
  getList: async (params: {
    pageNumber?: number;
    pageSize?: number;
    containerNumber?: string;
    paymentNature?: string;
    statuses?: string[];
  }): Promise<LocalPaymentListResponse> => {
    const urlParams = new URLSearchParams();

    if (params.pageNumber) urlParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) urlParams.append('pageSize', params.pageSize.toString());
    if (params.containerNumber) urlParams.append('containerNumber', params.containerNumber);
    if (params.paymentNature) urlParams.append('paymentNature', params.paymentNature);
    if (params.statuses) {
      params.statuses.forEach(status => urlParams.append('statuses', status));
    }

    const response = await apiClient.get(`/api/local-payments?${urlParams.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<LocalPayment> => {
    const response = await apiClient.get(`/api/local-payments/${id}`);
    return response.data;
  },

  create: async (data: CreateLocalPaymentRequest): Promise<LocalPayment> => {
    const response = await apiClient.post('/api/local-payments', data);
    return response.data;
  },

  update: async (id: number, data: UpdateLocalPaymentRequest): Promise<LocalPayment> => {
    const response = await apiClient.put(`/api/local-payments/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/local-payments/${id}`);
  },

  search: async (searchRequest: LocalPaymentSearchRequest): Promise<LocalPaymentListResponse> => {
    const response = await apiClient.post('/api/local-payments/search', searchRequest);
    return response.data;
  },

  getDashboard: async (): Promise<LocalPaymentDashboard> => {
    const response = await apiClient.get('/api/local-payments/dashboard');
    return response.data;
  },

  requestPayment: async (localPaymentId: number): Promise<void> => {
    await apiClient.post(`/api/Payments/local-payment/${localPaymentId}/request`);
  },

  approvePayment: async (localPaymentId: number): Promise<void> => {
    await apiClient.post(`/api/Payments/local-payment/${localPaymentId}/approve`);
  },

  rejectPayment: async (localPaymentId: number): Promise<void> => {
    await apiClient.post(`/api/Payments/local-payment/${localPaymentId}/reject`);
  },
};
