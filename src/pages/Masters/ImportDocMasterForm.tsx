import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2, Upload, FileText, Trash2, Download } from 'lucide-react';
import { importDocMastersService, ImportDocMaster } from '../../services/importDocMastersService';
import { attachmentService, Attachment } from '../../services/attachmentService';
import { attachmentTypesService } from '../../services/attachmentTypesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const CATEGORIES = ['LOA', 'Test Reports/EE REPORT', 'Levy Declaration'];

const baseSchema = z.object({
  categoryDeclaration: z.string().min(1, 'Category is required'),
  typeName: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  docNumber: z.string().min(1, 'Doc Number is required'),
  issuedTo: z.string().min(1, 'Issued To is required'),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
});

const loaSchema = baseSchema.extend({
  issueDate: z.string().min(1, 'Issue Date is required'),
  expiryDate: z.string().min(1, 'Expiry Date is required'),
});

const testReportSchema = baseSchema.extend({
  product: z.string().min(1, 'Product is required'),
  modelNo: z.string().min(1, 'Model / Type / Brand Name is required'),
  issueDate: z.string().min(1, 'Issue Date is required'),
  expiryDate: z.string().min(1, 'Expiry Date is required'),
});

const levyDeclarationSchema = baseSchema.extend({
  levyPeriod: z.string().min(1, 'Levy Period is required'),
  accountNo: z.string().min(1, 'Account No is required'),
  dateOfFiling: z.string().min(1, 'Date Of Filing is required'),
  paymentDate: z.string().optional(),
});

type ImportDocFormData = z.infer<typeof loaSchema> & z.infer<typeof testReportSchema> & z.infer<typeof levyDeclarationSchema>;

interface ImportDocMasterFormProps {
  mode: 'add' | 'edit';
  documentId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PendingFile {
  file: File;
  type: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  progress: number;
  error?: string;
}

export const ImportDocMasterForm = ({ mode, documentId, onClose, onSuccess }: ImportDocMasterFormProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);
  const [attachmentTypeOptions, setAttachmentTypeOptions] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    attachmentTypesService.getActiveDropdown('Import Document').then(setAttachmentTypeOptions).catch(() => {});
  }, []);

  const getDynamicSchema = (category: string) => {
    switch (category) {
      case 'LOA':
        return loaSchema;
      case 'Test Reports/EE REPORT':
        return testReportSchema;
      case 'Levy Declaration':
        return levyDeclarationSchema;
      default:
        return baseSchema;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ImportDocFormData>({
    resolver: undefined,
    defaultValues: {
      categoryDeclaration: 'LOA',
      typeName: '',
      description: '',
      docNumber: '',
      issuedTo: '',
      referenceNumber: '',
      remarks: '',
      issueDate: '',
      expiryDate: '',
      product: '',
      modelNo: '',
      levyPeriod: '',
      accountNo: '',
      dateOfFiling: '',
      paymentDate: '',
    },
  });

  const selectedCategory = watch('categoryDeclaration');
  const issueDate = watch('issueDate');
  const expiryDate = watch('expiryDate');
  const dateOfFiling = watch('dateOfFiling');
  const paymentDate = watch('paymentDate');

  useEffect(() => {
    if (mode === 'edit' && documentId) {
      fetchDocumentData();
    }
  }, [mode, documentId]);

  useEffect(() => {
    if (issueDate && expiryDate) {
      const issue = new Date(issueDate);
      const expiry = new Date(expiryDate);
      if (expiry < issue) {
        alert('Expiry Date must be greater than or equal to Issue Date');
      }
    }
  }, [issueDate, expiryDate]);

  useEffect(() => {
    if (dateOfFiling && paymentDate) {
      const filing = new Date(dateOfFiling);
      const payment = new Date(paymentDate);
      if (payment < filing) {
        alert('Payment Date must be greater than or equal to Date Of Filing');
      }
    }
  }, [dateOfFiling, paymentDate]);

  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const fetchDocumentData = async () => {
    if (!documentId) return;

    setInitialLoading(true);
    try {
      const document = await importDocMastersService.getById(documentId);
      setValue('categoryDeclaration', document.categoryDeclaration);
      setValue('typeName', document.typeName);
      setValue('description', document.description || '');
      setValue('docNumber', document.docNumber);
      setValue('issuedTo', document.issuedTo || '');
      setValue('referenceNumber', document.referenceNumber || '');
      setValue('remarks', document.remarks || '');
      setValue('issueDate', formatDateForInput(document.issueDate));
      setValue('expiryDate', formatDateForInput(document.expiryDate));
      setValue('product', document.product || '');
      setValue('modelNo', document.modelNo || '');
      setValue('levyPeriod', document.levyPeriod || '');
      setValue('accountNo', document.accountNo || '');
      setValue('dateOfFiling', formatDateForInput(document.dateOfFiling));
      setValue('paymentDate', formatDateForInput(document.paymentDate));

      const attachments = await attachmentService.getByEntity('ImportDocMaster', documentId);
      setExistingAttachments(attachments);
    } catch (error) {
      console.error('Failed to fetch document data:', error);
      alert('Failed to load document data');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newFiles: PendingFile[] = files.map(file => ({
      file,
      type: '',
      status: 'pending',
      progress: 0,
    }));

    setPendingFiles(prev => [...prev, ...newFiles]);
    event.target.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const updatePendingFileType = (index: number, type: string) => {
    setPendingFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], type };
      return updated;
    });
  };

  const uploadAttachments = async (entityId: number): Promise<{ success: boolean; failedCount: number }> => {
    if (pendingFiles.length === 0) {
      return { success: true, failedCount: 0 };
    }

    const filesToUpload = pendingFiles.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) {
      return { success: true, failedCount: 0 };
    }

    let failedCount = 0;

    for (let i = 0; i < pendingFiles.length; i++) {
      const pendingFile = pendingFiles[i];

      if (pendingFile.status !== 'pending') continue;

      try {
        console.log(`📤 [${i + 1}/${pendingFiles.length}] Uploading file: ${pendingFile.file.name}`);

        setPendingFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'uploading', progress: 10 };
          return updated;
        });

        console.log(`  → Step 1/3: Requesting presigned upload URL...`);
        const presignedResponse = await attachmentService.requestPresignedUpload({
          fileName: pendingFile.file.name,
          contentType: pendingFile.file.type,
          entityType: 'ImportDocMaster',
          entityId: entityId,
          ...(pendingFile.type ? { category: pendingFile.type } : {}),
        });
        console.log(`  ✓ Got presigned URL, attachmentId: ${presignedResponse.attachmentId}`);

        setPendingFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], progress: 40 };
          return updated;
        });

        console.log(`  → Step 2/3: Uploading to S3...`);
        await attachmentService.uploadToS3(presignedResponse.uploadUrl, pendingFile.file);
        console.log(`  ✓ File uploaded to S3 successfully`);

        setPendingFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], progress: 70 };
          return updated;
        });

        console.log(`  → Step 3/3: Confirming upload...`);
        await attachmentService.confirmUpload(presignedResponse.attachmentId);
        console.log(`  ✓ Upload confirmed successfully`);

        setPendingFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'uploaded', progress: 100 };
          return updated;
        });

        console.log(`✅ File uploaded successfully: ${pendingFile.file.name}`);
      } catch (error) {
        console.error(`❌ Failed to upload file: ${pendingFile.file.name}`, error);
        failedCount++;
        setPendingFiles(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: 'failed',
            error: 'Upload failed',
            progress: 0
          };
          return updated;
        });
      }
    }

    return { success: failedCount === 0, failedCount };
  };

  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      setDownloadingAttachmentId(attachmentId);
      const downloadUrl = await attachmentService.getDownloadUrl(attachmentId, 60, false);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download attachment:', err);
      alert('Failed to download file. Please try again.');
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const removeExistingAttachment = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to remove this attachment?')) return;

    try {
      await attachmentService.delete(attachmentId);
      setExistingAttachments(prev => prev.filter(att => att.attachmentId !== attachmentId));
      alert('Attachment removed successfully');
    } catch (error) {
      console.error('Failed to remove attachment:', error);
      alert('Failed to remove attachment');
    }
  };

  const onSubmit = async (data: ImportDocFormData) => {
    if (!data.categoryDeclaration || !data.typeName || !data.docNumber) {
      alert('Please fill in all required fields: Category, Title, and Doc Number');
      return;
    }

    if (data.categoryDeclaration === 'LOA') {
      if (!data.issueDate || !data.expiryDate) {
        alert('Please fill in Issue Date and Expiry Date for LOA');
        return;
      }
    } else if (data.categoryDeclaration === 'Test Reports/EE REPORT') {
      if (!data.product || !data.modelNo || !data.issueDate || !data.expiryDate) {
        alert('Please fill in Product, Model/Type/Brand Name, Issue Date, and Expiry Date for Test Reports');
        return;
      }
    } else if (data.categoryDeclaration === 'Levy Declaration') {
      if (!data.levyPeriod || !data.accountNo || !data.dateOfFiling) {
        alert('Please fill in Levy Period, Account No, and Date Of Filing for Levy Declaration');
        return;
      }
    }

    const missingTypes = pendingFiles.some(f => f.status === 'pending' && !f.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        typeCode: 'IMPORT_DOC',
        categoryDeclaration: data.categoryDeclaration,
        typeName: data.typeName?.trim() || null,
        description: data.description?.trim() || null,
        docNumber: data.docNumber?.trim() || null,
        issuedTo: data.issuedTo?.trim() || null,
        referenceNumber: data.referenceNumber?.trim() || null,
        remarks: data.remarks?.trim() || null,
        issueDate: data.issueDate || null,
        expiryDate: data.expiryDate || null,
        product: data.product?.trim() || null,
        modelNo: data.modelNo?.trim() || null,
        levyPeriod: data.levyPeriod?.trim() || null,
        accountNo: data.accountNo?.trim() || null,
        dateOfFiling: data.dateOfFiling || null,
        paymentDate: data.paymentDate || null,
        isActive: true,
      };

      let entityId: number;

      if (mode === 'add') {
        const response = await importDocMastersService.create(payload);
        entityId = response.importDocMasterId;
        console.log('✅ Import Document created with ID:', entityId);
      } else if (mode === 'edit' && documentId) {
        await importDocMastersService.update(documentId, payload);
        entityId = documentId;
        console.log('✅ Import Document updated with ID:', entityId);
      } else {
        throw new Error('Invalid mode or missing document ID');
      }

      if (pendingFiles.length > 0) {
        console.log('📎 Starting attachment upload for', pendingFiles.length, 'files...');
        const uploadResult = await uploadAttachments(entityId);

        if (uploadResult.success) {
          console.log('✅ All attachments uploaded successfully');
          alert(`Import Document ${mode === 'add' ? 'created' : 'updated'} successfully with ${pendingFiles.length} attachment(s)!`);
        } else {
          console.log('⚠️ Some attachments failed to upload. Failed count:', uploadResult.failedCount);
          alert(`Document saved successfully, but ${uploadResult.failedCount} attachment(s) failed to upload. Please try editing the document to upload them again.`);
        }
      } else {
        console.log('✅ No attachments to upload');
        alert(`Import Document ${mode === 'add' ? 'created' : 'updated'} successfully!`);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('❌ Failed to save document - Full error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error errors array:', error.errors);
      console.error('❌ Error status code:', error.statusCode);

      let errorMessage = error.message || 'Failed to save import document';

      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        const errorDetails = error.errors.map((err: any) => {
          if (typeof err === 'string') return err;
          if (err.message) return err.message;
          if (err.description) return err.description;
          return JSON.stringify(err);
        }).join('\n');

        errorMessage = `${errorMessage}\n\nDetails:\n${errorDetails}`;
      }

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
      <div className="w-full max-w-[95vw] sm:max-w-5xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  {mode === 'add' ? 'Add New Import Document' : 'Edit Import Document'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  {mode === 'add'
                    ? 'Create a new import document record'
                    : 'Update import document information'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Basic Information
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('categoryDeclaration')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          autoFocus
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        {errors.categoryDeclaration && (
                          <p className="text-red-500 text-sm mt-1">{errors.categoryDeclaration.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('typeName')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter title"
                        />
                        {errors.typeName && (
                          <p className="text-red-500 text-sm mt-1">{errors.typeName.message}</p>
                        )}
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
                        {errors.description && (
                          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                        )}
                      </div>

                      {selectedCategory === 'Test Reports/EE REPORT' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              {...register('product')}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                              placeholder="Enter product"
                            />
                            {errors.product && (
                              <p className="text-red-500 text-sm mt-1">{errors.product.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Model / Type / Brand Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              {...register('modelNo')}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                              placeholder="Enter model/type/brand"
                            />
                            {errors.modelNo && (
                              <p className="text-red-500 text-sm mt-1">{errors.modelNo.message}</p>
                            )}
                          </div>
                        </>
                      )}

                      {selectedCategory === 'Levy Declaration' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Levy Period <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              {...register('levyPeriod')}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                              placeholder="Enter levy period"
                            />
                            {errors.levyPeriod && (
                              <p className="text-red-500 text-sm mt-1">{errors.levyPeriod.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Account No <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              {...register('accountNo')}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                              placeholder="Enter account number"
                            />
                            {errors.accountNo && (
                              <p className="text-red-500 text-sm mt-1">{errors.accountNo.message}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Document Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Doc Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('docNumber')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter document number"
                        />
                        {errors.docNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.docNumber.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issued To <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('issuedTo')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter issued to"
                        />
                        {errors.issuedTo && (
                          <p className="text-red-500 text-sm mt-1">{errors.issuedTo.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reference Number
                        </label>
                        <input
                          type="text"
                          {...register('referenceNumber')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                          placeholder="Enter reference number"
                        />
                        {errors.referenceNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.referenceNumber.message}</p>
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

                      {(selectedCategory === 'LOA' || selectedCategory === 'Test Reports/EE REPORT') && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Issue Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              {...register('issueDate')}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            />
                            {errors.issueDate && (
                              <p className="text-red-500 text-sm mt-1">{errors.issueDate.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Expiry Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              {...register('expiryDate')}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            />
                            {errors.expiryDate && (
                              <p className="text-red-500 text-sm mt-1">{errors.expiryDate.message}</p>
                            )}
                          </div>
                        </>
                      )}

                      {selectedCategory === 'Levy Declaration' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date Of Filing <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              {...register('dateOfFiling')}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            />
                            {errors.dateOfFiling && (
                              <p className="text-red-500 text-sm mt-1">{errors.dateOfFiling.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Payment Date
                            </label>
                            <input
                              type="date"
                              {...register('paymentDate')}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            />
                            {errors.paymentDate && (
                              <p className="text-red-500 text-sm mt-1">{errors.paymentDate.message}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                      Attachments
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Files
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[var(--color-primary)] transition-colors">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Click to upload or drag and drop
                            </span>
                            <span className="text-xs text-gray-500">
                              PDF, DOC, XLS, PNG, JPG (Max 10MB)
                            </span>
                          </label>
                        </div>
                      </div>

                      {existingAttachments.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Existing Attachments</p>
                          {existingAttachments.map((attachment) => (
                            <div
                              key={attachment.attachmentId}
                              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate">
                                  {attachment.fileName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAttachment(attachment.attachmentId, attachment.fileName)}
                                  disabled={downloadingAttachmentId === attachment.attachmentId}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Download"
                                >
                                  {downloadingAttachmentId === attachment.attachmentId ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExistingAttachment(attachment.attachmentId)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {pendingFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Selected Files</p>
                          {pendingFiles.map((pendingFile, index) => (
                            <div
                              key={index}
                              className="p-3 bg-white border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 truncate">
                                    {pendingFile.file.name}
                                  </span>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    {(pendingFile.file.size / 1024).toFixed(0)} KB
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <select
                                    value={pendingFile.type}
                                    onChange={(e) => updatePendingFileType(index, e.target.value)}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                                    disabled={pendingFile.status === 'uploading'}
                                  >
                                    <option value="">Select Type</option>
                                    {attachmentTypeOptions.map((opt) => (
                                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => removePendingFile(index)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    disabled={pendingFile.status === 'uploading'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {pendingFile.status === 'pending' && (
                                <p className="text-xs text-gray-600">Pending</p>
                              )}
                              {pendingFile.status === 'uploading' && (
                                <div>
                                  <p className="text-xs text-blue-600 mb-1">Uploading...</p>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
                                      style={{ width: `${pendingFile.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              {pendingFile.status === 'uploaded' && (
                                <p className="text-xs text-green-600">Uploaded</p>
                              )}
                              {pendingFile.status === 'failed' && (
                                <p className="text-xs text-red-600">{pendingFile.error || 'Upload failed'}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
                  disabled={loading}
                  className="bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {pendingFiles.some(f => f.status === 'uploading') ? 'Uploading attachments...' : 'Saving...'}
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
