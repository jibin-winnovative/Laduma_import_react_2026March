import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { containersService, ContainerListItem } from '../../services/containersService';

const AVAILABLE_STATUSES = ['Draft', 'Booked', 'In Transit'];
const DEFAULT_SELECTED_STATUSES = ['Draft', 'Booked', 'In Transit'];

const STATUS_BADGE_CLASSES: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-800',
  Booked: 'bg-blue-100 text-blue-800',
  'In Transit': 'bg-amber-100 text-amber-800',
  Received: 'bg-green-100 text-green-800',
  Canceled: 'bg-red-100 text-red-800',
};

interface ContainerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (containerId: number, containerNumber: string) => void;
}

export const ContainerSearchModal = ({
  isOpen,
  onClose,
  onSelect,
}: ContainerSearchModalProps) => {
  const [searchText, setSearchText] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(DEFAULT_SELECTED_STATUSES);
  const [containers, setContainers] = useState<ContainerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (isOpen) {
      handleSearch();
    }
  }, [isOpen, currentPage]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await containersService.search({
        searchText: searchText || undefined,
        statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        fromDate: fromDate || null,
        toDate: toDate || null,
        pageNumber: currentPage,
        pageSize,
      });
      setContainers(response.items);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to search containers:', err);
      setContainers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    setCurrentPage(1);
    handleSearch();
  };

  const handleReset = () => {
    setSearchText('');
    setFromDate('');
    setToDate('');
    setSelectedStatuses(DEFAULT_SELECTED_STATUSES);
    setCurrentPage(1);
  };

  const toggleStatus = (s: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSelectContainer = (container: ContainerListItem) => {
    onSelect(container.containerId, container.containerNumber);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Containers" size="xlarge">
      <div className="space-y-4">
        <Card>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Container number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_STATUSES.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(s)}
                      onChange={() => toggleStatus(s)}
                      className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[s] ?? 'bg-gray-100 text-gray-800'}`}
                    >
                      {s}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearchClick} className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
              <Button onClick={handleReset} variant="secondary">
                Reset
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)]" />
            </div>
          ) : containers.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              No containers found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Container Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipping Company
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total POs
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total CBM
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {containers.map((container) => (
                      <tr key={container.containerId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {container.containerNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(container.containerDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {container.shippingCompanyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {container.totalPOs}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {container.totalCBM.toFixed(3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {fmt(container.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[container.status] ?? 'bg-gray-100 text-gray-800'}`}
                          >
                            {container.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Button
                            onClick={() => handleSelectContainer(container)}
                            variant="primary"
                            className="text-xs"
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      variant="secondary"
                      className="text-sm"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      variant="secondary"
                      className="text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </Modal>
  );
};
