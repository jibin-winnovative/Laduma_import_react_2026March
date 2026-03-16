import { useState } from 'react';
import { PaymentsList } from './PaymentsList';
import { ViewPaymentRequest } from './ViewPaymentRequest';

export default function AccountsPayablePage() {
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectRequest = (requestId: number) => {
    setSelectedRequestId(requestId);
    setViewModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Accounts Payable</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Manage payment requests and process vendor payments
        </p>
      </div>

      <PaymentsList key={refreshKey} onSelectRequest={handleSelectRequest} />

      {selectedRequestId && (
        <ViewPaymentRequest
          requestId={selectedRequestId}
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedRequestId(null);
          }}
          onMakePayment={() => {}}
          onRefresh={() => setRefreshKey((prev) => prev + 1)}
        />
      )}
    </div>
  );
}
