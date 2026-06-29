import { useState, useEffect } from 'react';
import { DollarSign, HeartHandshake, TrendingUp, Download, Search, Eye, X } from 'lucide-react';
import api from '../services/api';
import { ErrorState, LoadingState, EmptyState } from '../components/ui/StateDisplays';
import { Badge, Card, PageHeader, SectionHeader, StatCard, Toolbar } from '../components/ui/SharedUI';
import { useToast } from '../context/ToastContext';

interface Donation {
  _id: string;
  donorName: string;
  email?: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  campaign: string;
  paymongoRefId?: string;
}

function statusVariant(s: string): 'success' | 'warning' | 'danger' {
  if (s === 'Completed') return 'success';
  if (s === 'Pending')   return 'warning';
  return 'danger';
}

export default function Donations() {
  const [donations, setDonations]     = useState<Donation[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  // FIX (Warning #4): State for donation detail modal
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const { addToast } = useToast();

  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      // FIX (Critical #2): Remove mock data fallback — set real error state instead
      setError(null);
      const response = await api.get('/payments?type=donation&status=paid&limit=50');
      const payments = response.data.payments || response.data || [];
      const mapped: Donation[] = payments.map((p: any) => ({
        _id:           p._id,
        donorName:     p.paidBy?.displayName || 'Anonymous',
        email:         p.paidBy?.email || '',
        amount:        (p.amount || 0) / 100,
        date:          p.paidAt || p.createdAt,
        method:        p.paymentMethod || 'PayMongo',
        status:        p.status === 'paid' ? 'Completed' : p.status === 'failed' ? 'Failed' : 'Pending',
        campaign:      p.description || 'General Fund',
        paymongoRefId: p.paymongoPaymentId || '',
      }));
      setDonations(mapped);
    } catch {
      // FIX (Critical #2): Show real error state — never fall back to mock data
      setError('Could not load donation records. Please check your connection and try again.');
      setDonations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDonations(); }, []);

  const handleExportCSV = () => {
    const header = 'Donor,Email,Amount,Campaign,Method,Date,Status\n';
    const rows = donations.map(d =>
      `"${d.donorName}","${d.email || ''}",${d.amount},"${d.campaign}","${d.method}","${new Date(d.date).toLocaleDateString()}","${d.status}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'donations.csv'; a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Export downloaded.');
  };

  const filtered = donations.filter(d => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = d.donorName.toLowerCase().includes(q) || (d.email?.toLowerCase().includes(q)) || d.campaign.toLowerCase().includes(q);
    const matchesFilter = filterStatus === 'all' || d.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalRaised    = donations.reduce((s, d) => s + d.amount, 0);
  const totalThisMonth = donations.filter(d => new Date(d.date).getMonth() === new Date().getMonth()).reduce((s, d) => s + d.amount, 0);
  const uniqueDonors   = new Set(donations.map(d => d.email)).size;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Donations"
        description="Track financial contributions and donor history."
        action={
          <button
            onClick={handleExportCSV}
            disabled={donations.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<DollarSign    size={22} />} label="Total Raised (Year)"  value={`₱${totalRaised.toLocaleString()}`}    tone="emerald" />
        <StatCard icon={<TrendingUp    size={22} />} label="Donations This Month" value={`₱${totalThisMonth.toLocaleString()}`}  tone="blue"    />
        <StatCard icon={<HeartHandshake size={22}/>} label="Unique Donors"        value={String(uniqueDonors)}                   tone="purple"  />
      </div>

      {error ? (
        <ErrorState title="Could not load donations" message={error} onRetry={fetchDonations} />
      ) : isLoading ? (
        <LoadingState message="Loading financial records..." />
      ) : (
        <Card noPadding>
          <Toolbar>
            <SectionHeader title="Recent Transactions" description={`${filtered.length} of ${donations.length} records`} />
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search donors…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'completed', 'pending', 'failed'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${filterStatus === s ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </Toolbar>

          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No donations found" message="Try adjusting your search or filter. Donations made through the app will appear here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Donor</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(d => (
                    <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{d.donorName}</p>
                        {d.email && <p className="text-xs text-slate-400 mt-0.5">{d.email}</p>}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-600">₱{d.amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-600">{d.campaign}</td>
                      <td className="px-5 py-4 text-slate-600">{d.method}</td>
                      <td className="px-5 py-4 text-slate-500">{new Date(d.date).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {/* FIX (Warning #4): Wire up the Eye button to open a detail modal */}
                        <button
                          onClick={() => setSelectedDonation(d)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
            <span>Showing {filtered.length} of {donations.length} donations</span>
          </div>
        </Card>
      )}

      {/* FIX (Warning #4): Donation detail modal */}
      {selectedDonation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">Donation Details</h3>
                <p className="text-sm text-slate-500 mt-0.5">{selectedDonation.paymongoRefId || 'No reference ID'}</p>
              </div>
              <button onClick={() => setSelectedDonation(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                ['Donor',    selectedDonation.donorName],
                ['Email',    selectedDonation.email || '—'],
                ['Amount',   `₱${selectedDonation.amount.toLocaleString()}`],
                ['Campaign', selectedDonation.campaign],
                ['Method',   selectedDonation.method],
                ['Date',     new Date(selectedDonation.date).toLocaleDateString('en-PH', { dateStyle: 'long' })],
                ['Status',   selectedDonation.status],
                ['PayMongo Ref', selectedDonation.paymongoRefId || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500 font-medium">{label}</span>
                  <span className="text-sm text-slate-800 font-semibold text-right max-w-[60%] break-all">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedDonation(null)}
              className="mt-5 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
