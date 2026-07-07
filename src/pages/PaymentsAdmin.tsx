import { useEffect, useState } from 'react';
import { Wallet, CircleDollarSign, AlertCircle, RotateCcw, User as UserIcon } from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard, Toolbar } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface Payment {
  _id: string;
  type: string;
  amount: number; // centavos
  currency: string;
  description?: string;
  status: PaymentStatus;
  paymentMethod?: string;
  paidBy: { _id: string; displayName: string; email: string } | null;
  paidAt?: string;
  createdAt: string;
}

interface Summary {
  totalDonations: number;
  pendingPayments: number;
  failedPayments: number;
}

const STATUS_VARIANT: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  pending: 'warning', paid: 'success', failed: 'danger', refunded: 'default',
};

const peso = (centavos: number) => `₱${(centavos / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');

  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const params = statusFilter !== 'all' ? `?status=${statusFilter}&limit=100` : '?limit=100';
      const [paymentsRes, summaryRes] = await Promise.all([
        api.get(`/payments${params}`),
        api.get('/payments/summary'),
      ]);
      setPayments(paymentsRes.data.payments || paymentsRes.data || []);
      setSummary(summaryRes.data);
    } catch {
      setError('Could not load payments.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleRefund = async () => {
    if (!refundTarget) return;
    setSubmitting(true);
    try {
      await api.put(`/payments/${refundTarget._id}/refund`, {});
      addToast('success', `Payment for ${refundTarget.paidBy?.displayName || 'user'} marked as refunded.`);
      setRefundTarget(null);
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not process refund.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Payment Management"
        description="Track donation checkouts processed through PayMongo, and handle refunds."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<CircleDollarSign size={22} />} label="Total Donations Received" value={summary ? peso(summary.totalDonations * 100) : '—'} tone="emerald" />
        <StatCard icon={<Wallet size={22} />}            label="Pending Payments"        value={summary?.pendingPayments.toString() ?? '—'}     tone="amber" />
        <StatCard icon={<AlertCircle size={22} />}       label="Failed Payments"         value={summary?.failedPayments.toString() ?? '—'}      tone="rose" />
      </div>

      {loading && <LoadingState message="Loading payments..." />}
      {error && <ErrorState message={error} onRetry={fetchData} />}

      {!loading && !error && (
        <Card noPadding>
          <Toolbar>
            <SectionHeader title="Transactions" description="All donation checkouts, most recent first." />
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'paid', 'failed', 'refunded'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    statusFilter === f ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </Toolbar>

          {payments.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No transactions" message="Donation payments will appear here once users start checking out." icon={<Wallet size={28} />} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Paid By</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5"><UserIcon size={13} className="text-slate-400" />{p.paidBy?.displayName || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{p.paidBy?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 max-w-xs truncate">{p.description || '—'}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{peso(p.amount)}</td>
                      <td className="px-5 py-4 text-slate-500 capitalize">{p.paymentMethod || '—'}</td>
                      <td className="px-5 py-4"><Badge variant={STATUS_VARIANT[p.status]} className="capitalize">{p.status}</Badge></td>
                      <td className="px-5 py-4 text-slate-500 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        {p.status === 'paid' ? (
                          <button
                            onClick={() => setRefundTarget(p)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                          >
                            <RotateCcw size={13} /> Refund
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <ConfirmModal
        isOpen={!!refundTarget}
        title="Mark payment as refunded?"
        message={refundTarget ? `This marks the ${peso(refundTarget.amount)} payment from ${refundTarget.paidBy?.displayName || 'this user'} as refunded and notifies them. The actual refund must still be issued through PayMongo.` : ''}
        confirmText="Mark Refunded"
        isDestructive
        isLoading={submitting}
        onConfirm={handleRefund}
        onCancel={() => setRefundTarget(null)}
      />
    </div>
  );
}
