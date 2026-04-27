import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Pencil, Trash2, RefreshCw, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import {
  supplierCouponDiscountsService,
  NATURE_OPTIONS,
  type SupplierCouponDiscount,
} from '../../services/supplierCouponDiscountsService';
import { suppliersService } from '../../services/suppliersService';
import { SupplierCouponDiscountForm } from './SupplierCouponDiscountForm';
import { ViewSupplierCouponDiscount } from './ViewSupplierCouponDiscount';

const PAGE_SIZE = 20;

export const SupplierCouponDiscountsPage = () => {
  const [items, setItems] = useState<SupplierCouponDiscount[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterNature, setFilterNature] = useState('');
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [suppliers, setSuppliers] = useState<{ supplierId: number; supplierName: string }[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    suppliersService
      .getAll()
      .then((data: any) => setSuppliers(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => setSuppliers([]));
  }, []);

  const fetchItems = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params: any = { pageNumber: page, pageSize: PAGE_SIZE };
        if (searchTerm) params.searchTerm = searchTerm;
        if (filterNature) params.nature = filterNature;
        if (filterSupplierId) params.supplierId = parseInt(filterSupplierId, 10);
        if (filterActive !== '') params.isActive = filterActive === 'true';
        const result = await supplierCouponDiscountsService.getList(params);
        setItems(result.data ?? []);
        setTotalRecords(result.totalRecords ?? 0);
        setTotalPages(result.totalPages ?? 1);
        setCurrentPage(result.currentPage ?? page);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, filterNature, filterSupplierId, filterActive]
  );

  useEffect(() => { fetchItems(1); }, [fetchItems]);

  const handleReset = () => {
    setSearchTerm('');
    setFilterNature('');
    setFilterSupplierId('');
    setFilterActive('');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await supplierCouponDiscountsService.delete(deleteId);
      setDeleteId(null);
      fetchItems(currentPage);
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowAddModal(false);
    setEditId(null);
    fetchItems(currentPage);
  };

  const formatAmount = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Supplier Coupons/Discounts</h1>
          <p className="text-sm text-gray-500 mt-1">{totalRecords} record{totalRecords !== 1 ? 's' : ''} found</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />Add New
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchItems(1)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>
          <select value={filterSupplierId} onChange={(e) => setFilterSupplierId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent">
            <option value="">All Suppliers</option>
            {suppliers.map((s) => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}
          </select>
          <select value={filterNature} onChange={(e) => setFilterNature(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent">
            <option value="">All Natures</option>
            {NATURE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="primary" size="sm" onClick={() => fetchItems(1)}><Search className="w-4 h-4 mr-1" />Search</Button>
          <Button variant="outline" size="sm" onClick={handleReset}><X className="w-4 h-4 mr-1" />Reset</Button>
          <Button variant="outline" size="sm" onClick={() => fetchItems(currentPage)}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Supplier', 'Nature', 'Date', 'Amount (USD)', 'Used (USD)', 'Remaining (USD)', 'Remarks', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" /></div></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">No records found.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.supplierCouponDiscountId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{item.supplierName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">{item.nature}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDate(item.couponDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">{formatAmount(item.amountUsd)}</td>
                    <td className="px-4 py-3 text-sm text-orange-600 whitespace-nowrap">{formatAmount(item.usedAmountUsd)}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium whitespace-nowrap">{formatAmount(item.remainingAmountUsd)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{item.remarks || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewId(item.supplierCouponDiscountId)} className="text-gray-400 hover:text-[var(--color-primary)] transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => setEditId(item.supplierCouponDiscountId)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(item.supplierCouponDiscountId)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages} — {totalRecords} records</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => fetchItems(currentPage - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => fetchItems(currentPage + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Supplier Coupon/Discount" size="lg">
        <SupplierCouponDiscountForm mode="add" onClose={() => setShowAddModal(false)} onSuccess={handleSuccess} />
      </Modal>
      <Modal isOpen={editId !== null} onClose={() => setEditId(null)} title="Edit Supplier Coupon/Discount" size="lg">
        {editId && <SupplierCouponDiscountForm mode="edit" id={editId} onClose={() => setEditId(null)} onSuccess={handleSuccess} />}
      </Modal>
      <Modal isOpen={viewId !== null} onClose={() => setViewId(null)} title="Supplier Coupon/Discount Details" size="lg">
        {viewId && <ViewSupplierCouponDiscount id={viewId} onClose={() => setViewId(null)} />}
      </Modal>
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-gray-700">Are you sure you want to delete this record? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
