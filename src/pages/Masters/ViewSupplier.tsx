import { useState, useEffect } from 'react';
import { X, Edit2, MapPin, Star, Package, MessageSquare } from 'lucide-react';
import { suppliersService, Supplier } from '../../services/suppliersService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ViewSupplierProps {
  supplierId: number;
  onClose: () => void;
  onEdit: () => void;
  userPermissions?: string[];
}

export const ViewSupplier = ({
  supplierId,
  onClose,
  onEdit,
  userPermissions = []
}: ViewSupplierProps) => {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  const fetchSupplier = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await suppliersService.getById(supplierId);
      setSupplier(data);
    } catch (err) {
      console.error('Failed to fetch supplier:', err);
      setError('Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  };

  const hasEditPermission = () => {
    return (
      userPermissions.includes('Supplier.Update') ||
      userPermissions.includes('Employee.Edit')
    );
  };

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 8) return 'bg-green-100 text-green-800';
    if (rating >= 6) return 'bg-blue-100 text-blue-800';
    if (rating >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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

  if (error || !supplier) {
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
                  Supplier Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Detailed profile of a supplier
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasEditPermission() && (
                  <Button
                    onClick={onEdit}
                    className="bg-[var(--color-secondary)] hover:bg-[#E5A804] text-[var(--color-primary)] flex items-center gap-2"
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
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
                    Supplier Information
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Supplier Name
                      </label>
                      <div className="text-lg font-bold text-[var(--color-primary)]">
                        {supplier.supplierName}
                      </div>
                    </div>

                    {supplier.address && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Address
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {supplier.address}
                        </div>
                      </div>
                    )}

                    {supplier.zipCode && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          ZIP Code
                        </label>
                        <div className="text-base text-[var(--color-text)] font-medium">
                          {supplier.zipCode}
                        </div>
                      </div>
                    )}

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Additional Information
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Ports
                      </label>
                      <div className="text-base text-[var(--color-text)] font-medium">
                        {supplier.ports || '-'}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Performance Rating
                      </label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBadgeColor(supplier.performanceRating)}`}>
                        {supplier.performanceRating}/10
                      </span>
                    </div>

                    {supplier.socialMediaGroupName && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Social Media Group
                        </label>
                        <div className="text-base text-[var(--color-text)] font-medium">
                          {supplier.socialMediaGroupName}
                        </div>
                      </div>
                    )}

                    {supplier.remarks && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Remarks
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {supplier.remarks}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {supplier.paymentTerms && supplier.paymentTerms.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Payment Terms
                </h3>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {supplier.paymentTerms.map((term, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                            {term.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text)] font-medium">
                            {term.percentage}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--color-text)]">
                          Total
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--color-text)]">
                          {supplier.paymentTerms.reduce((sum, term) => sum + term.percentage, 0)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                Record Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.createdAt && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Created At
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {new Date(supplier.createdAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {supplier.createdBy && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Created By
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {supplier.createdBy}
                    </div>
                  </div>
                )}

                {supplier.updatedAt && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Last Updated
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {new Date(supplier.updatedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {supplier.updatedBy && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Updated By
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {supplier.updatedBy}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
