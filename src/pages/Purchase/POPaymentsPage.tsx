import { useState } from 'react';
import { POPaymentsList } from './POPaymentsList';
import { ViewPOPaymentDetails } from './ViewPOPaymentDetails';

export const POPaymentsPage = () => {
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectPayment = (paymentId: number) => {
    setSelectedPaymentId(paymentId);
  };

  const handleCloseDetails = () => {
    setSelectedPaymentId(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">PO Payments</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Manage and request payments for purchase orders
        </p>
      </div>

      <POPaymentsList key={refreshTrigger} onSelectPayment={handleSelectPayment} />

      {selectedPaymentId && (
        <ViewPOPaymentDetails
          paymentId={selectedPaymentId}
          onClose={handleCloseDetails}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
