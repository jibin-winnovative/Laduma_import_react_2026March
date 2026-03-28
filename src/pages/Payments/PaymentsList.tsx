import { useState, useEffect } from 'react';
import { Search, DollarSign, Clock, CheckCircle, TrendingUp, Calendar, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { paymentsService, PaymentRequest, DashboardSummary } from '../../services/paymentsService';

interface PaymentsListProps {
  onSelectRequest: (requestId: number) => void;
}

export function PaymentsList({ onSelectRequest }: PaymentsListProps) {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 20;

  const [filters, setFilters] = useState({
    vendorName: '',
    sourceModule: '',
    status: 'Approved',
    fromDate: '',
    toDate: '',
    refNumber: '',
  });

  const loadSummary = async () => {
    try {
      const data = await paymentsService.getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params: any = {
        pageNumber: currentPage,
        pageSize,
      };

      if (filters.vendorName) params.vendorName = filters.vendorName;
      if (filters.sourceModule) params.sourceModule = filters.sourceModule;
      if (filters.status) params.status = filters.status;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.refNumber) params.refNumber = filters.refNumber;

      const response = await paymentsService.getPaymentRequests(params);
      setPayments(response.data);
      setTotalPages(response.totalPages);
      setTotalRecords(response.totalRecords);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadPayments();
  };

  const handleReset = () => {
    setFilters({
      vendorName: '',
      sourceModule: '',
      status: 'Approved',
      fromDate: '',
      toDate: '',
      refNumber: '',
    });
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage === 1) {
      loadPayments();
    }
  }, [filters]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      Approved: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      Paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      Rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: Clock },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status !== 'Approved') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Approved Requests</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {summary.pendingRequestCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Approved Amount</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {formatCurrency(summary.pendingAmountTotal)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Paid Requests</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {summary.paidRequestCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Paid This Month</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {summary.paidThisMonthCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Amount This Month</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {formatCurrency(summary.paidThisMonthTotal)}
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                value={filters.vendorName}
                onChange={(e) => setFilters({ ...filters, vendorName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Search vendor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Ref Number
              </label>
              <input
                type="text"
                value={filters.refNumber}
                onChange={(e) => setFilters({ ...filters, refNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Search ref number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Source Module
              </label>
              <select
                value={filters.sourceModule}
                onChange={(e) => setFilters({ ...filters, sourceModule: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Modules</option>
                <option value="LocalPayment">LocalPayment</option>
                <option value="OceanFreightPayment">OceanFreightPayment</option>
                <option value="Purchase">Purchase</option>
                <option value="ClearingPayment">ClearingPayment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end gap-2 lg:col-span-2">
              <Button onClick={handleSearch} className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4" />
                Search
              </Button>
              <Button onClick={handleReset} variant="secondary">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Payment Requests</h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-secondary)]">Loading...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-secondary)]">No payment requests found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-primary)]">
                        Vendor Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-primary)]">
                        Vendor Type
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-primary)]">
                        Source Module
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-primary)]">
                        Ref Number
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[var(--color-text-primary)]">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-primary)]">
                        Due Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-primary)]">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-primary)]">
                        Created Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-primary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.paymentRequestId}
                        className={`border-b hover:bg-gray-50 cursor-pointer ${
                          isOverdue(payment.dueDate, payment.status) ? 'bg-red-50' : ''
                        }`}
                        onClick={() => onSelectRequest(payment.paymentRequestId)}
                      >
                        <td className="py-3 px-4 text-sm text-[var(--color-text-primary)]">
                          {payment.vendorName}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">
                          {payment.vendorType}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">
                          {payment.sourceModule}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">
                          {payment.refNumber || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--color-text-primary)] text-right font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">
                          <div className={isOverdue(payment.dueDate, payment.status) ? 'text-red-600 font-medium' : ''}>
                            {formatDate(payment.dueDate)}
                            {isOverdue(payment.dueDate, payment.status) && (
                              <span className="ml-1 text-xs">(Overdue)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRequest(payment.paymentRequestId);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Showing {payments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
