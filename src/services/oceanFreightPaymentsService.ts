import apiClient from './apiClient';

const BASE = '/api/ocean-freight-payments';
const PAYMENT_BASE = '/api/Payments';

export type PaymentStatus = 'Pending' | 'Requested' | 'Approved' | 'Rejected' | 'Paid';

export interface OceanFreightPaymentDashboard {
  pendingCount: number;
  requestedCount: number;
  approvedCount: number;
  rejectedCount: number;
  paidCount: number;
}

export interface OceanFreightPaymentSearchRequest {
  containerNumber?: string;
  oceanFreightCompany?: string;
  statuses?: string[];
  fromDate?: string | null;
  toDate?: string | null;
  pageNumber: number;
  pageSize: number;
}

export interface OceanFreightPaymentListItem {
  oceanFreightPaymentId: number;
  containerNumber: string;
  oceanFreightCompanyName: string;
  paymentDate: string;
  oceanFreightUSD: number;
  exchangeRate: number;
  amountInRand: number;
  status: PaymentStatus;
}

export interface OceanFreightPaymentSearchResponse {
  data: OceanFreightPaymentListItem[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface OceanFreightPaymentDetail {
  oceanFreightPaymentId?: number;
  containerId: number;
  containerNumber?: string;
  clearingAgentId?: number;
  clearingAgentName?: string;
  oceanFreightUSD: number;
  exchangeRate: number;
  amountInRand?: number;
  paymentDate: string;
  billDate: string;
  status: PaymentStatus;
  paymentRequestId?: number;
  createdDate?: string;
  createdBy?: string;
  updatedDate?: string;
  updatedBy?: string;
}

export interface PaymentRequestResponse {
  purchaseOrderPaymentId?: number;
  clearingPaymentId?: number;
  oceanFreightPaymentId?: number;
  sourceModule: string;
  sourceId: number;
  status: PaymentStatus;
  paymentRequestId?: number;
  vendorId?: number;
  vendorName?: string;
  vendorType?: string;
  amount?: number;
  dueDate?: string;
  createdAt?: string;
}

export const oceanFreightPaymentsService = {
  getDashboard: async (): Promise<OceanFreightPaymentDashboard> => {
    const response = await apiClient.get<OceanFreightPaymentDashboard>(`${BASE}/dashboard`);
    return response.data;
  },

  search: async (request: OceanFreightPaymentSearchRequest): Promise<OceanFreightPaymentSearchResponse> => {
    const response = await apiClient.post<OceanFreightPaymentSearchResponse>(`${BASE}/search`, request);
    return response.data;
  },

  getById: async (id: number): Promise<OceanFreightPaymentDetail> => {
    const response = await apiClient.get<OceanFreightPaymentDetail>(`${BASE}/${id}`);
    return response.data;
  },

  create: async (data: OceanFreightPaymentDetail): Promise<OceanFreightPaymentDetail> => {
    const response = await apiClient.post<OceanFreightPaymentDetail>(BASE, data);
    return response.data;
  },

  update: async (id: number, data: OceanFreightPaymentDetail): Promise<OceanFreightPaymentDetail> => {
    const response = await apiClient.put<OceanFreightPaymentDetail>(`${BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  requestPayment: async (id: number): Promise<PaymentRequestResponse> => {
    const response = await apiClient.post<PaymentRequestResponse>(
      `${PAYMENT_BASE}/ocean-freight-payment/${id}/request`
    );
    return response.data;
  },

  approvePayment: async (id: number): Promise<PaymentRequestResponse> => {
    const response = await apiClient.post<PaymentRequestResponse>(
      `${PAYMENT_BASE}/ocean-freight-payment/${id}/approve`
    );
    return response.data;
  },

  rejectPayment: async (id: number): Promise<PaymentRequestResponse> => {
    const response = await apiClient.post<PaymentRequestResponse>(
      `${PAYMENT_BASE}/ocean-freight-payment/${id}/reject`
    );
    return response.data;
  },
};
