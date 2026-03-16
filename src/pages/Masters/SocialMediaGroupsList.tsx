import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Filter, Eye, CreditCard as Edit2 } from 'lucide-react';
import { socialMediaGroupsService, SocialMediaGroup } from '../../services/socialMediaGroupsService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SocialMediaGroupForm } from './SocialMediaGroupForm';
import { ViewSocialMediaGroup } from './ViewSocialMediaGroup';

const SOCIAL_MEDIA_OPTIONS = [
  'WhatsApp',
  'WeChat',
  'LinkedIn',
  'Instagram',
  'Snapchat',
  'Telegram',
  'Facebook',
];

export const SocialMediaGroupsList = () => {
  const [groups, setGroups] = useState<SocialMediaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalGroups: 0,
    activeGroups: 0,
    totalDistinctContacts: 0,
    lastUpdatedDate: undefined as string | undefined,
    lastUpdatedBy: '',
    formattedLastUpdated: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSocialMedia, setSelectedSocialMedia] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [currentPage, searchTerm, selectedSocialMedia, selectedStatus]);

  const fetchSummary = async () => {
    try {
      const data = await socialMediaGroupsService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary({
        totalGroups: 0,
        activeGroups: 0,
        totalDistinctContacts: 0,
        lastUpdatedDate: undefined,
        lastUpdatedBy: '',
        formattedLastUpdated: '',
      });
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await socialMediaGroupsService.getList({
        page: currentPage,
        pageSize,
        search: searchTerm || undefined,
        socialMedia: selectedSocialMedia || undefined,
        isActive: selectedStatus === '' ? undefined : selectedStatus === 'active',
      });
      setGroups(response?.data || []);
      setTotalPages(response?.totalPages || 1);
      setTotalRecords(response?.totalRecords || 0);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number) => {
    setSelectedGroupId(id);
    setShowViewModal(true);
  };

  const handleEdit = (id: number) => {
    setSelectedGroupId(id);
    setShowEditForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedGroupId(null);
  };

  const handleSuccess = () => {
    fetchGroups();
    fetchSummary();
    handleCloseForm();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchGroups();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedSocialMedia('');
    setSelectedStatus('');
    setCurrentPage(1);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Social Media Groups</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage WhatsApp and WeChat group master data
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Group</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Groups</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalGroups}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active Groups</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-success)] mt-1">
                {summary.activeGroups}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Distinct Contacts</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                {summary.totalDistinctContacts}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
              <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-secondary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Last Updated</p>
            <p className="text-sm sm:text-base font-semibold text-[var(--color-text)] mt-1">
              {summary.lastUpdatedDate && summary.lastUpdatedDate !== '0001-01-01T00:00:00'
                ? new Date(summary.lastUpdatedDate).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by group name, contact person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Social Media
              </label>
              <select
                value={selectedSocialMedia}
                onChange={(e) => setSelectedSocialMedia(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="">All</option>
                {SOCIAL_MEDIA_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
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
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleSearch}
                className="flex-1 bg-[var(--color-primary)] hover:opacity-90 text-white"
              >
                Search
              </Button>
              <Button onClick={handleReset} variant="secondary">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Social Media
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
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
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No social media groups found
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.socialMediaGroupId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {group.groupName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSocialMediaBadgeColor(group.socialMedia)}`}>
                        {group.socialMedia}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {group.contactPerson}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {group.contactNo || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {group.idNumber || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                      {group.emailId || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {group.isActive ? (
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
                          onClick={() => handleView(group.socialMediaGroupId)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(group.socialMediaGroupId)}
                          className="p-1 text-[var(--color-primary)] hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && groups.length > 0 && (
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

      {showAddForm && (
        <SocialMediaGroupForm
          mode="add"
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showEditForm && selectedGroupId && (
        <SocialMediaGroupForm
          mode="edit"
          groupId={selectedGroupId}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {showViewModal && selectedGroupId && (
        <ViewSocialMediaGroup
          groupId={selectedGroupId}
          onClose={() => {
            setShowViewModal(false);
            setSelectedGroupId(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditForm(true);
          }}
        />
      )}
    </div>
  );
};
