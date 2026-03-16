import { useEffect, useState } from 'react';
import { X, Edit2, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { clearingAgentsService } from '../../services/clearingAgentsService';
import { ClearingAgent } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ViewClearingAgentProps {
  agentId: number;
  onClose: () => void;
  onEdit?: (id: number) => void;
  userPermissions?: string[];
}

export const ViewClearingAgent = ({
  agentId,
  onClose,
  onEdit,
  userPermissions = [],
}: ViewClearingAgentProps) => {
  const [agent, setAgent] = useState<ClearingAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  const fetchAgent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clearingAgentsService.getById(agentId);
      setAgent(data);
    } catch (err) {
      console.error('Failed to fetch agent:', err);
      setError('Failed to load clearing agent details');
    } finally {
      setLoading(false);
    }
  };

  const hasEditPermission = () => {
    return (
      userPermissions.includes('ClearingAgent.Update') ||
      userPermissions.includes('Employee.Edit')
    );
  };

  const handleEdit = () => {
    if (onEdit && agent) {
      onEdit(agent.clearingAgentId);
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

  if (error || !agent) {
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
                  Clearing Agent Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Detailed profile of a registered clearing agent
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasEditPermission() && (
                  <Button
                    onClick={handleEdit}
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
                        Agent Code
                      </label>
                      <div className="text-lg font-bold text-[var(--color-primary)]">
                        {agent.agentCode}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Agent Name
                      </label>
                      <div className="text-xl font-semibold text-[var(--color-text)]">
                        {agent.agentName}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        VAT Number
                      </label>
                      <div className="text-base text-[var(--color-text)]">
                        {agent.vatNumber || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Status
                      </label>
                      <div>
                        {agent.isActive ? (
                          <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Location & Web
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Country
                      </label>
                      <div className="text-base text-[var(--color-text)]">
                        {agent.country || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Address
                      </label>
                      <div className="text-base text-[var(--color-text)] whitespace-pre-wrap">
                        {agent.address || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Website
                      </label>
                      <div className="text-base">
                        {agent.website ? (
                          <a
                            href={agent.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-primary)] hover:underline"
                          >
                            {agent.website}
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>
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
                      <div className="text-base text-[var(--color-text)]">
                        {agent.contactPerson || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <div className="text-base">
                        {agent.email ? (
                          <a
                            href={`mailto:${agent.email}`}
                            className="text-[var(--color-primary)] hover:underline"
                          >
                            {agent.email}
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <div className="text-base text-[var(--color-text)]">
                        {agent.phoneNumber || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Fax Number
                      </label>
                      <div className="text-base text-[var(--color-text)]">
                        {agent.faxNumber || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
                    Additional Information
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Remarks
                      </label>
                      <div className="text-base text-[var(--color-text)] whitespace-pre-wrap min-h-[80px]">
                        {agent.remarks || 'No remarks'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0">
            {hasEditPermission() && (
              <Button
                onClick={handleEdit}
                className="bg-[var(--color-primary)] hover:opacity-90 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
            <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">
              Close
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
