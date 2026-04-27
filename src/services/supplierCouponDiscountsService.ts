import apiClient from './apiClient';

export interface SupplierCouponDiscount {
  supplierCouponDiscountId: number;
  supplierId: number;
  supplierName: string;
  nature: string;
  amountUsd: number;
  usedAmountUsd: number;
  remainingAmountUsd: number;
  remarks: string;
  couponDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
}

export interface SupplierCouponDiscountListParams {
  supplierId?: number;
  nature?: string;
  isActive?: boolean;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface SupplierCouponDiscountListResponse {
  data: SupplierCouponDiscount[];
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface CreateSupplierCouponDiscountRequest {
  supplierId: number;
  nature: string;
  amountUsd: number;
  remarks: string;
  couponDate: string;
  isActive: boolean;
}

export interface UpdateSupplierCouponDiscountRequest extends CreateSupplierCouponDiscountRequest {
  supplierCouponDiscountId: number;
}

export interface AvailableSupplierCouponDiscount {
  supplierCouponDiscountId: number;
  nature: string;
  amountUsd: number;
  remainingAmountUsd: number;
  remarks: string;
  couponDate: string;
}

export const NATURE_OPTIONS = [
  'Supplier Canton Discount',
  'Damage',
  'Sample',
  'Gift/Coupon',
  'Carry-Forward Payment',
] as const;

const BASE_PATH = '/api/SupplierCouponDiscounts';

export const supplierCouponDiscountsService = {
  getList: async (params: SupplierCouponDiscountListParams): Promise<SupplierCouponDiscountListResponse> => {
    const urlParams = new URLSearchParams();
    if (params.supplierId) urlParams.append('supplierId', params.supplierId.toString());
    if (params.nature) urlParams.append('nature', params.nature);
    if (params.isActive !== undefined) urlParams.append('isActive', params.isActive.toString());
    if (params.searchTerm) urlParams.append('searchTerm', params.searchTerm);
    if (params.pageNumber) urlParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) urlParams.append('pageSize', params.pageSize.toString());
    const response = await apiClient.get(`${BASE_PATH}?${urlParams.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<SupplierCouponDiscount> => {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  create: async (data: CreateSupplierCouponDiscountRequest): Promise<SupplierCouponDiscount> => {
    const response = await apiClient.post(BASE_PATH, data);
    return response.data;
  },

  update: async (data: UpdateSupplierCouponDiscountRequest): Promise<SupplierCouponDiscount> => {
    const response = await apiClient.put(`${BASE_PATH}/${data.supplierCouponDiscountId}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_PATH}/${id}`);
  },

  getAvailable: async (supplierId: number, purchaseOrderId?: number): Promise<AvailableSupplierCouponDiscount[]> => {
    const urlParams = new URLSearchParams({ supplierId: supplierId.toString() });
    if (purchaseOrderId) urlParams.append('purchaseOrderId', purchaseOrderId.toString());
    const response = await apiClient.get(`${BASE_PATH}/available?${urlParams.toString()}`);
    return Array.isArray(response.data) ? response.data : response.data?.data ?? [];
  },
};
