import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  RefreshCw,
  Save,
  Send,
  CheckCircle,
  XCircle,
  Download,
  ChevronRight,
  Package,
  Ship,
  Calendar,
  Box,
  DollarSign,
  Truck,
  ArrowLeft,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  containerCostingsService,
  WorkspaceResponse,
  WorkspaceCostHead,
  WorkspaceItem,
  WorkspacePricingInputs,
  AllocationMethod,
  CostingStatus,
  CostingType,
  SavePayload,
} from '../../services/containerCostingsService';

// ── Toast ─────────────────────────────────────────────────────────────────────
interface Toast { id: number; type: 'success' | 'error'; message: string; }
let _toastId = 0;

// ── Grid row (all calculated columns flat) ────────────────────────────────────
interface GridRow extends WorkspaceItem {
  // calculated
  totalCost: number;
  perItemCost: number;
  profit: number;
  afterDcPercent: number;
  salePriceExclVat: number;
  salePriceWithVat: number;
  spRoundoff: number;
  spRoundFinalCalc: number;
  spWithoutVat: number;
  gpAmountBranch: number;
  branchGpRatio: number;
  ibtTotal: number;
  profitDc: number;
  profitBranch: number;
  profitPerItemDc: number;
}

// ── Pricing state ─────────────────────────────────────────────────────────────
interface PricingState {
  profitDcPercent: number;
  branchGpPercent: number;
  costAdjustmentPercent: number;
  taxVatPercent: number;
  spRoundFinalAdjustment: number;
  costingType: CostingType;
  remarks: string;
}

// ── Column views ──────────────────────────────────────────────────────────────
type ViewMode = 'Basic' | 'Landed Cost' | 'IBT' | 'Selling Price' | 'Profit' | 'Full View';

const PINNED_COLS = ['poNumber', 'supplierName', 'itemCode', 'itemDescription', 'quantity', 'uom'];

const VIEW_COLS: Record<ViewMode, string[]> = {
  Basic: [
    ...PINNED_COLS,
    'cbm', 'unitPriceUsd', 'totalAmountUsd', 'totalAmountZar',
    'totalCost', 'perItemCost', 'ibtAmount', 'spRoundFinalCalc',
  ],
  'Landed Cost': [
    ...PINNED_COLS,
    'cbm', 'unitPriceUsd', 'totalAmountUsd', 'totalAmountZar',
    'dutyAllocatedAmount', 'clearingAllocatedAmount', 'transportationAllocatedAmount', 'oceanFreightAllocatedAmount',
    'totalCost', 'perItemCost',
  ],
  IBT: [
    ...PINNED_COLS,
    'perItemCost', 'profitDcPercent', 'profit', 'afterDcPercent',
    'ibtAmount', 'ibtTotal', 'profitDc', 'profitPerItemDc',
  ],
  'Selling Price': [
    ...PINNED_COLS,
    'ibtAmount', 'branchGpPercent', 'salePriceExclVat', 'salePriceWithVat',
    'spRoundoff', 'spRoundFinalCalc', 'spWithoutVat', 'gpAmountBranch', 'branchGpRatio',
  ],
  Profit: [
    ...PINNED_COLS,
    'ibtTotal', 'profitDc', 'profitBranch', 'profitPerItemDc', 'branchGpRatio',
  ],
  'Full View': [
    ...PINNED_COLS,
    'cbm', 'unitPriceUsd', 'totalAmountUsd', 'totalAmountZar',
    'dutyAllocatedAmount', 'clearingAllocatedAmount', 'transportationAllocatedAmount', 'oceanFreightAllocatedAmount',
    'totalCost', 'perItemCost',
    'profitDcPercent', 'profit', 'afterDcPercent', 'ibtAmount',
    'branchGpPercent', 'salePriceExclVat', 'salePriceWithVat',
    'spRoundoff', 'spRoundFinalCalc', 'spWithoutVat', 'gpAmountBranch', 'branchGpRatio',
    'ibtTotal', 'profitDc', 'profitBranch', 'profitPerItemDc',
  ],
};

const COL_LABELS: Record<string, string> = {
  poNumber: 'PO No', supplierName: 'Supplier Name', itemCode: 'Item Code',
  itemDescription: 'Item Description', quantity: 'Quantity', uom: 'UOM',
  cbm: 'CBM', unitPriceUsd: 'Unit Price (USD)', totalAmountUsd: 'Total Amount (USD)',
  totalAmountZar: 'Total Amount (ZAR)',
  dutyAllocatedAmount: 'Duty', clearingAllocatedAmount: 'Clearing Cost',
  transportationAllocatedAmount: 'Local Transport', oceanFreightAllocatedAmount: 'Ocean Freight',
  totalCost: 'Total Cost', perItemCost: 'Per Item Cost',
  profitDcPercent: 'Profit DC %', profit: 'Profit', afterDcPercent: 'After DC %',
  ibtAmount: 'IBT Amount', branchGpPercent: 'Branch GP %',
  salePriceExclVat: 'Sale Price Excl. VAT', salePriceWithVat: 'Sale Price With VAT',
  spRoundoff: 'SP Roundoff', spRoundFinalCalc: 'SP Round Final',
  spWithoutVat: 'SP Without VAT', gpAmountBranch: 'GP Amount Branch',
  branchGpRatio: 'Branch GP Ratio', ibtTotal: 'IBT Total',
  profitDc: 'Profit DC', profitBranch: 'Profit Branch', profitPerItemDc: 'Profit Per Item DC',
};

// Columns user can edit in grid (when not read-only)
const EDITABLE_PRICING_COLS = new Set(['profitDcPercent', 'ibtAmount', 'branchGpPercent', 'salePriceExclVat', 'spRoundFinalCalc']);

// ── Calculation ───────────────────────────────────────────────────────────────
function roundUp(value: number, threshold: number): number {
  if (value <= 0) return value;
  if (threshold > 50) {
    return Math.ceil(value / 5) * 5;
  }
  return Math.ceil(value);
}

function calcRow(
  base: WorkspaceItem,
  spRoundFinalAdjustment: number,
): GridRow {
  const totalCost =
    base.totalAmountZar +
    base.dutyAllocatedAmount +
    base.clearingAllocatedAmount +
    base.transportationAllocatedAmount +
    base.oceanFreightAllocatedAmount;

  const perItemCost = base.quantity > 0 ? totalCost / base.quantity : 0;
  const profitDcPercent = base.profitDcPercent ?? 10;
  const profit = perItemCost * profitDcPercent / 100;
  const afterDcPercent = perItemCost + profit;
  const ibtAmount = base.ibtAmount > 0 ? base.ibtAmount : afterDcPercent;
  const branchGpPercent = base.branchGpPercent ?? 30;
  const tax = base.productTax ?? 15;

  const salePriceExclVat = ibtAmount + ibtAmount * branchGpPercent / 100;
  const vatAmount = salePriceExclVat * tax / 100;
  const salePriceWithVat = salePriceExclVat + vatAmount;

  const spRoundoff = roundUp(salePriceWithVat, perItemCost);
  const spRoundFinalCalc = Math.max(0, spRoundoff - spRoundFinalAdjustment);
  const spWithoutVat = tax > 0 ? spRoundFinalCalc / (1 + tax / 100) : spRoundFinalCalc;
  const gpAmountBranch = spWithoutVat - ibtAmount;
  const branchGpRatio = spWithoutVat > 0 ? gpAmountBranch / spWithoutVat * 100 : 0;
  const ibtTotal = ibtAmount * base.quantity;
  const profitDc = ibtTotal - totalCost;
  const profitBranch = gpAmountBranch * base.quantity;
  const profitPerItemDc = base.quantity > 0 ? profitDc / base.quantity : 0;

  return {
    ...base,
    profitDcPercent,
    ibtAmount,
    branchGpPercent,
    totalCost,
    perItemCost,
    profit,
    afterDcPercent,
    salePriceExclVat,
    salePriceWithVat,
    spRoundoff,
    spRoundFinalCalc: base.spRoundFinal ?? spRoundFinalCalc,
    spWithoutVat,
    gpAmountBranch,
    branchGpRatio,
    ibtTotal,
    profitDc,
    profitBranch,
    profitPerItemDc,
  };
}

function allocateCosts(
  items: WorkspaceItem[],
  costHeads: WorkspaceCostHead[],
): WorkspaceItem[] {
  const dutyHead = costHeads.find(c => c.costHead === 'Duty');
  const clearingHead = costHeads.find(c => c.costHead === 'Clearing Cost');
  const transportHead = costHeads.find(c => c.costHead === 'Local Transportation');
  const oceanHead = costHeads.find(c => c.costHead === 'Ocean Freight');

  const totalZar = items.reduce((s, r) => s + r.totalAmountZar, 0);
  const totalCbm = items.reduce((s, r) => s + r.cbm, 0);

  const allocate = (
    head: WorkspaceCostHead | undefined,
    item: WorkspaceItem,
    existingValue: number,
  ): number => {
    if (!head) return existingValue;
    if (head.allocationMethod === 'Custom') return existingValue;
    const total = head.finalAmountUsed;
    if (head.allocationMethod === 'Amount') {
      return totalZar > 0 ? total * item.totalAmountZar / totalZar : 0;
    }
    // CBM
    return totalCbm > 0 ? total * item.cbm / totalCbm : 0;
  };

  return items.map(item => ({
    ...item,
    dutyAllocatedAmount: allocate(dutyHead, item, item.dutyAllocatedAmount),
    clearingAllocatedAmount: allocate(clearingHead, item, item.clearingAllocatedAmount),
    transportationAllocatedAmount: allocate(transportHead, item, item.transportationAllocatedAmount),
    oceanFreightAllocatedAmount: allocate(oceanHead, item, item.oceanFreightAllocatedAmount),
  }));
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { bg: string; text: string }> = {
  'Not Created': { bg: 'bg-gray-100', text: 'text-gray-600' },
  Draft:         { bg: 'bg-blue-100', text: 'text-blue-700' },
  Requested:     { bg: 'bg-amber-100', text: 'text-amber-700' },
  Rejected:      { bg: 'bg-red-100', text: 'text-red-700' },
  Approved:      { bg: 'bg-green-100', text: 'text-green-700' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CFG[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {status}
    </span>
  );
};

// ── Number formatting ─────────────────────────────────────────────────────────
const fmt = (n: number, d = 2) =>
  isNaN(n) ? '0.00' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtDate = (v?: string | null) => {
  if (!v) return '-';
  try { return new Date(v).toLocaleDateString(); } catch { return v; }
};

// ── Pure helper: build grid rows (outside component, no deps issue) ───────────
function buildGridRows(items: WorkspaceItem[], heads: WorkspaceCostHead[], pricingState: PricingState): GridRow[] {
  // Normalise loadedQuantity → quantity
  const normalised = items.map(item => ({
    ...item,
    quantity: item.loadedQuantity ?? item.quantity,
  }));
  const allocated = allocateCosts(normalised, heads);
  return allocated.map(item => {
    const base: WorkspaceItem = {
      ...item,
      profitDcPercent: item.profitDcPercent > 0 ? item.profitDcPercent : pricingState.profitDcPercent,
      branchGpPercent: item.branchGpPercent > 0 ? item.branchGpPercent : pricingState.branchGpPercent,
      productTax: item.productTax > 0 ? item.productTax : pricingState.taxVatPercent,
    };
    return calcRow(base, pricingState.spRoundFinalAdjustment);
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export const ContainerCostingWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerCostingId = id ? parseInt(id) : null;

  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [costHeads, setCostHeads] = useState<WorkspaceCostHead[]>([]);
  const [pricing, setPricing] = useState<PricingState>({
    profitDcPercent: 10,
    branchGpPercent: 30,
    costAdjustmentPercent: 10,
    taxVatPercent: 15,
    spRoundFinalAdjustment: 0.1,
    costingType: 'Actual',
    remarks: '',
  });
  const [gridRows, setGridRows] = useState<GridRow[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('Basic');
  const tableRef = useRef<HTMLDivElement>(null);
  // Guard against double-invocation in React StrictMode
  const fetchedRef = useRef(false);

  const addToast = (type: 'success' | 'error', message: string) => {
    const toastIdVal = ++_toastId;
    setToasts(prev => [...prev, { id: toastIdVal, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastIdVal)), 4500);
  };

  const loadWorkspace = async () => {
    if (!containerCostingId) return;
    setLoading(true);
    try {
      const ws = await containerCostingsService.getWorkspace(containerCostingId);
      setWorkspace(ws);

      const heads = ws.costHeads ?? [];
      setCostHeads(heads);

      const pi = ws.pricingInputs;
      const pricingState: PricingState = {
        profitDcPercent: pi?.profitDcPercent ?? 10,
        branchGpPercent: pi?.branchGpPercent ?? 30,
        costAdjustmentPercent: pi?.costAdjustmentPercent ?? 10,
        taxVatPercent: pi?.taxVatPercent ?? 15,
        spRoundFinalAdjustment: pi?.spRoundFinalAdjustment ?? 0.1,
        costingType: (pi?.costingType as CostingType) ?? 'Actual',
        remarks: pi?.remarks ?? '',
      };
      setPricing(pricingState);
      setGridRows(buildGridRows(ws.items ?? [], heads, pricingState));
    } catch (err: any) {
      addToast('error', err?.response?.data?.message ?? 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild grid whenever costHeads or pricing changes (not on every keypress — use explicit recalculate)
  const handleRecalculate = () => {
    if (!workspace) return;
    setGridRows(buildGridRows(workspace.items ?? [], costHeads, pricing));
    addToast('success', 'Grid recalculated.');
  };

  // ── Cost head change ──────────────────────────────────────────────────────
  const updateCostHead = (idx: number, field: keyof WorkspaceCostHead, value: any) => {
    const updated = costHeads.map((h, i) => i === idx ? { ...h, [field]: value } : h);
    // If allocationMethod changes to non-Custom, recalculate finalAmountUsed from actual/anticipated
    if (field === 'allocationMethod' || field === 'anticipatedAmount') {
      const h = updated[idx];
      if (h.amountSourceType === 'Actual') {
        updated[idx] = { ...h, finalAmountUsed: h.actualAmount };
      } else {
        updated[idx] = { ...h, finalAmountUsed: h.anticipatedAmount };
      }
    }
    if (field === 'finalAmountUsed') {
      updated[idx] = { ...updated[idx], finalAmountUsed: parseFloat(value) || 0 };
    }
    setCostHeads(updated);
  };

  // ── Grid row edit ─────────────────────────────────────────────────────────
  const updateGridRow = (rowIdx: number, field: string, rawValue: string) => {
    const value = parseFloat(rawValue) || 0;
    const row = { ...gridRows[rowIdx], [field]: value };

    // For editable pricing fields recalculate this row
    const recalced = calcRow(
      {
        containerCostingItemId: row.containerCostingItemId,
        poNumber: row.poNumber,
        supplierName: row.supplierName,
        itemCode: row.itemCode,
        itemDescription: row.itemDescription,
        quantity: row.quantity,
        uom: row.uom,
        cbm: row.cbm,
        unitPriceUsd: row.unitPriceUsd,
        totalAmountUsd: row.totalAmountUsd,
        totalAmountZar: row.totalAmountZar,
        productTax: row.productTax,
        dutyAllocatedAmount: row.dutyAllocatedAmount,
        clearingAllocatedAmount: row.clearingAllocatedAmount,
        transportationAllocatedAmount: row.transportationAllocatedAmount,
        oceanFreightAllocatedAmount: row.oceanFreightAllocatedAmount,
        ibtAmount: field === 'ibtAmount' ? value : row.ibtAmount,
        profitDcPercent: field === 'profitDcPercent' ? value : row.profitDcPercent,
        branchGpPercent: field === 'branchGpPercent' ? value : row.branchGpPercent,
        spRoundFinal: field === 'spRoundFinalCalc' ? value : row.spRoundFinalCalc,
      },
      pricing.spRoundFinalAdjustment,
    );

    const updated = gridRows.map((r, i) => i === rowIdx ? recalced : r);
    setGridRows(updated);
  };

  // ── Custom allocation grid update ─────────────────────────────────────────
  const costHeadToRowField: Record<string, keyof GridRow> = {
    'Duty': 'dutyAllocatedAmount',
    'Clearing Cost': 'clearingAllocatedAmount',
    'Local Transportation': 'transportationAllocatedAmount',
    'Ocean Freight': 'oceanFreightAllocatedAmount',
  };

  const updateCustomAllocation = (rowIdx: number, costHeadName: string, rawValue: string) => {
    const value = parseFloat(rawValue) || 0;
    const field = costHeadToRowField[costHeadName];
    if (!field) return;
    const row = gridRows[rowIdx];
    const updatedBase: WorkspaceItem = {
      containerCostingItemId: row.containerCostingItemId,
      poNumber: row.poNumber,
      supplierName: row.supplierName,
      itemCode: row.itemCode,
      itemDescription: row.itemDescription,
      quantity: row.quantity,
      uom: row.uom,
      cbm: row.cbm,
      unitPriceUsd: row.unitPriceUsd,
      totalAmountUsd: row.totalAmountUsd,
      totalAmountZar: row.totalAmountZar,
      productTax: row.productTax,
      dutyAllocatedAmount: row.dutyAllocatedAmount,
      clearingAllocatedAmount: row.clearingAllocatedAmount,
      transportationAllocatedAmount: row.transportationAllocatedAmount,
      oceanFreightAllocatedAmount: row.oceanFreightAllocatedAmount,
      ibtAmount: row.ibtAmount,
      profitDcPercent: row.profitDcPercent,
      branchGpPercent: row.branchGpPercent,
      spRoundFinal: row.spRoundFinalCalc,
      [field]: value,
    };
    const recalced = calcRow(updatedBase, pricing.spRoundFinalAdjustment);
    setGridRows(prev => prev.map((r, i) => i === rowIdx ? recalced : r));
  };

  // ── Save draft ────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!containerCostingId || !workspace) return;
    setSubmitting(true);
    try {
      const payload: SavePayload = {
        costAdjustmentPercent: pricing.costAdjustmentPercent,
        profitMarginPercent: pricing.profitDcPercent,
        branchGpPercent: pricing.branchGpPercent,
        spRoundoff: pricing.spRoundFinalAdjustment,
        spRoundFinal: pricing.spRoundFinalAdjustment,
        remarks: pricing.remarks,
        costHeads: costHeads.map(h => ({
          containerCostingCostHeadId: h.containerCostingCostHeadId,
          costHead: h.costHead,
          amountSourceType: h.amountSourceType,
          allocationMethod: h.allocationMethod,
          actualAmount: h.actualAmount,
          anticipatedAmount: h.anticipatedAmount,
          finalAmountUsed: h.finalAmountUsed,
        })),
        items: gridRows.map(r => ({
          containerCostingItemId: r.containerCostingItemId,
          poAllocatedAmountZar: r.totalAmountZar,
          dutyAllocatedAmount: r.dutyAllocatedAmount,
          clearingAllocatedAmount: r.clearingAllocatedAmount,
          transportationAllocatedAmount: r.transportationAllocatedAmount,
          oceanFreightAllocatedAmount: r.oceanFreightAllocatedAmount,
          ibtAmount: r.ibtAmount,
        })),
      };
      await containerCostingsService.saveDraft(containerCostingId, payload);
      addToast('success', 'Draft saved successfully.');
      await loadWorkspace();
    } catch (err: any) {
      addToast('error', err?.response?.data?.message ?? 'Failed to save draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!containerCostingId) return;
    setSubmitting(true);
    try {
      await containerCostingsService.requestApproval(containerCostingId);
      addToast('success', 'Approval requested successfully.');
      await loadWorkspace();
    } catch (err: any) {
      addToast('error', err?.response?.data?.message ?? 'Failed to request approval.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!containerCostingId) return;
    setSubmitting(true);
    try {
      await containerCostingsService.approve(containerCostingId);
      addToast('success', 'Costing approved successfully.');
      await loadWorkspace();
    } catch (err: any) {
      addToast('error', err?.response?.data?.message ?? 'Failed to approve.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!containerCostingId) return;
    setShowRejectModal(false);
    setSubmitting(true);
    try {
      await containerCostingsService.reject(containerCostingId);
      addToast('success', 'Costing rejected.');
      await loadWorkspace();
    } catch (err: any) {
      addToast('error', err?.response?.data?.message ?? 'Failed to reject.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const status: CostingStatus = workspace?.costingStatus ?? 'Draft';
  const isReadOnly = status === 'Requested' || status === 'Approved';
  const isEditable = status === 'Draft' || status === 'Rejected';

  const summary = workspace?.summary;

  const totalLandedCost = gridRows.reduce((s, r) => s + r.totalCost, 0);
  const avgPerItemCost = gridRows.length > 0 ? totalLandedCost / gridRows.length : 0;
  const ibtTotalSum = gridRows.reduce((s, r) => s + r.ibtTotal, 0);
  const avgIbt = gridRows.length > 0 ? gridRows.reduce((s, r) => s + r.ibtAmount, 0) / gridRows.length : 0;
  const sellingTotal = gridRows.reduce((s, r) => s + r.spRoundFinalCalc * r.quantity, 0);
  const totalProfitDc = gridRows.reduce((s, r) => s + r.profitDc, 0);
  const totalProfitBranch = gridRows.reduce((s, r) => s + r.profitBranch, 0);

  // Totals row for table footer
  const totalsRow = {
    totalAmountZar: gridRows.reduce((s, r) => s + r.totalAmountZar, 0),
    dutyAllocatedAmount: gridRows.reduce((s, r) => s + r.dutyAllocatedAmount, 0),
    clearingAllocatedAmount: gridRows.reduce((s, r) => s + r.clearingAllocatedAmount, 0),
    transportationAllocatedAmount: gridRows.reduce((s, r) => s + r.transportationAllocatedAmount, 0),
    oceanFreightAllocatedAmount: gridRows.reduce((s, r) => s + r.oceanFreightAllocatedAmount, 0),
    totalCost: totalLandedCost,
    cbm: gridRows.reduce((s, r) => s + r.cbm, 0),
    quantity: gridRows.reduce((s, r) => s + r.quantity, 0),
    totalAmountUsd: gridRows.reduce((s, r) => s + r.totalAmountUsd, 0),
    ibtTotal: ibtTotalSum,
    profitDc: totalProfitDc,
    profitBranch: totalProfitBranch,
  };

  const visibleCols = VIEW_COLS[viewMode];

  const isCustomHead = (headName: string) => {
    const h = costHeads.find(c => c.costHead === headName);
    return h?.allocationMethod === 'Custom';
  };

  const isColEditable = (col: string, row: GridRow) => {
    if (isReadOnly) return false;
    if (EDITABLE_PRICING_COLS.has(col)) return true;
    if (col === 'dutyAllocatedAmount') return isCustomHead('Duty');
    if (col === 'clearingAllocatedAmount') return isCustomHead('Clearing Cost');
    if (col === 'transportationAllocatedAmount') return isCustomHead('Local Transportation');
    if (col === 'oceanFreightAllocatedAmount') return isCustomHead('Ocean Freight');
    return false;
  };

  // Sticky left offsets for pinned cols (px)
  const PINNED_WIDTHS = [80, 140, 100, 180, 80, 60];
  const pinnedLeftOf = (colIdx: number) => PINNED_WIDTHS.slice(0, colIdx).reduce((a, b) => a + b, 0);

  const renderCell = (col: string, row: GridRow, rowIdx: number) => {
    const val = (row as any)[col];
    const numericCols = new Set([
      'cbm', 'unitPriceUsd', 'totalAmountUsd', 'totalAmountZar',
      'dutyAllocatedAmount', 'clearingAllocatedAmount', 'transportationAllocatedAmount',
      'oceanFreightAllocatedAmount', 'totalCost', 'perItemCost', 'profit', 'afterDcPercent',
      'ibtAmount', 'salePriceExclVat', 'salePriceWithVat', 'spRoundoff', 'spRoundFinalCalc',
      'spWithoutVat', 'gpAmountBranch', 'ibtTotal', 'profitDc', 'profitBranch', 'profitPerItemDc',
    ]);
    const pctCols = new Set(['profitDcPercent', 'branchGpPercent', 'branchGpRatio']);

    if (isColEditable(col, row)) {
      const isCustomAllocCol = ['dutyAllocatedAmount', 'clearingAllocatedAmount', 'transportationAllocatedAmount', 'oceanFreightAllocatedAmount'].includes(col);
      const costHeadMap: Record<string, string> = {
        dutyAllocatedAmount: 'Duty',
        clearingAllocatedAmount: 'Clearing Cost',
        transportationAllocatedAmount: 'Local Transportation',
        oceanFreightAllocatedAmount: 'Ocean Freight',
      };
      return (
        <input
          type="number"
          step="0.01"
          defaultValue={typeof val === 'number' ? val.toFixed(2) : val}
          onBlur={e => {
            if (isCustomAllocCol) {
              updateCustomAllocation(rowIdx, costHeadMap[col], e.target.value);
            } else {
              updateGridRow(rowIdx, col, e.target.value);
            }
          }}
          className="w-24 px-1.5 py-0.5 border border-blue-300 rounded text-xs text-right bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      );
    }

    if (pctCols.has(col)) return <span className="text-right block">{fmt(val, 2)}%</span>;
    if (col === 'quantity') return <span className="text-right block">{val?.toLocaleString() ?? '-'}</span>;
    if (numericCols.has(col)) return <span className="text-right block">{fmt(val ?? 0)}</span>;
    return <span>{val ?? '-'}</span>;
  };

  const renderFooterCell = (col: string) => {
    const footerMap: Record<string, number> = {
      totalAmountZar: totalsRow.totalAmountZar,
      dutyAllocatedAmount: totalsRow.dutyAllocatedAmount,
      clearingAllocatedAmount: totalsRow.clearingAllocatedAmount,
      transportationAllocatedAmount: totalsRow.transportationAllocatedAmount,
      oceanFreightAllocatedAmount: totalsRow.oceanFreightAllocatedAmount,
      totalCost: totalsRow.totalCost,
      cbm: totalsRow.cbm,
      quantity: totalsRow.quantity,
      totalAmountUsd: totalsRow.totalAmountUsd,
      ibtTotal: totalsRow.ibtTotal,
      profitDc: totalsRow.profitDc,
      profitBranch: totalsRow.profitBranch,
    };
    if (col === 'poNumber') return <span className="font-semibold text-sm">Total</span>;
    if (col === 'quantity') return <span className="block text-right font-semibold text-sm">{totalsRow.quantity.toLocaleString()}</span>;
    if (col === 'cbm') return <span className="block text-right font-semibold text-sm">{fmt(totalsRow.cbm, 3)}</span>;
    if (footerMap[col] !== undefined) return <span className="block text-right font-semibold text-sm">{fmt(footerMap[col])}</span>;
    return null;
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]" />
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!workspace && !loading) {
    return (
      <div className="p-6 space-y-4">
        <Button onClick={() => navigate('/costing/container-costing')} variant="secondary" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Button>
        <Card className="p-8 text-center text-red-600">Failed to load costing workspace.</Card>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
              t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Reject confirmation modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Reject Costing</h3>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Are you sure you want to reject this costing? This will allow it to be edited and re-submitted.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white">
                Reject Costing
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-6 pb-40 space-y-5">
        {/* ── Page header ────────────────────────────────────────────────── */}
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mb-3">
            <Link to="/costing/container-costing" className="hover:text-[var(--color-primary)] transition-colors">
              Container Costing
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--color-text)]">Workspace</span>
          </nav>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                Container Costing — {summary?.containerNo ?? ''}
              </h1>
              <StatusBadge status={status} />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="secondary"
                onClick={handleRecalculate}
                disabled={submitting}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recalculate
              </Button>

              {isEditable && (
                <>
                  <Button
                    variant="secondary"
                    onClick={handleSaveDraft}
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? <div className="animate-spin h-4 w-4 rounded-full border-b-2 border-current" /> : <Save className="w-4 h-4" />}
                    Save Draft
                  </Button>
                  <Button
                    onClick={handleRequestApproval}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white hover:opacity-90"
                  >
                    <Send className="w-4 h-4" />
                    Request Approval
                  </Button>
                </>
              )}

              {status === 'Requested' && (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Container Summary Card ──────────────────────────────────────── */}
        <div
          className="rounded-xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #0f2942) 100%)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">Container Summary</p>
          <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
            {/* Container identity */}
            <div className="flex items-center gap-3 min-w-[140px]">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Box className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white leading-tight">{summary?.containerNo}</p>
                {summary?.mscu && <p className="text-xs text-white/60">{summary.mscu}</p>}
                {summary?.containerType && <p className="text-xs text-white/50">{summary.containerType}</p>}
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block self-center" />

            {/* Stats chips */}
            {[
              { icon: Ship, label: 'Shipping Company', value: summary?.shippingCompanyName },
              { icon: Ship, label: 'Ocean Freight Co.', value: summary?.oceanFreightCompanyName },
              { icon: Calendar, label: 'ETD', value: fmtDate(summary?.etd) },
              { icon: Calendar, label: 'ETA', value: fmtDate(summary?.eta) },
              { icon: Package, label: 'PO Count', value: summary?.poCount },
              { icon: Package, label: 'Total Items', value: summary?.totalItems },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white/50">{label}</p>
                  <p className="text-sm font-semibold text-white">{value ?? '-'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Financial summary row */}
          {(summary?.totalPoPaymentZar !== undefined || summary?.totalLandedAmount !== undefined) && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'PO Payment (ZAR)', value: summary?.totalPoPaymentZar },
                { label: 'Duty', value: summary?.totalDuty },
                { label: 'Clearing Cost', value: summary?.totalClearingCost },
                { label: 'Transportation', value: summary?.totalTransportation },
                { label: 'Ocean Freight', value: summary?.totalOceanFreight },
                { label: 'Total CBM', value: summary?.totalCbm, isCbm: true },
                { label: 'Landed Amount', value: summary?.totalLandedAmount, highlight: true },
              ].map(({ label, value, isCbm, highlight }) => (
                <div key={label} className={`rounded-lg p-2.5 ${highlight ? 'bg-white/20' : 'bg-white/10'}`}>
                  <p className="text-[10px] text-white/50 uppercase tracking-wide leading-tight">{label}</p>
                  <p className={`text-sm font-bold mt-0.5 text-white ${highlight ? '' : ''}`}>
                    {value !== undefined && value !== null ? (isCbm ? fmt(value as number, 3) : fmt(value as number)) : '-'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Cost Inputs + Pricing Inputs ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
          {/* Cost Inputs card */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Cost Inputs (ZAR)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Cost Head', 'Actual (From System)', 'Anticipated (ZAR)', 'Final (ZAR)', 'Source', 'Allocation Basis', 'Action'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {costHeads.map((head, idx) => (
                    <tr key={head.containerCostingCostHeadId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-[var(--color-text)] whitespace-nowrap">{head.costHead}</td>
                      <td className="px-3 py-2.5 text-right text-[var(--color-text)]">{fmt(head.actualAmount)}</td>
                      <td className="px-3 py-2.5">
                        {head.amountSourceType !== 'Actual' && !isReadOnly ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={head.anticipatedAmount.toFixed(2)}
                            onBlur={e => updateCostHead(idx, 'anticipatedAmount', parseFloat(e.target.value) || 0)}
                            className="w-24 px-1.5 py-0.5 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          />
                        ) : (
                          <span className="block text-right text-[var(--color-text)]">{fmt(head.anticipatedAmount)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-[var(--color-text)]">{fmt(head.finalAmountUsed)}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {head.amountSourceType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {!isReadOnly ? (
                          <select
                            value={head.allocationMethod}
                            onChange={e => updateCostHead(idx, 'allocationMethod', e.target.value as AllocationMethod)}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          >
                            {['Amount', 'CBM', 'Custom'].map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[var(--color-text)]">{head.allocationMethod}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {!isReadOnly && (
                          <button
                            onClick={() => {
                              const h = costHeads[idx];
                              updateCostHead(idx, 'finalAmountUsed', h.amountSourceType === 'Actual' ? h.actualAmount : h.anticipatedAmount);
                            }}
                            className="text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                            title="Reset final amount"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-3 py-2.5 font-semibold text-[var(--color-text)]">Total Landed Cost</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[var(--color-text)]">
                      {fmt(costHeads.reduce((s, h) => s + h.actualAmount, 0))}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[var(--color-text)]">
                      {fmt(costHeads.reduce((s, h) => s + h.anticipatedAmount, 0))}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[var(--color-text)]">
                      {fmt(costHeads.reduce((s, h) => s + h.finalAmountUsed, 0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                All amounts are in ZAR. Allocation basis defines how the cost is distributed to items.
              </p>
            </div>
          </Card>

          {/* Pricing Inputs card */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--color-text)] pb-1 border-b border-gray-100">Pricing Inputs</h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Profit DC %', field: 'profitDcPercent', suffix: '%' },
                { label: 'Branch GP %', field: 'branchGpPercent', suffix: '%' },
                { label: 'Cost Adjustment %', field: 'costAdjustmentPercent', suffix: '%' },
                { label: 'Tax (VAT) %', field: 'taxVatPercent', suffix: '%' },
              ].map(({ label, field, suffix }) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      disabled={isReadOnly}
                      value={(pricing as any)[field]}
                      onChange={e => setPricing(p => ({ ...p, [field]: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:bg-gray-50 disabled:text-gray-400 text-right"
                    />
                    <span className="text-xs text-gray-400">{suffix}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Final Adjustment</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={isReadOnly}
                  value={pricing.spRoundFinalAdjustment}
                  onChange={e => setPricing(p => ({ ...p, spRoundFinalAdjustment: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:bg-gray-50 text-right"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Costing Type</label>
                <select
                  disabled={isReadOnly}
                  value={pricing.costingType}
                  onChange={e => setPricing(p => ({ ...p, costingType: e.target.value as CostingType }))}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:bg-gray-50"
                >
                  <option value="Actual">Actual</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Remarks</label>
              <textarea
                disabled={isReadOnly}
                rows={2}
                value={pricing.remarks}
                onChange={e => setPricing(p => ({ ...p, remarks: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:bg-gray-50 resize-none"
              />
            </div>

            {!isReadOnly && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRecalculate}
                className="w-full text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Apply & Recalculate
              </Button>
            )}

            <p className="text-[11px] text-gray-400 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              These values will be used to calculate IBT and Selling Prices.
            </p>
          </Card>
        </div>

        {/* ── Grid section ─────────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          {/* View toggle bar */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {(['Basic', 'Landed Cost', 'IBT', 'Selling Price', 'Profit', 'Full View'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === v
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 border border-gray-200 rounded-md cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto" ref={tableRef}>
            <table className="text-xs border-separate border-spacing-0 w-full">
              <thead>
                <tr className="bg-gray-50">
                  {visibleCols.map((col, ci) => {
                    const isPinned = PINNED_COLS.includes(col);
                    const pinnedIdx = PINNED_COLS.indexOf(col);
                    return (
                      <th
                        key={col}
                        className={`px-3 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 ${
                          isPinned ? 'sticky z-20 bg-gray-50' : ''
                        } ${ci < PINNED_COLS.length - 1 && isPinned ? '' : isPinned ? 'border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]' : ''}`}
                        style={isPinned ? { left: pinnedLeftOf(pinnedIdx) } : undefined}
                      >
                        {COL_LABELS[col]}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {gridRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleCols.length} className="px-4 py-10 text-center text-gray-400">
                      No items found in this costing.
                    </td>
                  </tr>
                ) : (
                  gridRows.map((row, rowIdx) => (
                    <tr key={row.containerCostingItemId} className="hover:bg-blue-50/30 transition-colors">
                      {visibleCols.map((col, ci) => {
                        const isPinned = PINNED_COLS.includes(col);
                        const pinnedIdx = PINNED_COLS.indexOf(col);
                        return (
                          <td
                            key={col}
                            className={`px-3 py-2.5 text-[var(--color-text)] ${
                              isPinned ? 'sticky z-10 bg-white hover:bg-blue-50/30' : ''
                            } ${isPinned && pinnedIdx === PINNED_COLS.length - 1 ? 'border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]' : ''}`}
                            style={isPinned ? { left: pinnedLeftOf(pinnedIdx) } : undefined}
                          >
                            {renderCell(col, row, rowIdx)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
              {gridRows.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-300">
                    {visibleCols.map((col, ci) => {
                      const isPinned = PINNED_COLS.includes(col);
                      const pinnedIdx = PINNED_COLS.indexOf(col);
                      return (
                        <td
                          key={col}
                          className={`px-3 py-2.5 text-[var(--color-text)] ${
                            isPinned ? 'sticky z-10 bg-gray-50' : ''
                          }`}
                          style={isPinned ? { left: pinnedLeftOf(pinnedIdx) } : undefined}
                        >
                          {renderFooterCell(col)}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>

      {/* ── Sticky summary footer ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.07)]">
        <div className="px-6 py-3 overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max">
            {[
              { label: 'Total Landed Cost (ZAR)', value: totalLandedCost, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Avg. Per Item Cost (ZAR)', value: avgPerItemCost, icon: Package, color: 'text-teal-600', bg: 'bg-teal-50' },
              { label: 'IBT Total (ZAR)', value: ibtTotalSum, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Avg. IBT (ZAR)', value: avgIbt, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Selling Total (ZAR)', value: sellingTotal, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Profit DC (ZAR)', value: totalProfitDc, icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Total Profit Branch (ZAR)', value: totalProfitBranch, icon: DollarSign, color: 'text-sky-600', bg: 'bg-sky-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 leading-tight">{label}</p>
                  <p className={`text-sm font-bold ${color} leading-tight`}>{fmt(value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
