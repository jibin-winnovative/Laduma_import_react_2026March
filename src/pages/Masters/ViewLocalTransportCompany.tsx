import { useState, useEffect } from 'react';
import { X, Edit2, Mail, Phone, Globe, MapPin, Truck } from 'lucide-react';
import { localTransportCompaniesService, LocalTransportCompany } from '../../services/localTransportCompaniesService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ViewLocalTransportCompanyProps {
  companyId: number;
  onClose: () => void;
  onEdit: () => void;
  userPermissions?: string[];
}

export const ViewLocalTransportCompany = ({
  companyId,
  onClose,
  onEdit,
  userPermissions = []
}: ViewLocalTransportCompanyProps) => {
  const [company, setCompany] = useState<LocalTransportCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await localTransportCompaniesService.getById(companyId);
      setCompany(data);
    } catch (err) {
      console.error('Failed to fetch company:', err);
      setError('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const hasEditPermission = () => {
    return (
      userPermissions.includes('LocalTransportCompany.Update') ||
      userPermissions.includes('Employee.Edit')
    );
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

  if (error || !company) {
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
                  Local Transport Company Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Detailed profile of a local transport company
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
                    Basic Information
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Code
                      </label>
                      <div className="text-lg font-bold text-[var(--color-primary)]">
                        {company.code}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Company Name
                      </label>
                      <div className="text-base text-[var(--color-text)] font-semibold">
                        {company.companyName}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        VAT Number
                      </label>
                      <div className="text-base text-[var(--color-text)]">
                        {company.vatNumber}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Country
                      </label>
                      <div className="text-base text-[var(--color-text)]">
                        {company.country}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          company.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {company.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Service Information
                  </h3>

                  <div className="space-y-4">
                    {company.serviceArea && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Service Area
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {company.serviceArea}
                        </div>
                      </div>
                    )}

                    {company.vehicleTypes && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Vehicle Types
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {company.vehicleTypes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Primary Contact
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Contact Person
                      </label>
                      <div className="text-base text-[var(--color-text)] font-medium">
                        {company.contactPerson}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <a
                        href={`mailto:${company.email}`}
                        className="text-base text-blue-600 hover:underline"
                      >
                        {company.email}
                      </a>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <div className="text-base text-[var(--color-text)] font-medium">
                        {company.phoneNumber}
                      </div>
                    </div>

                    {company.faxNumber && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Fax Number
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {company.faxNumber}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Alternate Contact
                  </h3>

                  <div className="space-y-4">
                    {company.alternateContactPerson && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Alternate Contact Person
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {company.alternateContactPerson}
                        </div>
                      </div>
                    )}

                    {company.alternateEmail && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Alternate Email
                        </label>
                        <a
                          href={`mailto:${company.alternateEmail}`}
                          className="text-base text-blue-600 hover:underline"
                        >
                          {company.alternateEmail}
                        </a>
                      </div>
                    )}

                    {company.alternatePhoneNumber && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Alternate Phone Number
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {company.alternatePhoneNumber}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Additional Details
                  </h3>

                  <div className="space-y-4">
                    {company.address && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Address
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {company.address}
                        </div>
                      </div>
                    )}

                    {company.website && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Website
                        </label>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-blue-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}

                    {company.remarks && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Remarks
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {company.remarks}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Record Information
                  </h3>

                  <div className="space-y-4">
                    {company.createdAt && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Created At
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {new Date(company.createdAt).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {company.createdBy && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Created By
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {company.createdBy}
                        </div>
                      </div>
                    )}

                    {company.updatedAt && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Last Updated
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {new Date(company.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {company.updatedBy && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          Updated By
                        </label>
                        <div className="text-base text-[var(--color-text)]">
                          {company.updatedBy}
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
