import apiClient from './apiClient';

export interface POReportSearchParams {
  companyId?: number | null;
  supplierId?: number | null;
  searchTerm?: string;
  statuses?: string[];
  operationalStatuses?: string[];
  fromDate?: string;
  toDate?: string;
  pageNumber: number;
  pageSize: number;
}

export interface POReportRow {
  purchaseOrderId: number;
  poNumber: string;
  poDate: string;
  supplierName: string | null;
  poAmount: number;
  totalCBM: number | null;
  exportPortName: string | null;
  shipmentTypeName: string | null;
  modeOfShipment: string | null;
  expectedDeliveryMonth: string | null;
  status: string;
  operationalStatus: string | null;
  latestCompletedEventStatus: string | null;
}

export interface POReportSearchResponse {
  data: POReportRow[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

const buildBody = (params: POReportSearchParams): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
  };
  if (params.companyId) body.companyId = params.companyId;
  if (params.supplierId) body.supplierId = params.supplierId;
  if (params.searchTerm) body.searchTerm = params.searchTerm;
  if (params.fromDate) body.fromDate = params.fromDate;
  if (params.toDate) body.toDate = params.toDate;
  body.statuses = params.statuses && params.statuses.length > 0 ? params.statuses : [];
  body.operationalStatuses =
    params.operationalStatuses && params.operationalStatuses.length > 0
      ? params.operationalStatuses
      : [];
  return body;
};

export const poReportsService = {
  search: async (params: POReportSearchParams): Promise<POReportSearchResponse> => {
    const response = await apiClient.post('/api/reports/purchase-orders/search', buildBody(params));
    return response.data;
  },

  exportExcel: async (params: POReportSearchParams): Promise<void> => {
    const response = await apiClient.post(
      '/api/reports/purchase-orders/export-excel',
      buildBody(params),
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PO_Report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
