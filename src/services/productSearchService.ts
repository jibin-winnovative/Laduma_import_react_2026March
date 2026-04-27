import { api } from './apiClient';

const PRODUCTS_PATH = '/api/productmasters';

export interface HierarchyNode {
  key: string;
  title: string;
  children?: HierarchyNode[];
}

export interface SearchProductRequest {
  supplierId: number;
  subTypeIds: number[];
}

export interface SearchProductResult {
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
  MinimumQty: number;
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
  // Client-side editable fields
  editableFinalQty?: number;
  editablePrice?: number;
}

const productSearchService = {
  getHierarchyTree: async (): Promise<HierarchyNode[]> => {
    try {
      const response: any = await api.get(`${PRODUCTS_PATH}/product-hierarchy-tree`);
      return response.data || response || [];
    } catch {
      return [];
    }
  },

  searchProducts: async (request: SearchProductRequest): Promise<SearchProductResult[]> => {
    try {
      const response: any = await api.post(`${PRODUCTS_PATH}/search-products`, request);
      const raw: any[] = response.data || response || [];
      return raw.map((item: any) => ({
        ...item,
        productId: item.productId ?? item.productMasterId ?? item.ProductId ?? item.ProductMasterId ?? item.id ?? item.Id ?? 0,
      }));
    } catch {
      return [];
    }
  },
};

export default productSearchService;
