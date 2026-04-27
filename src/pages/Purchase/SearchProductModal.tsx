import { useState, useEffect, useMemo } from 'react';
import { X, Search, AlertCircle, ChevronLeft, ChevronRight, Star, Anchor, MessageCircle, Filter, ListChecks } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProductHierarchyTree } from './ProductHierarchyTree';
import productSearchService, {
  type HierarchyNode,
  type SearchProductResult,
} from '../../services/productSearchService';
import { suppliersService, type Supplier } from '../../services/suppliersService';

interface SearchProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierName: string;
  supplierId: number;
  onAddProducts: (products: SearchProductResult[]) => void;
  existingProductIds: Set<number>;
}

const PAGE_SIZE = 10;

const STOCK_COLOR_BANDS = [
  { key: 'lte50', label: '<50', min: 0, max: 50, bg: '#DC2626', text: '#FFFFFF' },
  { key: '51-60', label: '51-60', min: 51, max: 60, bg: '#F59E0B', text: '#000000' },
  { key: '61-70', label: '61-70', min: 61, max: 70, bg: '#10B981', text: '#FFFFFF' },
  { key: '71-80', label: '71-80', min: 71, max: 80, bg: '#06B6D4', text: '#FFFFFF' },
  { key: '81-90', label: '81-90', min: 81, max: 90, bg: '#EC4899', text: '#FFFFFF' },
  { key: '91-99', label: '91-99', min: 91, max: 99, bg: '#22C55E', text: '#FFFFFF' },
  { key: '100', label: '100', min: 100, max: Infinity, bg: '#E5E7EB', text: '#374151' },
] as const;

export const SearchProductModal = ({
  isOpen,
  onClose,
  supplierName,
  supplierId,
  onAddProducts,
  existingProductIds,
}: SearchProductModalProps) => {
  const [hierarchyNodes, setHierarchyNodes] = useState<HierarchyNode[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<SearchProductResult[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);
  const [supplierDetails, setSupplierDetails] = useState<Supplier | null>(null);
  const [loadingSupplier, setLoadingSupplier] = useState(false);
  const [searched, setSearched] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [gridFilter, setGridFilter] = useState('');
  const [editableData, setEditableData] = useState<Map<number, { finalQty: number; price: number }>>(new Map());
  const [multiplier, setMultiplier] = useState(1);
  const [monthSelection, setMonthSelection] = useState(1);
  const [selectedColorFilters, setSelectedColorFilters] = useState<Set<string>>(new Set());
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [onlyPurchasedFromSupplier, setOnlyPurchasedFromSupplier] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHierarchy();
      fetchSupplierDetails();
      setSelectedKeys(new Set());
      setProducts([]);
      setSelectedProductIds(new Set());
      setSearched(false);
      setValidationError('');
      setCurrentPage(1);
      setGridFilter('');
      setEditableData(new Map());
      setMultiplier(1);
      setMonthSelection(1);
      setSelectedColorFilters(new Set());
      setShowSelectedOnly(false);
      setOnlyPurchasedFromSupplier(false);
    }
  }, [isOpen]);

  const fetchSupplierDetails = async () => {
    if (!supplierId) {
      setSupplierDetails(null);
      return;
    }
    setLoadingSupplier(true);
    try {
      const data = await suppliersService.getById(supplierId);
      setSupplierDetails(data);
    } catch {
      setSupplierDetails(null);
    } finally {
      setLoadingSupplier(false);
    }
  };

  const fetchHierarchy = async () => {
    setLoadingTree(true);
    try {
      const data = await productSearchService.getHierarchyTree();
      setHierarchyNodes(data);
    } catch {
      setHierarchyNodes([]);
    } finally {
      setLoadingTree(false);
    }
  };

  const extractSubTypeIds = (): number[] => {
    const ids: number[] = [];
    selectedKeys.forEach((key) => {
      if (key.startsWith('sub-')) {
        const id = parseInt(key.replace('sub-', ''), 10);
        if (!isNaN(id)) ids.push(id);
      }
    });
    return ids;
  };

  const calculateMonth = (product: SearchProductResult): number => {
    if (monthSelection === 1) return product.avg1Month;
    if (monthSelection === 2) return product.avg2Month / 2;
    return product.avg3Month / 3;
  };

  const calculateYear = (product: SearchProductResult): number => {
    return product.avg1Year / 12;
  };

  const calculateAVG = (product: SearchProductResult): number => {
    const avgMonthVal = calculateMonth(product);
    const yearVal = calculateYear(product);
    return Math.round(((avgMonthVal + yearVal) / 2) * multiplier);
  };

  const calculateREQ = (product: SearchProductResult): number => {
    const avg = calculateAVG(product);
    const req = avg - product.stock;
    return req < 0 ? 0 : req;
  };

  const calculateFinalQty = (product: SearchProductResult): number => {
    const finalQty = calculateREQ(product);
    return finalQty < 0 ? 0 : finalQty;
  };

  const calculateTotalWS = (product: SearchProductResult, finalQty: number): number => {
    return product.weight * finalQty;
  };

  const getStockPercentage = (product: SearchProductResult): number | null => {
    const avg = calculateAVG(product);
    if (avg <= 0) return null;
    return Math.round((product.stock / avg) * 100);
  };

  const getStockBandKey = (product: SearchProductResult): string | null => {
    const per = getStockPercentage(product);
    if (per === null) return null;
    if (per <= 50) return 'lte50';
    if (per <= 60) return '51-60';
    if (per <= 70) return '61-70';
    if (per <= 80) return '71-80';
    if (per <= 90) return '81-90';
    if (per <= 99) return '91-99';
    return '100';
  };

  const getStockCellStyle = (product: SearchProductResult): { backgroundColor?: string; color?: string } | undefined => {
    const avg = calculateAVG(product);
    if (!(product.stock < avg && avg > 0)) return undefined;
    const bandKey = getStockBandKey(product);
    if (!bandKey || bandKey === '100') return undefined;
    const band = STOCK_COLOR_BANDS.find(b => b.key === bandKey);
    if (!band) return undefined;
    return { backgroundColor: band.bg, color: band.text };
  };

  const getEditableOrCalculated = (productId: number, field: 'finalQty' | 'price', product: SearchProductResult): number => {
    const editable = editableData.get(productId);
    if (editable && editable[field] !== undefined && editable[field] !== 0) {
      return editable[field];
    }
    // Return calculated value for finalQty or product.price for price
    if (field === 'finalQty') {
      return calculateFinalQty(product);
    } else {
      return product.price;
    }
  };

  const updateEditableField = (productId: number, field: 'finalQty' | 'price', value: number, product: SearchProductResult) => {
    // Ensure Final Qty is never negative
    if (field === 'finalQty' && value < 0) {
      value = 0;
    }

    setEditableData((prev) => {
      const next = new Map(prev);
      const existing = next.get(productId) || {
        finalQty: calculateFinalQty(product),
        price: product.price
      };
      next.set(productId, { ...existing, [field]: value });
      return next;
    });
  };

  const handleSearch = async () => {
    setValidationError('');

    if (!supplierId) {
      setValidationError('Supplier is not selected on the Purchase Order.');
      return;
    }

    const subTypeIds = extractSubTypeIds();
    if (subTypeIds.length === 0) {
      setValidationError('Please select at least one Sub Type from the hierarchy.');
      return;
    }

    setLoading(true);
    setCurrentPage(1);
    setGridFilter('');
    setEditableData(new Map());
    try {
      const results = await productSearchService.searchProducts({
        supplierId,
        subTypeIds,
        onlyPurchasedFromSupplier,
      });
      setProducts(results);
      setSelectedProductIds(new Set());
      setSelectedColorFilters(new Set());
      setSearched(true);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedKeys(new Set());
    setProducts([]);
    setSelectedProductIds(new Set());
    setSearched(false);
    setValidationError('');
    setCurrentPage(1);
    setGridFilter('');
    setMonthSelection(1);
    setMultiplier(1);
    setEditableData(new Map());
    setSelectedColorFilters(new Set());
    setShowSelectedOnly(false);
    setOnlyPurchasedFromSupplier(false);
  };

  const handleRowCheckboxChange = (productId: number) => {
    if (!productId || existingProductIds.has(productId)) return;

    setSelectedProductIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(productId)) {
        updated.delete(productId);
      } else {
        updated.add(productId);
      }
      return updated;
    });
  };

  const handleColorFilterToggle = (bandKey: string) => {
    const isCurrentlyActive = selectedColorFilters.has(bandKey);

    setSelectedColorFilters(prev => {
      const updated = new Set(prev);
      if (isCurrentlyActive) {
        updated.delete(bandKey);
      } else {
        updated.add(bandKey);
      }
      return updated;
    });

    const matchingProductIds = products
      .filter(p => getStockBandKey(p) === bandKey)
      .filter(p => p.productId && !existingProductIds.has(p.productId))
      .map(p => p.productId);

    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyActive) {
        matchingProductIds.forEach(id => next.delete(id));
      } else {
        matchingProductIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAllCurrentPage = () => {
    const selectableOnPage = paginatedProducts.filter(
      (p) => p.productId && !existingProductIds.has(p.productId)
    );
    if (selectableOnPage.length === 0) return;

    const allSelectedOnPage = selectableOnPage.every((p) => selectedProductIds.has(p.productId));

    setSelectedProductIds((prev) => {
      const updated = new Set(prev);

      if (allSelectedOnPage) {
        selectableOnPage.forEach((p) => updated.delete(p.productId));
      } else {
        selectableOnPage.forEach((p) => updated.add(p.productId));
      }

      return updated;
    });
  };


  const handleAddSelected = () => {
    if (selectedProductIds.size === 0) {
      setValidationError('Please select at least one product to add.');
      return;
    }

    const selectedProducts = products
      .filter((p) => selectedProductIds.has(p.productId))
      .map((p) => {
        const finalQty = getEditableOrCalculated(p.productId, 'finalQty', p);
        const price = getEditableOrCalculated(p.productId, 'price', p);
        return {
          ...p,
          editableFinalQty: finalQty,
          editablePrice: price,
        };
      });
    onAddProducts(selectedProducts);
    onClose();
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    if (showSelectedOnly) {
      result = result.filter((p) => selectedProductIds.has(p.productId));
    }
    if (gridFilter.trim()) {
      const term = gridFilter.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.itemCode?.toLowerCase().includes(term) ||
          p.itemName?.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [products, gridFilter, showSelectedOnly, selectedProductIds]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const selectableOnCurrentPage = paginatedProducts.filter(
    (p) => p.productId && !existingProductIds.has(p.productId)
  );
  const isAllCurrentPageSelected =
    selectableOnCurrentPage.length > 0 &&
    selectableOnCurrentPage.every((p) => selectedProductIds.has(p.productId));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-[80vw] max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  Search Products
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Find and add products to the purchase order
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="secondary"
                className="bg-gray-600 hover:bg-gray-700 text-white flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <div className="p-4 sm:p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F9FAFB' }}>
              {validationError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{validationError}</span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Supplier Details
                </h3>
                {loadingSupplier ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                      <p className="text-sm text-gray-900">
                        {supplierDetails?.supplierName || supplierName || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Performance Rating</label>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <p className="text-sm text-gray-900">
                          {supplierDetails?.performanceRating != null
                            ? `${supplierDetails.performanceRating} / 10`
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ports</label>
                      <div className="flex items-center gap-1.5">
                        <Anchor className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-900 truncate" title={supplierDetails?.ports || ''}>
                          {supplierDetails?.ports || '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Social Media Group</label>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-900 truncate" title={supplierDetails?.socialMediaGroupName || ''}>
                          {supplierDetails?.socialMediaGroupName || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Product Category / Sub Type <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    {loadingTree ? (
                      <div className="border border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500">
                        Loading hierarchy...
                      </div>
                    ) : (
                      <ProductHierarchyTree
                        nodes={hierarchyNodes}
                        selectedKeys={selectedKeys}
                        onSelectionChange={setSelectedKeys}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-[var(--color-primary)] hover:opacity-90 text-white"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                <Button type="button" onClick={handleReset} variant="secondary">
                  Reset
                </Button>
                <label className="flex items-center gap-2 cursor-pointer select-none border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors bg-white">
                  <input
                    type="checkbox"
                    checked={onlyPurchasedFromSupplier}
                    onChange={(e) => setOnlyPurchasedFromSupplier(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Show only previously purchased products
                  </span>
                </label>
              </div>


              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {searched && products.length > 0 && (
                  <div className="px-4 py-3 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative flex-1 max-w-sm min-w-[200px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={gridFilter}
                          onChange={(e) => {
                            setGridFilter(e.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder="Filter by item code, name, or barcode..."
                          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
                        />
                        {gridFilter && (
                          <button
                            type="button"
                            onClick={() => {
                              setGridFilter('');
                              setCurrentPage(1);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {gridFilter.trim() && (
                        <span className="text-xs text-gray-500">
                          {filteredProducts.length} of {products.length} products
                        </span>
                      )}
                      <label className="flex items-center gap-1.5 cursor-pointer select-none border border-gray-300 rounded px-2 py-1.5 hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={showSelectedOnly}
                          onChange={(e) => {
                            setShowSelectedOnly(e.target.checked);
                            setCurrentPage(1);
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <ListChecks className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                          Selected ({selectedProductIds.size})
                        </span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Multiple Of</label>
                        <input
                          type="number"
                          value={multiplier}
                          min={1}
                          max={100}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1 && val <= 100) setMultiplier(val);
                            else if (e.target.value === '') setMultiplier(1);
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-16 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-white text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Month</label>
                        <select
                          value={monthSelection}
                          onChange={(e) => setMonthSelection(Number(e.target.value))}
                          className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-white"
                        >
                          <option value={1}>1 Month</option>
                          <option value={2}>2 Month</option>
                          <option value={3}>3 Month</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-0 ml-auto border border-gray-300 rounded overflow-hidden">
                        {STOCK_COLOR_BANDS.map(band => (
                          <label
                            key={band.key}
                            className="flex items-center gap-1 px-2 py-1.5 cursor-pointer border-r border-gray-300 last:border-r-0 select-none"
                            style={{ backgroundColor: band.bg, color: band.text }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedColorFilters.has(band.key)}
                              onChange={() => handleColorFilterToggle(band.key)}
                              className="w-3.5 h-3.5 rounded border-white accent-green-600"
                            />
                            <span className="text-xs font-semibold whitespace-nowrap">{band.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10 sticky left-0 bg-blue-100 z-10">
                          <input
                            type="checkbox"
                            checked={isAllCurrentPageSelected}
                            onChange={handleSelectAllCurrentPage}
                            className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                          />
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sl No</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Product Code</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Barcode</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">Name</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg 1M</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg 2M</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg 3M</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Year</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 uppercase bg-orange-100">Stock</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase" style={{ display: 'none' }}>Stock %</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Indent</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pending PO</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Month</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Year</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 uppercase bg-yellow-100">AVG</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 uppercase bg-teal-100">REQ</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 uppercase min-w-[90px] bg-green-100">Final Qty</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Item W/S</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total W/S</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 uppercase min-w-[90px] bg-green-100">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={22} className="px-4 py-8 text-center text-gray-500">
                            Searching products...
                          </td>
                        </tr>
                      ) : paginatedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={22} className="px-4 py-8 text-center text-gray-500">
                            {!searched
                              ? 'Select a category and click Search to find products.'
                              : gridFilter.trim()
                              ? 'No products match the filter criteria.'
                              : 'No products found for the selected criteria.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedProducts.map((product, index) => {
                          const isSelected = selectedProductIds.has(product.productId);
                          const isDuplicate = existingProductIds.has(product.productId);
                          const slno = (currentPage - 1) * PAGE_SIZE + index + 1;
                          const monthVal = calculateMonth(product);
                          const yearVal = calculateYear(product);
                          const avgVal = calculateAVG(product);
                          const reqVal = calculateREQ(product);
                          const finalQty = getEditableOrCalculated(product.productId, 'finalQty', product);
                          const totalWS = calculateTotalWS(product, finalQty);
                          const price = getEditableOrCalculated(product.productId, 'price', product);

                          return (
                            <tr
                              key={product.productId}
                              className={`transition-colors ${
                                isDuplicate
                                  ? 'bg-gray-100 opacity-60'
                                  : isSelected
                                  ? 'bg-blue-50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className={`px-2 py-2 sticky left-0 z-10 ${
                                isDuplicate
                                  ? 'bg-blue-100 opacity-60'
                                  : isSelected
                                  ? 'bg-blue-200'
                                  : 'bg-blue-100'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isDuplicate}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleRowCheckboxChange(product.productId);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="px-2 py-2 text-xs text-gray-900">{slno}</td>
                              <td className="px-2 py-2 text-xs font-medium text-gray-900">
                                {product.itemCode}
                                {isDuplicate && (
                                  <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">In PO</span>
                                )}
                              </td>
                              <td className="px-2 py-2 text-xs text-gray-900">{product.barcode || '-'}</td>
                              <td className="px-2 py-2 text-xs text-gray-900">{product.itemName}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900">{product.avg1Month.toFixed(0)}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900">{product.avg2Month.toFixed(0)}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900">{product.avg3Month.toFixed(0)}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900">{product.avg1Year.toFixed(0)}</td>
                              <td
                                className={`px-2 py-2 text-xs text-right font-semibold ${!getStockCellStyle(product) ? 'bg-orange-100 text-gray-900' : ''}`}
                                style={getStockCellStyle(product)}
                              >
                                {product.stock.toFixed(0)}
                              </td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900" style={{ display: 'none' }}>-</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900">{product.indent.toFixed(0)}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900">{product.pendingPo.toFixed(0)}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900">{monthVal.toFixed(0)}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900">{yearVal.toFixed(0)}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900 font-semibold bg-yellow-50">{avgVal}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900 bg-teal-50">{reqVal}</td>
                              <td className="px-2 py-2 text-xs text-right bg-green-50">
                                <input
                                  type="number"
                                  value={finalQty}
                                  min="0"
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const positiveVal = val < 0 ? 0 : val;
                                    updateEditableField(product.productId, 'finalQty', positiveVal, product);
                                  }}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-1 py-1 text-xs text-right border border-gray-300 rounded focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-white"
                                />
                              </td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900">{product.weight.toFixed(2)}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900 font-semibold">{totalWS.toFixed(2)}</td>
                              <td className="px-2 py-2 text-xs text-right text-gray-900">{product.avgCost.toFixed(2)}</td>
                              <td className="px-2 py-2 text-xs text-right bg-green-50">
                                <input
                                  type="number"
                                  value={price}
                                  min="0"
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    updateEditableField(product.productId, 'price', val, product);
                                  }}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onClick={(e) => e.stopPropagation()}
                                  step="0.01"
                                  className="w-full px-1 py-1 text-xs text-right border border-gray-300 rounded focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-white"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredProducts.length > PAGE_SIZE && (
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <span className="text-sm text-gray-700">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                        {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length}{' '}
                        products
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProductIds.size > 0 && (
                  <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
                    <span className="text-sm text-blue-700 font-medium">
                      {selectedProductIds.size} product{selectedProductIds.size !== 1 ? 's' : ''}{' '}
                      selected
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-300">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddSelected}
                  disabled={selectedProductIds.size === 0}
                  className="bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
                >
                  Add Selected Products
                  {selectedProductIds.size > 0 && ` (${selectedProductIds.size})`}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
