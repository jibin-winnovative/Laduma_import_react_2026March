import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, FileCheck, Send, File as FileEdit } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { purchaseOrdersService, PurchaseOrderEventLog } from '../../services/purchaseOrdersService';

interface EventLogProps {
  purchaseOrderId: number;
}

export const PurchaseOrderEventLogTimeline = ({ purchaseOrderId }: EventLogProps) => {
  const [events, setEvents] = useState<PurchaseOrderEventLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventLog();
  }, [purchaseOrderId]);

  const loadEventLog = async () => {
    setLoading(true);
    try {
      const data = await purchaseOrdersService.getEventLog(purchaseOrderId);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load event log:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      StatusChange: 'text-blue-600',
      Created: 'text-green-600',
      Submitted: 'text-orange-600',
      Approved: 'text-green-600',
      Rejected: 'text-red-600',
      Updated: 'text-blue-600',
    };
    return colors[eventType] || 'text-gray-600';
  };

  const getEventIcon = (eventType: string, toStatus?: string) => {
    if (eventType === 'Rejected' || toStatus === 'Rejected') {
      return <XCircle className="w-5 h-5" />;
    }
    if (eventType === 'Approved' || toStatus === 'Approved') {
      return <CheckCircle className="w-5 h-5" />;
    }
    if (eventType === 'Submitted' || toStatus === 'Submitted') {
      return <Send className="w-5 h-5" />;
    }
    if (eventType === 'Created') {
      return <FileCheck className="w-5 h-5" />;
    }
    if (eventType === 'Updated') {
      return <FileEdit className="w-5 h-5" />;
    }
    if (eventType === 'StatusChange') {
      if (toStatus === 'Rejected') return <XCircle className="w-5 h-5" />;
      if (toStatus === 'Approved') return <CheckCircle className="w-5 h-5" />;
      if (toStatus === 'Submitted') return <Send className="w-5 h-5" />;
      return <CheckCircle className="w-5 h-5" />;
    }
    return <Clock className="w-5 h-5" />;
  };

  const getEventBgColor = (eventType: string, toStatus?: string) => {
    if (eventType === 'Rejected' || toStatus === 'Rejected') return 'bg-red-50';
    if (eventType === 'Approved' || toStatus === 'Approved') return 'bg-green-50';
    if (eventType === 'Submitted' || toStatus === 'Submitted') return 'bg-orange-50';
    if (eventType === 'Created') return 'bg-green-50';
    return 'bg-blue-50';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Event Log</h3>
        <div className="text-sm text-[var(--color-text-secondary)]">Loading events...</div>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Event Log</h3>
        <div className="text-sm text-[var(--color-text-secondary)]">No events yet</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Event Log
      </h3>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.eventId} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`${getEventColor(event.eventType)} mt-1`}>
                {getEventIcon(event.eventType, event.toStatus)}
              </div>
              {index < events.length - 1 && (
                <div className="w-0.5 h-full bg-gray-300 mt-2" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className={`p-3 rounded-lg ${getEventBgColor(event.eventType, event.toStatus)}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`font-semibold ${getEventColor(event.eventType)}`}>
                    {event.eventName}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {new Date(event.eventDate).toLocaleString()}
                  </span>
                </div>

                {event.fromStatus && event.toStatus && (
                  <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Status: {event.fromStatus} → {event.toStatus}
                  </div>
                )}

                {event.remark && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                    {event.remark}
                  </p>
                )}

                <div className="text-xs text-[var(--color-text-secondary)] mt-2">
                  By {event.changedBy} on {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
