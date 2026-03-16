import { useState, useEffect } from 'react';
import { X, CreditCard as Edit2, Mail, Phone, MessageSquare } from 'lucide-react';
import { socialMediaGroupsService, SocialMediaGroup } from '../../services/socialMediaGroupsService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ViewSocialMediaGroupProps {
  groupId: number;
  onClose: () => void;
  onEdit: () => void;
  userPermissions?: string[];
}

export const ViewSocialMediaGroup = ({
  groupId,
  onClose,
  onEdit,
  userPermissions = []
}: ViewSocialMediaGroupProps) => {
  const [group, setGroup] = useState<SocialMediaGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await socialMediaGroupsService.getById(groupId);
      setGroup(data);
    } catch (err) {
      console.error('Failed to fetch group:', err);
      setError('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const hasEditPermission = () => {
    return (
      userPermissions.includes('SocialMediaGroup.Update') ||
      userPermissions.includes('Employee.Edit')
    );
  };

  const getSocialMediaBadgeColor = (socialMedia: string) => {
    const colors: Record<string, string> = {
      WhatsApp: 'bg-green-100 text-green-800',
      WeChat: 'bg-blue-100 text-blue-800',
      LinkedIn: 'bg-indigo-100 text-indigo-800',
      Instagram: 'bg-pink-100 text-pink-800',
      Snapchat: 'bg-yellow-100 text-yellow-800',
      Telegram: 'bg-sky-100 text-sky-800',
      Facebook: 'bg-blue-100 text-blue-800',
    };
    return colors[socialMedia] || 'bg-gray-100 text-gray-800';
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

  if (error || !group) {
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
      <div className="w-full max-w-[95vw] sm:max-w-3xl max-h-[95vh] flex flex-col">
        <Card className="bg-white flex flex-col max-h-full overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-shrink-0" style={{ backgroundColor: '#1B3A57' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  Social Media Group Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Detailed profile of a social media group
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
                    Group Information
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Group Name
                      </label>
                      <div className="text-lg font-bold text-[var(--color-primary)]">
                        {group.groupName}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Social Media
                      </label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSocialMediaBadgeColor(group.socialMedia)}`}>
                        {group.socialMedia}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          group.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {group.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Contact Information
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Contact Person
                      </label>
                      <div className="text-base text-[var(--color-text)] font-medium">
                        {group.contactPerson}
                      </div>
                    </div>

                    {group.contactNo && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Contact No
                        </label>
                        <div className="text-base text-[var(--color-text)] font-medium">
                          {group.contactNo}
                        </div>
                      </div>
                    )}

                    {group.idNumber && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          ID Number
                        </label>
                        <div className="text-base text-[var(--color-text)] font-medium">
                          {group.idNumber}
                        </div>
                      </div>
                    )}

                    {group.emailId && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Id
                        </label>
                        <a
                          href={`mailto:${group.emailId}`}
                          className="text-base text-blue-600 hover:underline"
                        >
                          {group.emailId}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                Record Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.createdAt && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Created At
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {new Date(group.createdAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {group.createdBy && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Created By
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {group.createdBy}
                    </div>
                  </div>
                )}

                {group.updatedAt && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Last Updated
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {new Date(group.updatedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {group.updatedBy && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Updated By
                    </label>
                    <div className="text-base text-[var(--color-text)]">
                      {group.updatedBy}
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
