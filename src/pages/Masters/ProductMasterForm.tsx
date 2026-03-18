import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2, Upload, Trash2 } from 'lucide-react';
import productMastersService, { ProductMaster } from '../../services/productMastersService';
import { departmentsService } from '../../services/departmentsService';
import { categoriesService } from '../../services/categoriesService';
import { productTypesService } from '../../services/productTypesService';
import { subTypesService } from '../../services/subTypesService';
import { attachmentService, Attachment } from '../../services/attachmentService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { validateImageFile, resizeImageTo120x120, cleanupImagePreviews } from '../../utils/imageUtils';

const productMasterSchema = z.object({
  itemCode: z.string().min(1, 'Item Code is required'),
  itemName: z.string().min(1, 'Item Name is required'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  departmentId: z.number().min(1, 'Department is required'),
  categoryId: z.number().min(1, 'Category is required'),
  typeId: z.number().min(1, 'Product Type is required'),
  subTypeId: z.number().min(1, 'Sub Type is required'),
  price: z.number().min(0, 'Price must be 0 or greater').optional(),
  uom: z.string().optional(),
  fob: z.number().min(0).optional(),
  cbm: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  multipleOf: z.number().int('Must be a whole number').min(1, 'Must be at least 1').optional().nullable(),
  minimumQty: z.number().int('Must be a whole number').min(1, 'Must be at least 1').optional().nullable(),
  isActive: z.boolean(),
});

type ProductMasterFormData = z.infer<typeof productMasterSchema>;

interface ProductMasterFormProps {
  mode: 'add' | 'edit';
  productId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProductMasterForm = ({ mode, productId, onClose, onSuccess }: ProductMasterFormProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [uploading, setUploading] = useState(false);
  const [isInitialDataLoad, setIsInitialDataLoad] = useState(mode === 'edit');

  const [departments, setDepartments] = useState<Array<{ departmentId: number; departmentName: string }>>([]);
  const [categories, setCategories] = useState<Array<{ categoryId: number; categoryName: string }>>([]);
  const [productTypes, setProductTypes] = useState<Array<{ typeId: number; typeName: string }>>([]);
  const [subTypes, setSubTypes] = useState<Array<{ subTypeId: number; subTypeName: string }>>([]);

  const [existingImage, setExistingImage] = useState<{ attachmentId: number; url: string } | null>(null);
  const [newImage, setNewImage] = useState<{ file: File; preview: string } | null>(null);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<ProductMasterFormData>({
    resolver: zodResolver(productMasterSchema),
    defaultValues: {
      itemCode: '',
      itemName: '',
      description: '',
      barcode: '',
      departmentId: 0,
      categoryId: 0,
      typeId: 0,
      subTypeId: 0,
      price: 0,
      uom: '',
      fob: 0,
      cbm: 0,
      weight: 0,
      height: 0,
      length: 0,
      multipleOf: 1,
      minimumQty: 1,
      isActive: true,
    },
  });

  const departmentId = watch('departmentId');
  const categoryId = watch('categoryId');
  const typeId = watch('typeId');
  const itemCode = watch('itemCode');
  const barcode = watch('barcode');

  useEffect(() => {
    const initializeForm = async () => {
      await fetchDepartments();
      if (mode === 'edit' && productId) {
        await fetchProductData();
      }
    };
    initializeForm();
  }, [mode, productId]);

  useEffect(() => {
    return () => {
      if (newImage) {
        cleanupImagePreviews([newImage.preview]);
      }
    };
  }, []);

  useEffect(() => {
    if (isInitialDataLoad) return;

    if (departmentId && departmentId > 0) {
      fetchCategoriesByDepartment(departmentId);
      setValue('categoryId', 0);
      setValue('typeId', 0);
      setValue('subTypeId', 0);
      setProductTypes([]);
      setSubTypes([]);
    } else {
      setCategories([]);
      setProductTypes([]);
      setSubTypes([]);
    }
  }, [departmentId]);

  useEffect(() => {
    if (isInitialDataLoad) return;

    if (categoryId && categoryId > 0) {
      fetchProductTypesByCategory(categoryId);
      setValue('typeId', 0);
      setValue('subTypeId', 0);
      setSubTypes([]);
    } else if (departmentId > 0) {
      setProductTypes([]);
      setSubTypes([]);
    }
  }, [categoryId]);

  useEffect(() => {
    if (isInitialDataLoad) return;

    if (typeId && typeId > 0) {
      fetchSubTypesByProductType(typeId);
      setValue('subTypeId', 0);
    } else if (categoryId > 0) {
      setSubTypes([]);
    }
  }, [typeId]);

  useEffect(() => {
    if (itemCode && itemCode.length > 0) {
      const timer = setTimeout(() => {
        checkItemCodeUniqueness(itemCode);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('itemCode');
    }
  }, [itemCode]);

  useEffect(() => {
    if (barcode && barcode.length > 0) {
      const timer = setTimeout(() => {
        checkBarcodeUniqueness(barcode);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('barcode');
    }
  }, [barcode]);

  const fetchProductData = async () => {
    if (!productId) return;

    setInitialLoading(true);
    try {
      const product = await productMastersService.getById(productId);

      if (product.departmentId) {
        await fetchCategoriesByDepartment(product.departmentId);
      }
      if (product.categoryId) {
        await fetchProductTypesByCategory(product.categoryId);
      }
      if (product.typeId) {
        await fetchSubTypesByProductType(product.typeId);
      }

      setValue('itemCode', product.itemCode);
      setValue('itemName', product.itemName);
      setValue('description', product.description || '');
      setValue('barcode', product.barcode || '');
      setValue('departmentId', product.departmentId);
      setValue('categoryId', product.categoryId);
      setValue('typeId', product.typeId);
      setValue('subTypeId', product.subTypeId);
      setValue('price', product.price || 0);
      setValue('uom', product.uom || '');
      setValue('fob', product.fob || 0);
      setValue('cbm', product.cbm || 0);
      setValue('weight', product.weight || 0);
      setValue('height', product.height || 0);
      setValue('length', product.length || 0);
      setValue('multipleOf', product.multipleOf || undefined);
      setValue('minimumQty', product.minimumQty || undefined);
      setValue('isActive', product.isActive);

      if (product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        const presignedUrl = await attachmentService.getDownloadUrl(firstImage.attachmentId, 60, true);
        setExistingImage({
          attachmentId: firstImage.attachmentId,
          url: presignedUrl,
        });
      }

      setTimeout(() => {
        setIsInitialDataLoad(false);
      }, 0);
    } catch (error) {
      console.error('Failed to fetch product data:', error);
      alert('Failed to load product data');
      onClose();
    } finally {
      setInitialLoading(false);
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

  const fetchSubTypesByProductType = async (tId: number) => {
    try {
      const data = await subTypesService.getActiveByProductType(tId);
      setSubTypes(data);
    } catch (error) {
      console.error('Failed to fetch sub types:', error);
      setSubTypes([]);
    }
  };

  const checkItemCodeUniqueness = async (code: string) => {
    if (!code) return;

    try {
      const exists = await productMastersService.checkItemCodeExists({
        itemCode: code,
        productId: mode === 'edit' ? productId : undefined,
      });

      if (exists) {
        setError('itemCode', { message: 'Item Code already exists' });
      }
    } catch (error) {
      console.error('Failed to check item code uniqueness:', error);
    }
  };

  const checkBarcodeUniqueness = async (code: string) => {
    if (!code) return;

    try {
      const exists = await productMastersService.checkBarcodeExists({
        barcode: code,
        productId: mode === 'edit' ? productId : undefined,
      });

      if (exists) {
        setError('barcode', { message: 'Barcode already exists' });
      }
    } catch (error) {
      console.error('Failed to check barcode uniqueness:', error);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      const resizedImage = await resizeImageTo120x120(file);

      if (newImage) {
        cleanupImagePreviews([newImage.preview]);
      }

      setNewImage({
        file: resizedImage.resizedFile,
        preview: resizedImage.previewUrl,
      });

      if (existingImage) {
        setImageToDelete(existingImage.attachmentId);
        setExistingImage(null);
      }
    } catch (error) {
      console.error('Failed to process image:', error);
      alert('Failed to process image');
    }

    e.target.value = '';
  };

  const handleRemoveImage = () => {
    if (newImage) {
      cleanupImagePreviews([newImage.preview]);
      setNewImage(null);
    }
    if (existingImage) {
      setImageToDelete(existingImage.attachmentId);
      setExistingImage(null);
    }
  };

  const uploadImage = async (prodId: number) => {
    if (!newImage) return;

    setUploading(true);
    try {
      const presignedData = await attachmentService.requestPresignedUpload({
        entityType: 'ProductMaster',
        entityId: prodId,
        fileName: newImage.file.name,
        contentType: newImage.file.type,
      });

      await attachmentService.uploadToS3(presignedData.uploadUrl, newImage.file);
      await attachmentService.confirmUpload(presignedData.attachmentId);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProductMasterFormData) => {
    if (errors.itemCode || errors.barcode) {
      return;
    }

    setLoading(true);
    try {
      let prodId: number;

      if (mode === 'add') {
        const created = await productMastersService.create(data);
        prodId = created.productId;
        alert('Product created successfully!');
      } else if (mode === 'edit' && productId) {
        await productMastersService.update(productId, data);
        prodId = productId;

        if (imageToDelete) {
          try {
            await attachmentService.delete(imageToDelete);
          } catch (error) {
            console.error('Failed to delete old image:', error);
          }
        }

        alert('Product updated successfully!');
      } else {
        return;
      }

      if (newImage) {
        await uploadImage(prodId);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save product';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-4xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  {mode === 'add' ? 'Add New Product' : 'Edit Product'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add'
                    ? 'Create a new product master record'
                    : 'Update product information'}
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
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 md:p-8" style={{ backgroundColor: '#F9FAFB' }}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Basic Information
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('itemCode')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter item code"
                          autoFocus
                        />
                        {errors.itemCode && (
                          <p className="text-red-500 text-sm mt-1">{errors.itemCode.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('itemName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter item name"
                        />
                        {errors.itemName && (
                          <p className="text-red-500 text-sm mt-1">{errors.itemName.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Barcode
                      </label>
                      <input
                        type="text"
                        {...register('barcode')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter barcode"
                      />
                      {errors.barcode && (
                        <p className="text-red-500 text-sm mt-1">{errors.barcode.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Master Selection
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('departmentId', { valueAsNumber: true })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        >
                          <option value={0}>Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.departmentId} value={dept.departmentId}>
                              {dept.departmentName}
                            </option>
                          ))}
                        </select>
                        {errors.departmentId && (
                          <p className="text-red-500 text-sm mt-1">{errors.departmentId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('categoryId', { valueAsNumber: true })}
                          disabled={!departmentId || departmentId === 0}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value={0}>
                            {departmentId && departmentId > 0 ? 'Select Category' : 'Select department first'}
                          </option>
                          {categories.map((cat) => (
                            <option key={cat.categoryId} value={cat.categoryId}>
                              {cat.categoryName}
                            </option>
                          ))}
                        </select>
                        {errors.categoryId && (
                          <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('typeId', { valueAsNumber: true })}
                          disabled={!categoryId || categoryId === 0}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value={0}>
                            {categoryId && categoryId > 0 ? 'Select Product Type' : 'Select category first'}
                          </option>
                          {productTypes.map((type) => (
                            <option key={type.typeId} value={type.typeId}>
                              {type.typeName}
                            </option>
                          ))}
                        </select>
                        {errors.typeId && (
                          <p className="text-red-500 text-sm mt-1">{errors.typeId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sub Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('subTypeId', { valueAsNumber: true })}
                          disabled={!typeId || typeId === 0}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value={0}>
                            {typeId && typeId > 0 ? 'Select Sub Type' : 'Select type first'}
                          </option>
                          {subTypes.map((subType) => (
                            <option key={subType.subTypeId} value={subType.subTypeId}>
                              {subType.subTypeName}
                            </option>
                          ))}
                        </select>
                        {errors.subTypeId && (
                          <p className="text-red-500 text-sm mt-1">{errors.subTypeId.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Product Details
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <input
                          type="number"
                          step="0.0000000001"
                          {...register('price', { valueAsNumber: true })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                        {errors.price && (
                          <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          UOM
                        </label>
                        <input
                          type="text"
                          {...register('uom')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Unit of measure"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          FOB
                        </label>
                        <input
                          type="number"
                          step="0.0000000001"
                          {...register('fob', { valueAsNumber: true })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CBM
                        </label>
                        <input
                          type="number"
                          step="0.0000000001"
                          {...register('cbm', { valueAsNumber: true })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight
                        </label>
                        <input
                          type="number"
                          step="0.0000000001"
                          {...register('weight', { valueAsNumber: true })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Height
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register('height', { valueAsNumber: true })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Length
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register('length', { valueAsNumber: true })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Multiple Of
                        </label>
                        <input
                          type="number"
                          step="1"
                          {...register('multipleOf', {
                            valueAsNumber: true,
                            setValueAs: (v) => v === '' || v === null || isNaN(v) ? undefined : parseInt(v)
                          })}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all ${
                            errors.multipleOf ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g., 10, 50, 100"
                        />
                        {errors.multipleOf && (
                          <p className="text-red-500 text-sm mt-1">{errors.multipleOf.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Order quantity must be a multiple of this number
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Quantity
                        </label>
                        <input
                          type="number"
                          step="1"
                          {...register('minimumQty', {
                            valueAsNumber: true,
                            setValueAs: (v) => v === '' || v === null || isNaN(v) ? undefined : parseInt(v)
                          })}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all ${
                            errors.minimumQty ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g., 100"
                        />
                        {errors.minimumQty && (
                          <p className="text-red-500 text-sm mt-1">{errors.minimumQty.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum order quantity required by supplier
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Product Image
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      {!existingImage && !newImage ? (
                        <label className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors p-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Click to upload product image
                          </p>
                          <p className="text-xs text-gray-500">
                            JPG, PNG, WEBP (Max 5MB) - Will be resized to 120×120
                          </p>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={newImage ? newImage.preview : existingImage?.url}
                              alt="Product"
                              className="w-[120px] h-[120px] object-cover rounded-lg border-2 border-gray-300"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="cursor-pointer">
                              <Button type="button" variant="outline" className="w-full">
                                <Upload className="w-4 h-4 mr-2" />
                                Replace Image
                              </Button>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageSelect}
                                className="hidden"
                              />
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleRemoveImage}
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Image
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {mode === 'edit' && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Status
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                        <input
                          type="checkbox"
                          {...register('isActive')}
                          className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                        />
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">
                            Active Status
                          </label>
                          <p className="text-xs text-gray-500">
                            Enable this to make the product active
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-300">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  disabled={loading || uploading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploading || !!errors.itemCode || !!errors.barcode}
                  className="bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {loading || uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploading ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {mode === 'edit' ? 'Update' : 'Save'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};
