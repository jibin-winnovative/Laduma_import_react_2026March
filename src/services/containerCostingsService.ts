import { api } from './apiClient';

const BASE_PATH = '/api/ContainerCostings';

// ── List types ──────────────────────────────────────────────────────────────

export type ContainerCostingListRow = {
  containerId: number;
  containerCostingId: number | null;
  containerNo: string;
  eta: string | null;
  poCount: number;
  costingStatus: 'Not Created' | 'Draft' | 'Requested' | 'Rejected' | 'Approved';
  costingType: 'Actual' | 'Custom' | null;
  lastUpdated: string | null;
};

export interface ContainerCostingListParams {
  searchText?: string;
  costingStatus?: string;
  costingType?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ContainerCostingListResponse {
  data: ContainerCostingListRow[];
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface InitializeResponse {
  containerCostingId?: number;
  [key: string]: unknown;
}

// ── Workspace types ──────────────────────────────────────────────────────────

export interface WorkspaceSummary {
  containerNo: string;
  containerType?: string;
  mscu?: string;
  shippingCompanyName?: string;
  oceanFreightCompanyName?: string;
  etd?: string | null;
  eta?: string | null;
  poCount: number;
  totalItems: number;
  totalLoadedQty?: number;
  totalWeight?: number;
  totalCbm?: number;
  totalPoPaymentZar?: number;
  totalDuty?: number;
  totalClearingCost?: number;
  totalTransportation?: number;
  totalOceanFreight?: number;
  totalLandedAmount?: number;
  hasPendingPayments?: boolean;
}

export type AllocationMethod = 'Amount' | 'CBM' | 'Custom';
export type AmountSourceType = 'Actual' | 'Anticipated' | 'Manual';
export type CostingStatus = 'Not Created' | 'Draft' | 'Requested' | 'Rejected' | 'Approved';
export type CostingType = 'Actual' | 'Custom';

export interface WorkspaceCostHead {
  containerCostingCostHeadId: number;
  costHead: string;
  amountSourceType: AmountSourceType;
  allocationMethod: AllocationMethod;
  actualAmount: number;
  anticipatedAmount: number;
  finalAmountUsed: number;
}

export interface WorkspaceItem {
  containerCostingItemId: number;
  poNumber: string;
  supplierName: string;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  uom: string;
  cbm: number;
  unitPriceUsd: number;
  totalAmountUsd: number;
  totalAmountZar: number;
  productTax: number;
  // allocated costs (from backend or calculated)
  dutyAllocatedAmount: number;
  clearingAllocatedAmount: number;
  transportationAllocatedAmount: number;
  oceanFreightAllocatedAmount: number;
  // pricing
  ibtAmount: number;
  profitDcPercent: number;
  branchGpPercent: number;
  spRoundFinal?: number;
}

export interface WorkspacePricingInputs {
  profitDcPercent: number;
  branchGpPercent: number;
  costAdjustmentPercent: number;
  taxVatPercent: number;
  spRoundFinalAdjustment: number;
  roundingRule?: string;
  costingType?: CostingType;
  remarks?: string;
}

export interface WorkspaceResponse {
  containerCostingId: number;
  costingStatus: CostingStatus;
  summary: WorkspaceSummary;
  costHeads: WorkspaceCostHead[];
  items: WorkspaceItem[];
  pricingInputs?: WorkspacePricingInputs;
}

// ── Save payload types ───────────────────────────────────────────────────────

export interface SaveCostHead {
  containerCostingCostHeadId: number;
  costHead: string;
  amountSourceType: AmountSourceType;
  allocationMethod: AllocationMethod;
  actualAmount: number;
  anticipatedAmount: number;
  finalAmountUsed: number;
}

export interface SaveItem {
  containerCostingItemId: number;
  poAllocatedAmountZar: number;
  dutyAllocatedAmount: number;
  clearingAllocatedAmount: number;
  transportationAllocatedAmount: number;
  oceanFreightAllocatedAmount: number;
  ibtAmount: number;
}

export interface SavePayload {
  costAdjustmentPercent: number;
  profitMarginPercent: number;
  branchGpPercent: number;
  spRoundoff: number;
  spRoundFinal: number;
  remarks: string;
  costHeads: SaveCostHead[];
  items: SaveItem[];
}

// ── Service ──────────────────────────────────────────────────────────────────

const unwrap = (response: any) => {
  const body = response?.data ?? response;
  if (body?.success !== undefined) return body.data ?? body;
  return body;
};

export const containerCostingsService = {
  getList: async (params: ContainerCostingListParams = {}): Promise<ContainerCostingListResponse> => {
    const q = new URLSearchParams();
    if (params.searchText) q.append('searchText', params.searchText);
    if (params.costingStatus) q.append('costingStatus', params.costingStatus);
    if (params.costingType) q.append('costingType', params.costingType);
    q.append('pageNumber', String(params.pageNumber ?? 1));
    q.append('pageSize', String(params.pageSize ?? 20));
    const response: any = await api.get(`${BASE_PATH}?${q.toString()}`);
    const body = response.data ?? response;
    if (body?.data && Array.isArray(body.data.data)) return body.data;
    if (body?.data && Array.isArray(body.data)) return body;
    return body;
  },

  initialize: async (containerId: number): Promise<InitializeResponse> => {
    const response: any = await api.post(`${BASE_PATH}/container/${containerId}/initialize`, {});
    return unwrap(response);
  },

  getWorkspace: async (containerCostingId: number): Promise<WorkspaceResponse> => {
    const response: any = await api.get(`${BASE_PATH}/${containerCostingId}/workspace`);
    return unwrap(response);
  },

  saveDraft: async (containerCostingId: number, payload: SavePayload): Promise<any> => {
    const response: any = await api.put(`${BASE_PATH}/${containerCostingId}`, payload);
    return unwrap(response);
  },

  requestApproval: async (containerCostingId: number): Promise<any> => {
    const response: any = await api.post(`${BASE_PATH}/${containerCostingId}/request`, {});
    return unwrap(response);
  },

  approve: async (containerCostingId: number): Promise<any> => {
    const response: any = await api.post(`${BASE_PATH}/${containerCostingId}/approve`, {});
    return unwrap(response);
  },

  reject: async (containerCostingId: number): Promise<any> => {
    const response: any = await api.post(`${BASE_PATH}/${containerCostingId}/reject`, {});
    return unwrap(response);
  },
};
