import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { containersService, ContainerStatusHistory } from '../../services/containersService';

interface StatusHistoryProps {
  containerId: number;
}

export const ContainerStatusHistoryTimeline = ({ containerId }: StatusHistoryProps) => {
  const [history, setHistory] = useState<ContainerStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [containerId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await containersService.getStatusHistory(containerId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load status history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase().trim() || '';
    const colors: Record<string, string> = {
      'draft': 'text-gray-600',
      'booked': 'text-blue-600',
      'in transit': 'text-orange-600',
      'received': 'text-green-600',
      'canceled': 'text-red-600',
    };
    return colors[normalizedStatus] || 'text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Canceled') {
      return <XCircle className="w-5 h-5" />;
    }
    return <CheckCircle className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Status History</h3>
        <div className="text-sm text-[var(--color-text-secondary)]">Loading history...</div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Status History</h3>
        <div className="text-sm text-[var(--color-text-secondary)]">No status changes yet</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Status History
      </h3>
      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={item.containerStatusHistoryId} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`${getStatusColor(item.toStatus)} mt-1`}>
                {getStatusIcon(item.toStatus)}
              </div>
              {index < history.length - 1 && (
                <div className="w-0.5 h-full bg-gray-300 mt-2" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`font-semibold ${getStatusColor(item.toStatus)}`}>
                  {item.fromStatus} → {item.toStatus}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {new Date(item.statusChangeDate).toLocaleString()}
                </span>
              </div>
              {item.remark && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {item.remark}
                </p>
              )}
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                Changed by {item.changedBy} on {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
