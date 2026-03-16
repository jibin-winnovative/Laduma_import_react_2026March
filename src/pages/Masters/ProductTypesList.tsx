import { useState, useEffect } from 'react';
import { Box, Plus, Search, Eye, Edit2 } from 'lucide-react';
import { productTypesService, ProductType } from '../../services/productTypesService';
import { categoriesService } from '../../services/categoriesService';
import { departmentsService } from '../../services/departmentsService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProductTypeForm } from './ProductTypeForm';
import { ViewProductType } from './ViewProductType';

export const ProductTypesList = () => {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalProductTypes: 0,
    activeProductTypes: 0,
    totalCategories: 0,
    lastUpdatedDate: undefined as string | undefined,
    lastUpdatedBy: '',
    formattedLastUpdated: '',
  });
  const [departments, setDepartments] = useState<Array<{ departmentId: number; departmentName: string }>>([]);
  const [categories, setCategories] = useState<Array<{ categoryId: number; categoryName: string }>>([]);
  const [allCategories, setAllCategories] = useState<Array<{ categoryId: number; categoryName: string; departmentId: number }>>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<number | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchDepartments();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProductTypes();
  }, [currentPage, searchTerm, selectedDepartment, selectedCategory, selectedStatus]);

  useEffect(() => {
    if (selectedDepartment) {
      const filtered = allCategories.filter(
        (cat) => cat.departmentId === parseInt(selectedDepartment)
      );
      setCategories(filtered);
      setSelectedCategory('');
    } else {
      setCategories(allCategories);
    }
  }, [selectedDepartment, allCategories]);

  const fetchSummary = async () => {
    try {
      const data = await productTypesService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary({
        totalProductTypes: 0,
        activeProductTypes: 0,
        totalCategories: 0,
        lastUpdatedDate: undefined,
        lastUpdatedBy: '',
        formattedLastUpdated: '',
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsService.getList({ page: 1, pageSize: 1000 });
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesService.getList({ page: 1, pageSize: 1000 });
      setAllCategories(response.data);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProductTypes = async () => {
    try {
      setLoading(true);
      const response = await productTypesService.getList({
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        departmentId: selectedDepartment ? parseInt(selectedDepartment) : undefined,
        categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
        isActive: selectedStatus === 'Active' ? true : selectedStatus === 'Inactive' ? false : undefined,
      });
      setProductTypes(response.data);
      setTotalPages(response.totalPages);
      setTotalRecords(response.totalRecords);
    } catch (error) {
      console.error('Failed to fetch product types:', error);
      setProductTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number) => {
    setSelectedProductTypeId(id);
    setShowViewModal(true);
  };

  const handleEdit = (id: number) => {
    setSelectedProductTypeId(id);
    setShowEditForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedProductTypeId(null);
  };

  const handleSuccess = () => {
    fetchProductTypes();
    fetchSummary();
    handleCloseForm();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProductTypes();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedCategory('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Product Types</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage product types master data
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Product Type</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Product Types</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalProductTypes}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Box className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active Product Types</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-success)] mt-1">
                {summary.activeProductTypes}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Box className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Inactive Types</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-error)] mt-1">
                {summary.totalProductTypes - summary.activeProductTypes}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
              <Box className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-error)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Last Updated</p>
            <p className="text-sm sm:text-base font-semibold text-[var(--color-text)] mt-1">
              {summary.lastUpdatedDate && summary.lastUpdatedDate !== '0001-01-01T00:00:00'
                ? new Date(summary.lastUpdatedDate).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {dept.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                disabled={selectedDepartment !== '' && categories.length === 0}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleSearch}
                className="flex-1 bg-[var(--color-primary)] hover:opacity-90 text-white"
              >
                Search
              </Button>
              <Button onClick={handleReset} variant="secondary">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Type Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : productTypes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No product types found
                  </td>
                </tr>
              ) : (
                productTypes.map((productType) => (
                  <tr key={productType.typeId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {productType.typeName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {productType.categoryName || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {productType.departmentName || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {productType.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(productType.typeId)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(productType.typeId)}
                          className="p-1 text-[var(--color-primary)] hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && productTypes.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {showAddForm && (
        <ProductTypeForm
          mode="add"
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showEditForm && selectedProductTypeId && (
        <ProductTypeForm
          mode="edit"
          productTypeId={selectedProductTypeId}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showViewModal && selectedProductTypeId && (
        <ViewProductType
          productTypeId={selectedProductTypeId}
          onClose={() => {
            setShowViewModal(false);
            setSelectedProductTypeId(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditForm(true);
          }}
        />
      )}
    </div>
  );
};
