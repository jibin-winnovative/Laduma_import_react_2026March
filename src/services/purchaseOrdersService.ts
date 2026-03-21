import apiClient from './apiClient';

export interface PurchaseOrderItem {
  productId: number;
  itemCode: string;
  barcode: string;
  itemName: string;
  uom: string;
  orderedQty: number;
  unitPriceForeign: number;
  cbm: number;
  grossWeight: number;
}

export interface PurchaseOrderCharge {
  addonChargeId: number;
  amount: number;
}

export interface PurchaseOrderPayment {
  description: string;
  percentage: number;
  amount: number;
  expectedDate: string;
}

export interface CreatePurchaseOrderRequest {
  companyId: number;
  poNumber: string;
  poDate: string;
  supplierId: number;
  currencyId: number;
  incoterm: string | null;
  priceTerms: string;
  remarks: string;
  exportPortId: number;
  importPortId: number;
  shipmentTypeId: number;
  expectedShipmentYear?: number;
  expectedShipmentMonth?: number;
  items: PurchaseOrderItem[];
  charges: PurchaseOrderCharge[];
  payments: PurchaseOrderPayment[];
}

export interface UpdatePurchaseOrderRequest extends CreatePurchaseOrderRequest {
  purchaseOrderId: number;
}

export interface PurchaseOrderResponse {
  purchaseOrderId: number;
  companyId: number;
  poNumber: string;
  poDate: string;
  supplierId: number;
  currencyId: number;
  status: string;
  [key: string]: any;
}

export interface PurchaseOrderListParams {
  companyId?: number;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
  statuses?: string[];
  fromDate?: string;
  toDate?: string;
}

export interface PurchaseOrderListResponse {
  data: PurchaseOrderResponse[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApprovedPOResponse {
  purchaseOrderId: number;
  poNumber: string;
  poDate: string;
  supplierName: string;
  poAmount: number;
  totalCBM: number;
}

export interface ApprovedPOListResponse {
  data: ApprovedPOResponse[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface ExcelImportItem {
  productId: number;
  itemCode: string;
  barcode: string;
  itemName: string;
  itemDescription?: string;
  uom: string;
  priceUsd: number;
  price: number;
  fob: number;
  cbm: number;
  multipleOf: number;
  minimumQty: number;
  weight: number;
  avg1Month: number;
  avg2Month: number;
  avg3Month: number;
  avg1Year: number;
  stock: number;
  stockCost: number;
  avgCost: number;
  lastSoldDate: string | null;
  indent: number;
  pendingPo: number;
  quantity: number;
  lastPoRate: number;
  editableFinalQty: number;
  editablePrice: number;
}

export interface MissingItem {
  rowNumber: number;
  itemCode: string;
  qty: number;
  cbm: number;
  price: number;
  reason: string;
}

export interface ExcelImportResponse {
  isValid: boolean;
  message: string;
  items: ExcelImportItem[];
  missingItems: MissingItem[];
}

export const purchaseOrdersService = {
  getList: async (params: PurchaseOrderListParams): Promise<PurchaseOrderListResponse> => {
    const urlParams = new URLSearchParams();

    if (params.pageNumber) urlParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) urlParams.append('pageSize', params.pageSize.toString());
    if (params.companyId) urlParams.append('companyId', params.companyId.toString());
    if (params.searchTerm) urlParams.append('searchTerm', params.searchTerm);
    if (params.fromDate) urlParams.append('fromDate', params.fromDate);
    if (params.toDate) urlParams.append('toDate', params.toDate);

    if (params.statuses && params.statuses.length > 0) {
      params.statuses.forEach(status => urlParams.append('statuses', status));
    }

    const response = await apiClient.get(`/api/purchaseorders?${urlParams.toString()}`);
    return response.data;
  },

  create: async (data: CreatePurchaseOrderRequest, submit: boolean = false): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.post('/api/purchaseorders', data, { params: { submit } });
    return response.data;
  },

  update: async (data: UpdatePurchaseOrderRequest, submit: boolean = false): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.put(`/api/purchaseorders/${data.purchaseOrderId}`, data, { params: { submit } });
    return response.data;
  },

  getById: async (id: number): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.get(`/api/purchaseorders/${id}`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/purchaseorders/${id}`);
  },

  checkPONumber: async (poNumber: string, companyId?: number): Promise<{ exists: boolean }> => {
    const params: { poNumber: string; companyId?: number } = { poNumber };
    if (companyId) {
      params.companyId = companyId;
    }
    const response = await apiClient.get('/api/purchaseorders/check-ponumber', { params });
    return response.data;
  },

  approve: async (id: number, data: UpdatePurchaseOrderRequest): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.put(`/api/PurchaseOrders/${id}/approve`, data);
    return response.data;
  },

  reject: async (id: number, data: UpdatePurchaseOrderRequest): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.post(`/api/PurchaseOrders/${id}/reject`, data);
    return response.data;
  },

  getApprovedPOs: async (queryString: string): Promise<ApprovedPOListResponse> => {
    const response = await apiClient.get(`/api/PurchaseOrders/approved?${queryString}`);
    return response.data;
  },

  importItemsFromExcel: async (file: File): Promise<ExcelImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/PurchaseOrders/import-items', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000,
    });
    return response.data;
  },
};
