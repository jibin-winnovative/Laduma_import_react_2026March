import { useState, useEffect } from 'react';
import { CreditCard as Edit2, Trash2, Eye, Package, Download, Search, Plus } from 'lucide-react';
import productMastersService, { ProductMaster } from '../../services/productMastersService';
import { departmentsService } from '../../services/departmentsService';
import { categoriesService } from '../../services/categoriesService';
import { productTypesService } from '../../services/productTypesService';
import { subTypesService } from '../../services/subTypesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { removeTrailingZeros } from '../../utils/numberUtils';

interface ProductMastersListProps {
  onView: (product: ProductMaster) => void;
  onEdit: (product: ProductMaster) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

export const ProductMastersList = ({ onView, onEdit, onDelete, onAdd }: ProductMastersListProps) => {
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubType, setSelectedSubType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const pageSize = 10;

  const [summary, setSummary] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    formattedLastUpdated: '',
  });

  const [departments, setDepartments] = useState<Array<{ departmentId: number; departmentName: string }>>([]);
  const [categories, setCategories] = useState<Array<{ categoryId: number; categoryName: string }>>([]);
  const [productTypes, setProductTypes] = useState<Array<{ typeId: number; typeName: string }>>([]);
  const [subTypes, setSubTypes] = useState<Array<{ subTypeId: number; subTypeName: string }>>([]);

  const fetchSummary = async () => {
    try {
      const data = await productMastersService.getQuickSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentsService.getActive();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchCategoriesByDepartment = async (deptId: number) => {
    try {
      const data = await categoriesService.getActiveByDepartment(deptId);
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const fetchProductTypesByCategory = async (catId: number) => {
    try {
      const data = await productTypesService.getActiveByCategory(catId);
      setProductTypes(data);
    } catch (error) {
      console.error('Failed to fetch product types:', error);
      setProductTypes([]);
    }
  };

  const fetchSubTypesByProductType = async (typeId: number) => {
    try {
      const data = await subTypesService.getActiveByProductType(typeId);
      setSubTypes(data);
    } catch (error) {
      console.error('Failed to fetch sub types:', error);
      setSubTypes([]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      let isActiveValue: boolean | undefined = undefined;
      if (selectedStatus === 'Active') {
        isActiveValue = true;
      } else if (selectedStatus === 'Inactive') {
        isActiveValue = false;
      }

      const response = await productMastersService.getList({
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        departmentId: selectedDepartment ? parseInt(selectedDepartment) : undefined,
        categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
        typeId: selectedType ? parseInt(selectedType) : undefined,
        subTypeId: selectedSubType ? parseInt(selectedSubType) : undefined,
        isActive: isActiveValue,
      });

      if (response && typeof response === 'object') {
        const productData = response.data || [];
        setProducts(Array.isArray(productData) ? productData : []);
        setTotalPages(response.totalPages || 1);
        setTotalRecords(response.totalRecords || 0);
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchDepartments();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTrigger]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchCategoriesByDepartment(parseInt(selectedDepartment));
      setSelectedCategory('');
      setSelectedType('');
      setSelectedSubType('');
      setProductTypes([]);
      setSubTypes([]);
    } else {
      setCategories([]);
      setSelectedCategory('');
      setProductTypes([]);
      setSelectedType('');
      setSubTypes([]);
      setSelectedSubType('');
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedCategory) {
      fetchProductTypesByCategory(parseInt(selectedCategory));
      setSelectedType('');
      setSelectedSubType('');
      setSubTypes([]);
    } else if (selectedDepartment) {
      setProductTypes([]);
      setSelectedType('');
      setSubTypes([]);
      setSelectedSubType('');
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedType) {
      fetchSubTypesByProductType(parseInt(selectedType));
      setSelectedSubType('');
    } else if (selectedCategory) {
      setSubTypes([]);
      setSelectedSubType('');
    }
  }, [selectedType]);

  const handleSearchClick = () => {
    setCurrentPage(1);
    setSearchTrigger((prev) => prev + 1);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedSubType('');
    setSelectedStatus('');
    setCurrentPage(1);
    setCategories([]);
    setProductTypes([]);
    setSubTypes([]);
    setSearchTrigger((prev) => prev + 1);
  };

  const handleExport = async () => {
    try {
      let isActiveValue: boolean | undefined = undefined;
      if (selectedStatus === 'Active') {
        isActiveValue = true;
      } else if (selectedStatus === 'Inactive') {
        isActiveValue = false;
      }

      const blob = await productMastersService.exportExcel({
        searchTerm: searchTerm || undefined,
        departmentId: selectedDepartment ? parseInt(selectedDepartment) : undefined,
        categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
        typeId: selectedType ? parseInt(selectedType) : undefined,
        subTypeId: selectedSubType ? parseInt(selectedSubType) : undefined,
        isActive: isActiveValue,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Product Master</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage product master data
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={onAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Products</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalProducts}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active Products</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-success)] mt-1">
                {summary.activeProducts}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Inactive Products</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.inactiveProducts}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Last Updated</p>
            <p className="text-sm sm:text-base font-semibold text-[var(--color-text)] mt-1">
              {summary.formattedLastUpdated || 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Item Name / Item Code"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!selectedDepartment}
              >
                <option value="">
                  {selectedDepartment ? 'All Categories' : 'Select department first'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Product Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!selectedCategory}
              >
                <option value="">
                  {selectedCategory ? 'All Product Types' : 'Select category first'}
                </option>
                {productTypes.map((type) => (
                  <option key={type.typeId} value={type.typeId}>
                    {type.typeName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Sub Type
              </label>
              <select
                value={selectedSubType}
                onChange={(e) => setSelectedSubType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!selectedType}
              >
                <option value="">
                  {selectedType ? 'All Sub Types' : 'Select type first'}
                </option>
                {subTypes.map((subType) => (
                  <option key={subType.subTypeId} value={subType.subTypeId}>
                    {subType.subTypeName}
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
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSearchClick}
              className="flex-1 sm:flex-none bg-[var(--color-primary)] hover:opacity-90 text-white"
            >
              Search
            </Button>
            <Button onClick={handleReset} variant="secondary" className="flex-1 sm:flex-none">
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sub Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
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
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.productId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {product.itemCode}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {product.itemName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {product.departmentName || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {product.categoryName || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {product.typeName || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {product.subTypeName || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {product.price !== undefined && product.price !== null ? `$${removeTrailingZeros(product.price)}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {product.isActive ? (
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
                          onClick={() => onView(product)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(product)}
                          className="p-1 text-[var(--color-primary)] hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product.productId)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && products.length > 0 && (
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
    </div>
  );
};
