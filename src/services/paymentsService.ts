import apiClient from './apiClient';

export interface DashboardSummary {
  pendingRequestCount: number;
  pendingAmountTotal: number;
  paidRequestCount: number;
  paidThisMonthTotal: number;
  paidThisMonthCount: number;
}

export interface PaymentRequest {
  paymentRequestId: number;
  sourceModule: string;
  sourceId: number;
  refNumber?: string;
  vendorId: number;
  vendorName: string;
  vendorType: string;
  amount: number;
  dueDate: string;
  status: string;
  createdAt: string;
  description?: string;
  paidDate?: string;
}

export interface SourceContext {
  referenceId: number;
  referenceNumber: string;
  referenceType: string;
  referenceDate: string;
  totalAmount: number;
  totalPaidAmount: number;
  currencyCode: string;
  exchangeRate: number;
  partyName: string;
  hasMoreDetails: boolean;
}

export interface PaymentRequestDetails {
  paymentRequestId: number;
  sourceModule: string;
  sourceId: number;
  vendorId: number;
  vendorName: string;
  vendorType: string;
  requestAmount: number;
  dueDate: string;
  status: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  sourceContext: SourceContext;
  paidDate?: string;
}

export interface PaymentRequestsResponse {
  data: PaymentRequest[];
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface MakePaymentRequest {
  paymentRequestId: number;
  paymentMethod: string;
  referenceNo: string;
  paidAmount: number;
  paidDate: string;
  remarks?: string;
  bankId?: number;
  amountInZar?: number;
}

export interface PaymentResponse {
  paymentId: number;
  paymentRequestId: number;
  paymentMethod: string;
  referenceNo: string;
  paidAmount: number;
  paidDate: string;
  paidBy: string;
}

export const paymentsService = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>('/api/Payments/dashboard-summary');
    return response.data;
  },

  getPaymentRequests: async (params: {
    pageNumber?: number;
    pageSize?: number;
    vendorName?: string;
    sourceModule?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    refNumber?: string;
  }): Promise<PaymentRequestsResponse> => {
    const response = await apiClient.get<PaymentRequestsResponse>('/api/Payments/requests', {
      params,
    });
    return response.data;
  },

  getPendingRequests: async (): Promise<PaymentRequest[]> => {
    const response = await apiClient.get<PaymentRequest[]>('/api/Payments/requests/pending');
    return response.data;
  },

  getPaymentRequestDetails: async (id: number): Promise<PaymentRequestDetails> => {
    const response = await apiClient.get<PaymentRequestDetails>(`/api/Payments/requests/${id}/details`);
    return response.data;
  },

  makePayment: async (data: MakePaymentRequest): Promise<PaymentResponse> => {
    const response = await apiClient.post<PaymentResponse>('/api/Payments/pay', data);
    return response.data;
  },

  getSupplierDetailsByPaymentRequest: async (paymentRequestId: number): Promise<any> => {
    const response = await apiClient.get<any>(`/api/Payments/requests/${paymentRequestId}/supplier-details`);
    return response.data;
  },
};
