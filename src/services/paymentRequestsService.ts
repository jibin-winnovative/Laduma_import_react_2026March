import apiClient from './apiClient';

export interface PaymentRequestData {
  sourceModule: string;
  sourceId: number;
  payeeTable: string;
  payeeId: number;
  amount: number;
  dueDate: string;
  description: string;
}

export interface PaymentRequestResponse {
  paymentRequestId: number;
  sourceModule: string;
  sourceId: number;
  vendorId: number;
  vendorName: string;
  vendorType: string;
  amount: number;
  dueDate: string;
  status: string;
  createdAt: string;
}

export const paymentRequestsService = {
  createRequest: async (data: PaymentRequestData): Promise<PaymentRequestResponse> => {
    const response = await apiClient.post('/api/Payments/requests', data);
    return response.data;
  },

  rejectRequest: async (paymentRequestId: number): Promise<{ paymentRequestId: number; status: string }> => {
    const response = await apiClient.post(`/api/Payments/requests/${paymentRequestId}/reject`);
    return response.data;
  },
};
