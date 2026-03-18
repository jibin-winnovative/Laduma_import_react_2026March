import { useState, useEffect } from 'react';
import { X, CreditCard as Edit2, FileText, Download, AlertCircle, Clock, Calendar } from 'lucide-react';
import { importDocMastersService, ImportDocMaster } from '../../services/importDocMastersService';
import { attachmentService, Attachment } from '../../services/attachmentService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ViewImportDocMasterProps {
  documentId: number;
  onClose: () => void;
  onEdit: () => void;
}

export const ViewImportDocMaster = ({
  documentId,
  onClose,
  onEdit,
}: ViewImportDocMasterProps) => {
  const [docData, setDocData] = useState<ImportDocMaster | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await importDocMastersService.getById(documentId);
      console.log('📄 Document data received:', data);
      console.log('📊 Available fields:', Object.keys(data));
      setDocData(data);

      const attachmentData = await attachmentService.getByEntity('ImportDocMaster', documentId);
      setAttachments(attachmentData);
    } catch (err) {
      console.error('Failed to fetch document:', err);
      setError('Failed to load document details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachmentId: number, fileName: string) => {
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

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'none';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring-soon';
    return 'valid';
  };

  const renderExpiryDate = (expiryDate?: string) => {
    if (!expiryDate) return 'N/A';
    const status = getExpiryStatus(expiryDate);
    const formattedDate = new Date(expiryDate).toLocaleDateString();

    if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-2 text-red-600 font-semibold">
          <AlertCircle className="w-5 h-5" />
          {formattedDate} (Expired)
        </span>
      );
    }
    if (status === 'expiring-soon') {
      return (
        <span className="inline-flex items-center gap-2 text-orange-600 font-semibold">
          <Clock className="w-5 h-5" />
          {formattedDate} (Expiring Soon)
        </span>
      );
    }
    return <span className="text-gray-700">{formattedDate}</span>;
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

  if (error || !docData) {
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
      <div className="w-full max-w-[95vw] sm:max-w-5xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  Import Document Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Detailed profile of an import document
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

          <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Basic Information
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Category
                      </label>
                      <div className="text-lg font-bold text-[var(--color-primary)]">
                        {docData.categoryDeclaration}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Title
                      </label>
                      <div className="text-base text-[var(--color-text)] font-semibold">
                        {docData.typeName}
                      </div>
                    </div>

                    {docData.description && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Description
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {docData.description}
                        </div>
                      </div>
                    )}

                    {docData.categoryDeclaration === 'Test Reports/EE REPORT' && (
                      <>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <label className="text-sm font-medium text-gray-600 block mb-1">
                            Product
                          </label>
                          <div className="text-base text-[var(--color-text)]">
                            {docData.product || 'N/A'}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <label className="text-sm font-medium text-gray-600 block mb-1">
                            Model / Type / Brand Name
                          </label>
                          <div className="text-base text-[var(--color-text)]">
                            {docData.modelNo || 'N/A'}
                          </div>
                        </div>

                        {docData.referenceNumber && (
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <label className="text-sm font-medium text-gray-600 block mb-1">
                              Reference No
                            </label>
                            <div className="text-base text-[var(--color-text)]">
                              {docData.referenceNumber}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {docData.categoryDeclaration === 'Levy Declaration' && (
                      <>
                        {docData.levyPeriod && (
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <label className="text-sm font-medium text-gray-600 block mb-1">
                              Levy Period
                            </label>
                            <div className="text-base text-[var(--color-text)]">
                              {docData.levyPeriod}
                            </div>
                          </div>
                        )}

                        {docData.accountNo && (
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <label className="text-sm font-medium text-gray-600 block mb-1">
                              Account No
                            </label>
                            <div className="text-base text-[var(--color-text)]">
                              {docData.accountNo}
                            </div>
                          </div>
                        )}
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
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Doc Number
                      </label>
                      <div className="text-base text-[var(--color-text)] font-medium">
                        {docData.docNumber}
                      </div>
                    </div>

                    {docData.issuedTo && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Issued To
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {docData.issuedTo}
                        </div>
                      </div>
                    )}

                    {(docData.categoryDeclaration === 'LOA' || docData.categoryDeclaration === 'Test Reports/EE REPORT') && (
                      <>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Issue Date
                          </label>
                          <div className="text-base text-[var(--color-text)]">
                            {docData.issueDate ? new Date(docData.issueDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Expiry Date
                          </label>
                          <div className="text-base">
                            {docData.expiryDate ? renderExpiryDate(docData.expiryDate) : 'N/A'}
                          </div>
                        </div>

                        {docData.remarks && (
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <label className="text-sm font-medium text-gray-600 block mb-1">
                              Remarks
                            </label>
                            <div className="text-base text-[var(--color-text)]">
                              {docData.remarks}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {docData.categoryDeclaration === 'Levy Declaration' && (
                      <>
                        {docData.dateOfFiling && (
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Date Of Filing
                            </label>
                            <div className="text-base text-[var(--color-text)]">
                              {new Date(docData.dateOfFiling).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        {docData.paymentDate && (
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Payment Date
                            </label>
                            <div className="text-base text-[var(--color-text)]">
                              {new Date(docData.paymentDate).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Attachments
                  </h3>

                  <div className="space-y-4">
                    {attachments.length === 0 ? (
                      <div className="bg-white p-4 rounded-lg shadow-sm text-center text-gray-500">
                        No attachments available
                      </div>
                    ) : (
                      attachments.map((attachment) => (
                        <div
                          key={attachment.attachmentId}
                          className="bg-white p-4 rounded-lg shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-base text-[var(--color-text)] font-medium truncate">
                                  {attachment.fileName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(attachment.fileSize / 1024).toFixed(2)} KB
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownload(attachment.attachmentId, attachment.fileName)}
                              disabled={downloadingAttachmentId === attachment.attachmentId}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Download"
                            >
                              {downloadingAttachmentId === attachment.attachmentId ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                              ) : (
                                <Download className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Record Information
                  </h3>

                  <div className="space-y-4">
                    {docData.createdAt && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Created At
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {new Date(docData.createdAt).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {docData.createdBy && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Created By
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {docData.createdBy}
                        </div>
                      </div>
                    )}

                    {docData.updatedAt && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Last Updated
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {new Date(docData.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {docData.updatedBy && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Updated By
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {docData.updatedBy}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
