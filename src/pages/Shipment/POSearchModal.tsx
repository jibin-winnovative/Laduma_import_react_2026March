import { useState, useEffect, useMemo } from 'react';
import { X, Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';
import { suppliersService } from '../../services/suppliersService';
import { companiesService } from '../../services/companiesService';

export interface ApprovedPO {
  purchaseOrderId: number;
  poNumber: string;
  poDate: string;
  supplierName: string;
  poAmount: number;
  totalCBM: number;
}

interface Company {
  companyId: number;
  companyName: string;
}

interface POSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPOs: (pos: ApprovedPO[]) => void;
  alreadySelectedPOIds: number[];
}

const PAGE_SIZE = 10;

export const POSearchModal = ({
  isOpen,
  onClose,
  onAddPOs,
  alreadySelectedPOIds,
}: POSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ supplierId: number; supplierName: string }>>([]);

  const [purchaseOrders, setPurchaseOrders] = useState<ApprovedPO[]>([]);
  const [selectedPOIds, setSelectedPOIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
      loadSuppliers();
      setSearchTerm('');
      setSelectedCompanyId('');
      setSupplierId('');
      setFromDate('');
      setToDate('');
      setPurchaseOrders([]);
      setSelectedPOIds(new Set());
      setSearched(false);
      setCurrentPage(1);
      setTotalRecords(0);
      setTotalPages(0);
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    try {
      const data = await companiesService.getActive();
      setCompanies(data || []);
    } catch {
      setCompanies([]);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await suppliersService.getDropdown();
      setSuppliers(data);
    } catch {
      setSuppliers([]);
    }
  };

  const handleSearch = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('pageNumber', page.toString());
      params.append('pageSize', PAGE_SIZE.toString());

      if (selectedCompanyId) {
        params.append('companyId', selectedCompanyId.toString());
      }
      if (searchTerm.trim()) {
        params.append('searchTerm', searchTerm.trim());
      }
      if (supplierId) {
        params.append('supplierId', supplierId.toString());
      }
      if (fromDate) {
        params.append('fromDate', fromDate);
      }
      if (toDate) {
        params.append('toDate', toDate);
      }

      const response = await purchaseOrdersService.getApprovedPOs(params.toString());

      setPurchaseOrders(response.data || []);
      setTotalRecords(response.totalRecords || 0);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(response.currentPage || page);
      setSearched(true);
    } catch (error) {
      console.error('Failed to search POs:', error);
      setPurchaseOrders([]);
      setTotalRecords(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCompanyId('');
    setSupplierId('');
    setFromDate('');
    setToDate('');
    setPurchaseOrders([]);
    setSelectedPOIds(new Set());
    setSearched(false);
    setCurrentPage(1);
    setTotalRecords(0);
    setTotalPages(0);
  };

  const handlePageChange = (page: number) => {
    handleSearch(page);
  };

  const handleRowCheckboxChange = (poId: number) => {
    if (alreadySelectedPOIds.includes(poId)) return;

    setSelectedPOIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(poId)) {
        updated.delete(poId);
      } else {
        updated.add(poId);
      }
      return updated;
    });
  };

  const handleSelectAllCurrentPage = () => {
    const selectableOnPage = purchaseOrders.filter(
      (po) => !alreadySelectedPOIds.includes(po.purchaseOrderId)
    );
    if (selectableOnPage.length === 0) return;

    const allSelectedOnPage = selectableOnPage.every((po) => selectedPOIds.has(po.purchaseOrderId));

    setSelectedPOIds((prev) => {
      const updated = new Set(prev);
      if (allSelectedOnPage) {
        selectableOnPage.forEach((po) => updated.delete(po.purchaseOrderId));
      } else {
        selectableOnPage.forEach((po) => updated.add(po.purchaseOrderId));
      }
      return updated;
    });
  };

  const handleAddSelected = () => {
    const selectedPOs = purchaseOrders.filter((po) => selectedPOIds.has(po.purchaseOrderId));
    onAddPOs(selectedPOs);
    onClose();
  };

  const selectableOnCurrentPage = purchaseOrders.filter(
    (po) => !alreadySelectedPOIds.includes(po.purchaseOrderId)
  );
  const isAllCurrentPageSelected =
    selectableOnCurrentPage.length > 0 &&
    selectableOnCurrentPage.every((po) => selectedPOIds.has(po.purchaseOrderId));

  const selectedSummary = useMemo(() => {
    const selected = purchaseOrders.filter((po) => selectedPOIds.has(po.purchaseOrderId));
    const totalAmount = selected.reduce((sum, po) => sum + (po.poAmount || 0), 0);
    const totalCBM = selected.reduce((sum, po) => sum + (po.totalCBM || 0), 0);
    return { count: selectedPOIds.size, totalAmount, totalCBM };
  }, [purchaseOrders, selectedPOIds]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCBM = (cbm: number) => {
    return cbm.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-[80vw] max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  Search Purchase Orders
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Find and add approved purchase orders to the container
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
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Filter Criteria
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
                    >
                      <option value="">All Companies</option>
                      {companies.map((c) => (
                        <option key={c.companyId} value={c.companyId}>
                          {c.companyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search PO number..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map((s) => (
                        <option key={s.supplierId} value={s.supplierId}>
                          {s.supplierName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Button
                    type="button"
                    onClick={() => handleSearch(1)}
                    disabled={loading}
                    className="bg-[var(--color-primary)] hover:opacity-90 text-white"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                  <Button type="button" onClick={handleReset} variant="secondary">
                    Reset
                  </Button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                          <input
                            type="checkbox"
                            checked={isAllCurrentPageSelected}
                            onChange={handleSelectAllCurrentPage}
                            disabled={selectableOnCurrentPage.length === 0}
                            className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">PO Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total CBM</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            Searching purchase orders...
                          </td>
                        </tr>
                      ) : purchaseOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            {!searched
                              ? 'Enter filter criteria and click Search to find purchase orders.'
                              : 'No approved purchase orders found for the selected criteria.'}
                          </td>
                        </tr>
                      ) : (
                        purchaseOrders.map((po) => {
                          const isSelected = selectedPOIds.has(po.purchaseOrderId);
                          const isAlreadyAdded = alreadySelectedPOIds.includes(po.purchaseOrderId);

                          return (
                            <tr
                              key={po.purchaseOrderId}
                              className={`transition-colors cursor-pointer ${
                                isAlreadyAdded
                                  ? 'bg-gray-100 opacity-60'
                                  : isSelected
                                  ? 'bg-blue-50'
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => !isAlreadyAdded && handleRowCheckboxChange(po.purchaseOrderId)}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isAlreadyAdded}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleRowCheckboxChange(po.purchaseOrderId);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {po.poNumber}
                                {isAlreadyAdded && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                    Already Added
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatDate(po.poDate)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{po.supplierName}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                                ${formatCurrency(po.poAmount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {formatCBM(po.totalCBM)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <span className="text-sm text-gray-700">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                        {Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords} purchase orders
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
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
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages || loading}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPOIds.size > 0 && (
                  <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm text-blue-700 font-medium">
                          {selectedSummary.count} PO{selectedSummary.count !== 1 ? 's' : ''} selected
                        </span>
                        <span className="text-sm text-blue-600">
                          Total Amount: <span className="font-semibold">${formatCurrency(selectedSummary.totalAmount)}</span>
                        </span>
                        <span className="text-sm text-blue-600">
                          Total CBM: <span className="font-semibold">{formatCBM(selectedSummary.totalCBM)}</span>
                        </span>
                      </div>
                    </div>
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
                  disabled={selectedPOIds.size === 0}
                  className="bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
                >
                  Add Selected POs
                  {selectedPOIds.size > 0 && ` (${selectedPOIds.size})`}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
