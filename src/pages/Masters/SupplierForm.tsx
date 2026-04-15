import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2, Plus, Trash2, Upload, FileText } from 'lucide-react';
import { suppliersService, Supplier, PaymentTerm } from '../../services/suppliersService';
import { portsService, Port } from '../../services/portsService';
import { socialMediaGroupsService, SocialMediaGroup } from '../../services/socialMediaGroupsService';
import { attachmentService } from '../../services/attachmentService';
import { attachmentTypesService } from '../../services/attachmentTypesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface PendingAttachment {
  id: string;
  file: File;
  type: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  progress: number;
  error?: string;
  retryCount: number;
}

const supplierSchema = z.object({
  supplierId: z.number().optional(),
  supplierName: z
    .string()
    .min(1, 'Supplier Name is required')
    .max(200, 'Supplier Name must be 200 characters or less'),
  address: z
    .string()
    .max(500, 'Address must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  zipCode: z
    .string()
    .max(20, 'ZIP Code must be 20 characters or less')
    .optional()
    .or(z.literal('')),
  socialMediaGroupId: z.number({
    required_error: 'Social Media Group is required',
    invalid_type_error: 'Social Media Group is required',
  }),
  performanceRating: z
    .number()
    .min(1, 'Rating must be between 1 and 10')
    .max(10, 'Rating must be between 1 and 10'),
  remarks: z
    .string()
    .max(1000, 'Remarks must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  beneficiaryName: z.string().max(200).optional().or(z.literal('')),
  beneficiaryAddress: z.string().max(500).optional().or(z.literal('')),
  beneficiaryBankName: z.string().max(200).optional().or(z.literal('')),
  beneficiaryBankAddress: z.string().max(500).optional().or(z.literal('')),
  beneficiaryAccountNo: z.string().max(50).optional().or(z.literal('')),
  swiftCode: z.string().max(20).optional().or(z.literal('')),
  bankBranchCode: z.string().max(20).optional().or(z.literal('')),
  isActive: z.boolean(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  mode: 'add' | 'edit';
  supplierId?: number;
  onClose: () => void;
  onSuccess?: (supplierId?: number) => void;
}

export const SupplierForm = ({ mode, supplierId, onClose, onSuccess }: SupplierFormProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [ports, setPorts] = useState<Port[]>([]);
  const [selectedPortIds, setSelectedPortIds] = useState<number[]>([]);
  const [portIdsError, setPortIdsError] = useState('');
  const [socialMediaGroups, setSocialMediaGroups] = useState<SocialMediaGroup[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [paymentTermsError, setPaymentTermsError] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentTypeOptions, setAttachmentTypeOptions] = useState<{ id: number; name: string }[]>([]);
  const [createdSupplierId, setCreatedSupplierId] = useState<number | undefined>(
    mode === 'edit' ? supplierId : undefined
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    mode: 'onBlur',
    defaultValues: {
      isActive: true,
      supplierName: '',
      address: '',
      zipCode: '',
      performanceRating: 5,
      remarks: '',
      beneficiaryName: '',
      beneficiaryAddress: '',
      beneficiaryBankName: '',
      beneficiaryBankAddress: '',
      beneficiaryAccountNo: '',
      swiftCode: '',
      bankBranchCode: '',
    },
  });

  const supplierName = watch('supplierName');

  useEffect(() => {
    const initializeForm = async () => {
      await fetchPorts();
      await fetchSocialMediaGroups();
      if (mode === 'edit' && supplierId) {
        await fetchSupplierData();
      }
    };
    initializeForm();
    attachmentTypesService.getActiveDropdown('Supplier').then(setAttachmentTypeOptions).catch(() => {});
  }, [mode, supplierId]);

  useEffect(() => {
    if (supplierName && selectedPortIds.length > 0 && supplierName.length > 0) {
      const timer = setTimeout(() => {
        checkDuplicateSupplier(supplierName, selectedPortIds);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      clearErrors('supplierName');
    }
  }, [supplierName, selectedPortIds]);

  const fetchPorts = async () => {
    try {
      const response = await portsService.getList({ pageSize: 1000, isActive: true });
      setPorts(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch ports:', error);
      setPorts([]);
    }
  };

  const fetchSocialMediaGroups = async () => {
    try {
      const response = await socialMediaGroupsService.getList({ pageSize: 1000, isActive: true });
      setSocialMediaGroups(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch social media groups:', error);
      setSocialMediaGroups([]);
    }
  };

  const fetchSupplierData = async () => {
    if (!supplierId) return;

    setInitialLoading(true);
    try {
      const supplier = await suppliersService.getById(supplierId);
      setValue('supplierName', supplier.supplierName);
      setValue('address', supplier.address || '');
      setValue('zipCode', supplier.zipCode || '');
      setValue('socialMediaGroupId', supplier.socialMediaGroupId as number);
      setValue('performanceRating', supplier.performanceRating);
      setValue('remarks', supplier.remarks || '');
      setValue('beneficiaryName', supplier.beneficiaryName || '');
      setValue('beneficiaryAddress', supplier.beneficiaryAddress || '');
      setValue('beneficiaryBankName', supplier.beneficiaryBankName || '');
      setValue('beneficiaryBankAddress', supplier.beneficiaryBankAddress || '');
      setValue('beneficiaryAccountNo', supplier.beneficiaryAccountNo || '');
      setValue('swiftCode', supplier.swiftCode || '');
      setValue('bankBranchCode', supplier.bankBranchCode || '');
      setValue('isActive', supplier.isActive);

      if (supplier.portList && supplier.portList.length > 0) {
        setSelectedPortIds(supplier.portList.map(port => port.portId));
      } else if (supplier.portIds && supplier.portIds.length > 0) {
        setSelectedPortIds(supplier.portIds);
      }

      if (supplier.paymentTerms && supplier.paymentTerms.length > 0) {
        setPaymentTerms(supplier.paymentTerms);
      }
    } catch (error) {
      console.error('Failed to fetch supplier data:', error);
      alert('Failed to load supplier data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkDuplicateSupplier = async (name: string, portIds: number[]) => {
    if (!name || portIds.length === 0) return;

    setCheckingDuplicate(true);
    clearErrors('supplierName');

    try {
      const exists = await suppliersService.checkExists(
        name,
        portIds,
        mode === 'edit' ? supplierId : undefined
      );

      if (exists) {
        setError('supplierName', {
          type: 'manual',
          message: 'Supplier already exists for one or more selected ports'
        });
      }
    } catch (error) {
      console.error('Failed to check duplicate:', error);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handlePortSelection = (portId: number) => {
    setSelectedPortIds((prev) => {
      if (prev.includes(portId)) {
        return prev.filter((id) => id !== portId);
      } else {
        return [...prev, portId];
      }
    });
  };

  const addPaymentTerm = () => {
    setPaymentTerms([...paymentTerms, { description: '', percentage: 0 }]);
  };

  const removePaymentTerm = (index: number) => {
    setPaymentTerms(paymentTerms.filter((_, i) => i !== index));
    if (paymentTerms.length <= 1) {
      setPaymentTermsError('');
    }
  };

  const updatePaymentTerm = (index: number, field: 'description' | 'percentage', value: string | number) => {
    const updated = [...paymentTerms];
    if (field === 'description') {
      updated[index].description = value as string;
    } else {
      updated[index].percentage = typeof value === 'string' ? parseFloat(value) || 0 : value;
    }
    setPaymentTerms(updated);
    validatePaymentTerms(updated);
  };

  const validatePaymentTerms = (terms: PaymentTerm[]) => {
    const filledTerms = terms.filter(term => term.description.trim() || term.percentage > 0);

    if (filledTerms.length === 0) {
      setPaymentTermsError('');
      return true;
    }

    const hasEmptyDescription = filledTerms.some(term => !term.description.trim());
    if (hasEmptyDescription) {
      setPaymentTermsError('All payment terms must have a description');
      return false;
    }

    const total = filledTerms.reduce((sum, term) => sum + term.percentage, 0);
    if (Math.abs(total - 100) > 0.01) {
      setPaymentTermsError(`Total percentage must be 100% (current: ${total.toFixed(2)}%)`);
      return false;
    }

    setPaymentTermsError('');
    return true;
  };

  const addPendingAttachment = (file: File) => {
    setPendingAttachments(prev => [...prev, {
      id: `att-${Date.now()}-${Math.random()}`,
      file,
      type: '',
      status: 'pending',
      progress: 0,
      retryCount: 0,
    }]);
  };

  const updateAttachmentType = (id: string, type: string) => {
    setPendingAttachments(prev => prev.map(a => a.id === id ? { ...a, type } : a));
  };

  const removePending = (id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  const uploadSingle = async (attachment: PendingAttachment, entityId: number): Promise<boolean> => {
    const MAX_RETRIES = 3;
    let retry = attachment.retryCount;
    while (retry <= MAX_RETRIES) {
      try {
        setPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, status: 'uploading', progress: 10 } : a
        ));
        const presigned = await attachmentService.requestPresignedUpload({
          fileName: attachment.file.name,
          contentType: attachment.file.type,
          entityType: 'Supplier',
          entityId,
          ...(attachment.type ? { category: attachment.type } : {}),
        });
        setPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, progress: 40 } : a
        ));
        await attachmentService.uploadToS3(presigned.uploadUrl, attachment.file);
        setPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, progress: 70 } : a
        ));
        await attachmentService.confirmUpload(presigned.attachmentId);
        setPendingAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, status: 'uploaded', progress: 100 } : a
        ));
        return true;
      } catch {
        retry++;
        if (retry <= MAX_RETRIES) {
          setPendingAttachments(prev => prev.map(a =>
            a.id === attachment.id ? { ...a, retryCount: retry, progress: 0, error: `Retry ${retry}/${MAX_RETRIES}...` } : a
          ));
          await new Promise(r => setTimeout(r, 1000 * retry));
        } else {
          setPendingAttachments(prev => prev.map(a =>
            a.id === attachment.id ? { ...a, status: 'failed', error: 'Upload failed after 3 retries', progress: 0 } : a
          ));
          return false;
        }
      }
    }
    return false;
  };

  const retryFailed = async (id: string) => {
    if (!createdSupplierId) return;
    const att = pendingAttachments.find(a => a.id === id);
    if (!att) return;
    setPendingAttachments(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'pending', retryCount: 0, error: undefined } : a
    ));
    await uploadSingle({ ...att, status: 'pending', retryCount: 0 }, createdSupplierId);
  };

  const handleUploadAll = async (entityId: number) => {
    const pending = pendingAttachments.filter(a => a.status === 'pending' || a.status === 'failed');
    for (const att of pending) {
      await uploadSingle(att, entityId);
    }
  };

  const onSubmit = async (data: SupplierFormData) => {
    if (errors.supplierName) {
      return;
    }

    if (checkingDuplicate) {
      return;
    }

    if (selectedPortIds.length === 0) {
      setPortIdsError('At least one port is required');
      return;
    } else {
      setPortIdsError('');
    }

    if (!validatePaymentTerms(paymentTerms)) {
      return;
    }

    if (pendingAttachments.some(a => a.status === 'pending' && !a.type)) {
      alert('Please select a type for all attachments before saving.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        supplierName: data.supplierName,
        address: data.address || null,
        zipCode: data.zipCode || null,
        socialMediaGroupId: data.socialMediaGroupId as number,
        portIds: selectedPortIds,
        performanceRating: data.performanceRating,
        remarks: data.remarks || null,
        beneficiaryName: data.beneficiaryName || null,
        beneficiaryAddress: data.beneficiaryAddress || null,
        beneficiaryBankName: data.beneficiaryBankName || null,
        beneficiaryBankAddress: data.beneficiaryBankAddress || null,
        beneficiaryAccountNo: data.beneficiaryAccountNo || null,
        swiftCode: data.swiftCode || null,
        bankBranchCode: data.bankBranchCode || null,
        isActive: data.isActive,
        paymentTerms: paymentTerms.filter(term => term.description.trim() || term.percentage > 0),
      };

      let savedSupplierId: number | undefined;
      if (mode === 'add') {
        const result = await suppliersService.create(payload);
        savedSupplierId = result.supplierId;
        setCreatedSupplierId(savedSupplierId);
      } else if (mode === 'edit' && supplierId) {
        await suppliersService.update(supplierId, payload);
        savedSupplierId = supplierId;
      }

      if (savedSupplierId && pendingAttachments.some(a => a.status === 'pending' || a.status === 'failed')) {
        await handleUploadAll(savedSupplierId);
      }

      const hasFailed = pendingAttachments.some(a => a.status === 'failed');
      if (hasFailed) {
        alert(mode === 'add'
          ? 'Supplier created successfully, but some attachments failed to upload. You can retry them.'
          : 'Supplier updated successfully, but some attachments failed to upload. You can retry them.');
      } else {
        alert(mode === 'add' ? 'Supplier created successfully!' : 'Supplier updated successfully!');
      }

      if (onSuccess) {
        onSuccess(savedSupplierId);
      }
      if (!hasFailed) {
        onClose();
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Failed to save supplier:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save supplier';
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
                  {mode === 'add' ? 'Add New Supplier' : 'Edit Supplier'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add'
                    ? 'Create a new supplier record'
                    : 'Update supplier information'}
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
                    Supplier Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('supplierName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter supplier name"
                          autoFocus
                        />
                        {checkingDuplicate && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                          </div>
                        )}
                      </div>
                      {errors.supplierName && (
                        <p className="text-red-500 text-sm mt-1">{errors.supplierName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        {...register('address')}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter address"
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        {...register('zipCode')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter ZIP code"
                      />
                      {errors.zipCode && (
                        <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Social Media Group <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('socialMediaGroupId', {
                          setValueAs: (v) => v === '' || v === '0' ? undefined : parseInt(v)
                        })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                      >
                        <option value="">Select social media group</option>
                        {socialMediaGroups.map((group) => (
                          <option key={group.socialMediaGroupId} value={group.socialMediaGroupId}>
                            {group.groupName}
                          </option>
                        ))}
                      </select>
                      {errors.socialMediaGroupId && (
                        <p className="text-red-500 text-sm mt-1">{errors.socialMediaGroupId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ports <span className="text-red-500">*</span>
                      </label>
                      <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-white">
                        {ports.length === 0 ? (
                          <p className="text-gray-500 text-sm">No ports available</p>
                        ) : (
                          <div className="space-y-2">
                            {ports.map((port) => (
                              <label
                                key={port.portId}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPortIds.includes(port.portId)}
                                  onChange={() => handlePortSelection(port.portId)}
                                  className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                                />
                                <span className="text-sm text-gray-700">{port.portName}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {portIdsError && (
                        <p className="text-red-500 text-sm mt-1">{portIdsError}</p>
                      )}
                      {selectedPortIds.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          {selectedPortIds.length} port(s) selected
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Performance Rating <span className="text-red-500">*</span> (1-10)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        {...register('performanceRating', { valueAsNumber: true })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter rating (1-10)"
                      />
                      {errors.performanceRating && (
                        <p className="text-red-500 text-sm mt-1">{errors.performanceRating.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <textarea
                        {...register('remarks')}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter remarks"
                      />
                      {errors.remarks && (
                        <p className="text-red-500 text-sm mt-1">{errors.remarks.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Beneficiary Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beneficiary Name
                      </label>
                      <input
                        type="text"
                        {...register('beneficiaryName')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter beneficiary name"
                      />
                      {errors.beneficiaryName && (
                        <p className="text-red-500 text-sm mt-1">{errors.beneficiaryName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beneficiary Address
                      </label>
                      <textarea
                        {...register('beneficiaryAddress')}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter beneficiary address"
                      />
                      {errors.beneficiaryAddress && (
                        <p className="text-red-500 text-sm mt-1">{errors.beneficiaryAddress.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          {...register('beneficiaryBankName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter bank name"
                        />
                        {errors.beneficiaryBankName && (
                          <p className="text-red-500 text-sm mt-1">{errors.beneficiaryBankName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account No.
                        </label>
                        <input
                          type="text"
                          {...register('beneficiaryAccountNo')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter account number"
                        />
                        {errors.beneficiaryAccountNo && (
                          <p className="text-red-500 text-sm mt-1">{errors.beneficiaryAccountNo.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Address
                      </label>
                      <textarea
                        {...register('beneficiaryBankAddress')}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                        placeholder="Enter bank address"
                      />
                      {errors.beneficiaryBankAddress && (
                        <p className="text-red-500 text-sm mt-1">{errors.beneficiaryBankAddress.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SWIFT Code
                        </label>
                        <input
                          type="text"
                          {...register('swiftCode')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter SWIFT code"
                        />
                        {errors.swiftCode && (
                          <p className="text-red-500 text-sm mt-1">{errors.swiftCode.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Branch Code
                        </label>
                        <input
                          type="text"
                          {...register('bankBranchCode')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter branch code"
                        />
                        {errors.bankBranchCode && (
                          <p className="text-red-500 text-sm mt-1">{errors.bankBranchCode.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] pb-2 border-b-2 border-[var(--color-secondary)]">
                      Payment Terms
                    </h3>
                    <Button
                      type="button"
                      onClick={addPaymentTerm}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Term
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {paymentTerms.length === 0 && (
                      <p className="text-sm text-gray-500 italic py-2">No payment terms added. Click "Add Term" to add one.</p>
                    )}
                    {paymentTerms.map((term, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={term.description}
                            onChange={(e) => updatePaymentTerm(index, 'description', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            placeholder="Description (e.g., Advance Payment)"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={term.percentage}
                            onChange={(e) => updatePaymentTerm(index, 'percentage', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            placeholder="%"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => removePaymentTerm(index)}
                          variant="secondary"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {paymentTermsError && (
                    <p className="text-red-500 text-sm mt-2">{paymentTermsError}</p>
                  )}

                  {paymentTerms.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Total: {paymentTerms.reduce((sum, term) => sum + term.percentage, 0).toFixed(2)}%
                        {Math.abs(paymentTerms.reduce((sum, term) => sum + term.percentage, 0) - 100) < 0.01 && (
                          <span className="ml-2 text-green-600">✓</span>
                        )}
                      </p>
                    </div>
                  )}
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
                            Enable this to make the supplier active
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)] flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Attachments
                </h3>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 hover:border-[var(--color-primary)] transition-colors bg-white">
                    <input
                      id="supplier-form-attachment-upload"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        Array.from(e.target.files || []).forEach(file => {
                          if (file.size > 10 * 1024 * 1024) {
                            alert(`File ${file.name} exceeds 10MB limit`);
                            return;
                          }
                          addPendingAttachment(file);
                        });
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <label htmlFor="supplier-form-attachment-upload" className="flex flex-col items-center justify-center cursor-pointer">
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF, DOC, XLS, PNG, JPG (Max 10MB per file)</p>
                    </label>
                  </div>

                  {pendingAttachments.length > 0 && (
                    <div className="space-y-2">
                      {pendingAttachments.map((att) => (
                        <div key={att.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{att.file.name}</p>
                              <p className="text-xs text-gray-500">{(att.file.size / 1024).toFixed(0)} KB</p>
                              {att.status === 'uploading' && (
                                <div className="mt-1 space-y-1">
                                  <p className="text-xs text-blue-600">
                                    Uploading{att.retryCount > 0 ? ` (Retry ${att.retryCount})` : ''}...
                                  </p>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all" style={{ width: `${att.progress}%` }} />
                                  </div>
                                </div>
                              )}
                              {att.status === 'uploaded' && (
                                <p className="text-xs text-green-600 mt-1">Uploaded successfully</p>
                              )}
                              {att.status === 'failed' && (
                                <p className="text-xs text-red-600 mt-1">{att.error || 'Upload failed'}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {att.status === 'pending' && (
                                <select
                                  value={att.type}
                                  onChange={(e) => updateAttachmentType(att.id, e.target.value)}
                                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-transparent"
                                >
                                  <option value="">Select Type</option>
                                  {attachmentTypeOptions.map((opt) => (
                                    <option key={opt.id} value={opt.name}>{opt.name}</option>
                                  ))}
                                </select>
                              )}
                              {att.status === 'failed' && createdSupplierId && (
                                <Button
                                  type="button"
                                  onClick={() => retryFailed(att.id)}
                                  variant="secondary"
                                  className="px-3 py-1.5 text-xs"
                                >
                                  Retry
                                </Button>
                              )}
                              <Button
                                type="button"
                                onClick={() => removePending(att.id)}
                                variant="danger"
                                className="px-2 py-1.5"
                                disabled={att.status === 'uploading'}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-300">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || checkingDuplicate}
                  className="bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
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
