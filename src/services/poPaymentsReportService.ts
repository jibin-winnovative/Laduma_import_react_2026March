import apiClient from './apiClient';

export interface POPaymentsReportSearchParams {
  poNumber?: string;
  supplierId?: number | null;
  paymentStatuses?: string[];
  pageNumber: number;
  pageSize: number;
}

export interface POPaymentsReportRow {
  purchaseOrderPaymentId: number;
  purchaseOrderId: number;
  poNumber: string;
  poDate: string | null;
  supplierName: string | null;
  poAmountInUsd: number | null;
  totalCBM: number | null;
  paymentStatus: string;
  paymentTerms: string | null;
  paymentAmount: number | null;
  expectedPaymentDate: string | null;
  paidAmountInRand: number | null;
  paidDate: string | null;
}

export interface POPaymentsReportSearchResponse {
  data: POPaymentsReportRow[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

const buildBody = (params: POPaymentsReportSearchParams): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
  };
  if (params.poNumber) body.poNumber = params.poNumber;
  if (params.supplierId) body.supplierId = params.supplierId;
  body.paymentStatuses =
    params.paymentStatuses && params.paymentStatuses.length > 0 ? params.paymentStatuses : [];
  return body;
};

export const poPaymentsReportService = {
  search: async (params: POPaymentsReportSearchParams): Promise<POPaymentsReportSearchResponse> => {
    const response = await apiClient.post('/api/reports/po-payments/search', buildBody(params));
    return response.data;
  },

  exportExcel: async (params: POPaymentsReportSearchParams): Promise<void> => {
    const response = await apiClient.post(
      '/api/reports/po-payments/export-excel',
      buildBody(params),
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PO_Payments_Report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
