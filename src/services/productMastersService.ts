import api from './apiClient';
import apiClient from './apiClient';

const BASE_PATH = '/api/productmasters';

export interface ProductMasterImage {
  attachmentId: number;
  fileName: string;
  storedFileName: string;
  s3Key: string;
  s3Bucket: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  contentType: string;
  category?: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface ProductMaster {
  productId: number;
  itemCode: string;
  itemName: string;
  description?: string;
  barcode?: string;
  departmentId: number;
  departmentName?: string;
  categoryId: number;
  categoryName?: string;
  typeId: number;
  typeName?: string;
  subTypeId: number;
  subTypeName?: string;
  price?: number;
  uom?: string;
  fob?: number;
  cbm?: number;
  weight?: number;
  height?: number;
  length?: number;
  multipleOf?: number | null;
  minimumQty?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  images?: ProductMasterImage[];
}

export interface ProductMastersListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  departmentId?: number;
  categoryId?: number;
  typeId?: number;
  subTypeId?: number;
}

export interface ProductMastersListResponse {
  data: ProductMaster[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface ProductMasterQuickSummary {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  formattedLastUpdated: string;
}

export interface ProductMasterFormData {
  itemCode: string;
  itemName: string;
  description?: string;
  barcode?: string;
  departmentId: number;
  categoryId: number;
  typeId: number;
  subTypeId: number;
  price?: number;
  uom?: string;
  fob?: number;
  cbm?: number;
  weight?: number;
  height?: number;
  length?: number;
  multipleOf?: number | null;
  minimumQty?: number | null;
  isActive: boolean;
}

export interface ItemCodeExistsParams {
  itemCode: string;
  productId?: number;
}

export interface BarcodeExistsParams {
  barcode: string;
  productId?: number;
}

const productMastersService = {
  getList: async (params: ProductMastersListParams = {}): Promise<ProductMastersListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('pageNumber', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.departmentId) queryParams.append('departmentId', params.departmentId.toString());
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.typeId) queryParams.append('typeId', params.typeId.toString());
    if (params.subTypeId) queryParams.append('subTypeId', params.subTypeId.toString());
    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }

    const query = queryParams.toString();
    const response: any = await api.get(`${BASE_PATH}${query ? `?${query}` : ''}`);
    return response.data.data as ProductMastersListResponse;
  },

  getById: async (id: number): Promise<ProductMaster> => {
    const response: any = await api.get(`${BASE_PATH}/${id}`);
    return response.data.data as ProductMaster;
  },

  create: async (data: ProductMasterFormData): Promise<ProductMaster> => {
    const response: any = await api.post(BASE_PATH, data);
    return response.data.data as ProductMaster;
  },

  update: async (id: number, data: ProductMasterFormData): Promise<ProductMaster> => {
    const response: any = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data.data as ProductMaster;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  checkItemCodeExists: async (params: ItemCodeExistsParams): Promise<boolean> => {
    const queryParams = new URLSearchParams();
    queryParams.append('itemCode', params.itemCode);
    if (params.productId) queryParams.append('productId', params.productId.toString());

    const response: any = await api.get(`${BASE_PATH}/itemcode-exists?${queryParams.toString()}`);
    return response?.data?.data?.exists || false;
  },

  checkBarcodeExists: async (params: BarcodeExistsParams): Promise<boolean> => {
    const queryParams = new URLSearchParams();
    queryParams.append('barcode', params.barcode);
    if (params.productId) queryParams.append('productId', params.productId.toString());

    const response: any = await api.get(`${BASE_PATH}/barcode-exists?${queryParams.toString()}`);
    return response?.data?.data?.exists || false;
  },

  getQuickSummary: async (): Promise<ProductMasterQuickSummary> => {
    const response: any = await api.get(`${BASE_PATH}/quick-summary`);
    return response.data.data as ProductMasterQuickSummary;
  },

  exportExcel: async (params: ProductMastersListParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('search', params.searchTerm);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.departmentId) queryParams.append('departmentId', params.departmentId.toString());
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.typeId) queryParams.append('typeId', params.typeId.toString());
    if (params.subTypeId) queryParams.append('subTypeId', params.subTypeId.toString());

    const query = queryParams.toString();
    const response = await apiClient.get(`${BASE_PATH}/export${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};

export default productMastersService;
