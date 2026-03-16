import { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import { addonChargesService, AddonCharge } from '../../services/addonChargesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ViewAddonChargeProps {
  addonChargeId: number;
  onClose: () => void;
  onEdit: () => void;
  userPermissions?: string[];
}

export const ViewAddonCharge = ({
  addonChargeId,
  onClose,
  onEdit,
  userPermissions = [],
}: ViewAddonChargeProps) => {
  const [addonCharge, setAddonCharge] = useState<AddonCharge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [addonChargeId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await addonChargesService.getById(addonChargeId);
      setAddonCharge(data);
    } catch (err) {
      console.error('Failed to fetch addon charge:', err);
      setError('Failed to load addon charge details');
    } finally {
      setLoading(false);
    }
  };

  const hasEditPermission = () => {
    return (
      userPermissions.includes('Master.Update') ||
      userPermissions.includes('AddonCharge.Update')
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !addonCharge) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4 p-8">
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
      <div className="w-full max-w-[95vw] sm:max-w-2xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  Addon Charge Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Detailed addon charge information
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
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Basic Information
                </h3>

                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Charge Name
                    </label>
                    <div className="text-lg font-bold text-[var(--color-primary)]">
                      {addonCharge.chargeName}
                    </div>
                  </div>

                  {addonCharge.description && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Description
                      </label>
                      <div className="text-base text-[var(--color-text)]">
                        {addonCharge.description}
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        addonCharge.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {addonCharge.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                  Record Information
                </h3>

                <div className="space-y-4">
                  {addonCharge.createdDate && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Created Date
                      </label>
                      <div className="text-base text-[var(--color-text)]">
                        {new Date(addonCharge.createdDate).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {addonCharge.modifiedDate && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Last Modified
                      </label>
                      <div className="text-base text-[var(--color-text)]">
                        {new Date(addonCharge.modifiedDate).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
