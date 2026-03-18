import { useState, useEffect } from 'react';
import { X, CreditCard as Edit2, Calendar, Package } from 'lucide-react';
import productMastersService, { ProductMaster } from '../../services/productMastersService';
import { attachmentService } from '../../services/attachmentService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { removeTrailingZeros } from '../../utils/numberUtils';

interface ViewProductMasterProps {
  productId: number;
  onClose: () => void;
  onEdit: () => void;
}

export const ViewProductMaster = ({ productId, onClose, onEdit }: ViewProductMasterProps) => {
  const [product, setProduct] = useState<ProductMaster | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productMastersService.getById(productId);
      setProduct(data);

      if (data.images && data.images.length > 0) {
        const firstImage = data.images[0];
        const presignedUrl = await attachmentService.getDownloadUrl(firstImage.attachmentId, 60, true);
        setProductImageUrl(presignedUrl);
      }
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 p-8">
          <div className="text-center py-12">
            <p className="text-[var(--color-error)] text-lg mb-4">
              {error || 'No record found'}
            </p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-4xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  Product Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Detailed product information
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={onEdit}
                  className="bg-[var(--color-secondary)] hover:bg-[#E5A804] text-[var(--color-primary)] flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-4 sm:p-6 md:p-8" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Product Image
                </h3>

                <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center">
                  {productImageUrl ? (
                    <div className="relative group">
                      <img
                        src={productImageUrl}
                        alt="Product"
                        className="max-w-full max-h-[300px] object-contain rounded-lg border-2 border-gray-300 cursor-pointer transition-opacity hover:opacity-90"
                        onClick={() => setShowFullImage(true)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          Click to view full size
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Package className="w-24 h-24 mb-3" />
                      <p className="text-sm font-medium">No image available</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Item Code
                    </label>
                    <div className="text-base text-[var(--color-text)] font-medium">
                      {product.itemCode}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Item Name
                    </label>
                    <div className="text-base text-[var(--color-text)] font-medium">
                      {product.itemName}
                    </div>
                  </div>

                  <div className="sm:col-span-2 bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Description
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {product.description || '-'}
                    </div>
                  </div>

                  {product.barcode && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Barcode
                      </label>
                      <div className="text-base text-[var(--color-text)] font-mono">
                        {product.barcode}
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Status
                    </label>
                    <div className="text-base text-[var(--color-text)] font-medium">
                      {product.isActive ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Master Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Department
                    </label>
                    <div className="text-base text-[var(--color-text)] font-medium">
                      {product.departmentName}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Category
                    </label>
                    <div className="text-base text-[var(--color-text)] font-medium">
                      {product.categoryName}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Product Type
                    </label>
                    <div className="text-base text-[var(--color-text)] font-medium">
                      {product.typeName}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Sub Type
                    </label>
                    <div className="text-base text-[var(--color-text)] font-medium">
                      {product.subTypeName}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Product Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Price
                    </label>
                    <div className="text-base text-[var(--color-text)] font-medium">
                      {product.price !== undefined && product.price !== null
                        ? `$${removeTrailingZeros(product.price)}`
                        : '-'}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      UOM
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {product.uom || '-'}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      FOB
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {removeTrailingZeros(product.fob)}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      CBM
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {removeTrailingZeros(product.cbm)}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Weight
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {removeTrailingZeros(product.weight)}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Height
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {product.height !== undefined && product.height !== null
                        ? product.height
                        : '-'}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Length
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {product.length !== undefined && product.length !== null
                        ? product.length
                        : '-'}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Multiple Of
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {product.multipleOf !== undefined && product.multipleOf !== null
                        ? product.multipleOf
                        : '-'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Order quantity constraint
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Minimum Quantity
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {product.minimumQty !== undefined && product.minimumQty !== null
                        ? product.minimumQty
                        : '-'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum order quantity
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Metadata
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created At
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleString()
                        : '-'}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Updated At
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {product.updatedAt
                        ? new Date(product.updatedAt).toLocaleString()
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {showFullImage && productImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <Button
              onClick={() => setShowFullImage(false)}
              variant="secondary"
              className="absolute -top-12 right-0 bg-white hover:bg-gray-100 text-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
            <img
              src={productImageUrl}
              alt="Product Full Size"
              className="max-w-full max-h-[95vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
