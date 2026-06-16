import { useState, useEffect } from 'react';
import { DollarSign, HeartHandshake, TrendingUp, Download, Search, Filter, MoreVertical, Eye, Download as DownloadIcon } from 'lucide-react';
import api from '../services/api';
import { ErrorState, LoadingState, EmptyState } from '../components/ui/StateDisplays';
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

// Mock data for UI development
const MOCK_DONATIONS: Donation[] = [
  { _id: '1', donorName: 'Maria Santos', email: 'maria@gmail.com', amount: 5000, date: '2026-06-05', method: 'GCash', status: 'Completed', campaign: 'General Fund', paymongoRefId: 'pay_123' },
  { _id: '2', donorName: 'Juan Dela Cruz', email: 'juan@yahoo.com', amount: 2500, date: '2026-06-04', method: 'Credit Card', status: 'Completed', campaign: 'Medical Care', paymongoRefId: 'pay_124' },
  { _id: '3', donorName: 'Anonymous', email: 'anon@email.com', amount: 1000, date: '2026-06-03', method: 'Bank Transfer', status: 'Pending', campaign: 'Food & Supplies', paymongoRefId: 'pay_125' },
  { _id: '4', donorName: 'Rosa Garcia', email: 'rosa@outlook.com', amount: 3500, date: '2026-06-02', method: 'PayMaya', status: 'Completed', campaign: 'General Fund', paymongoRefId: 'pay_126' },
  { _id: '5', donorName: 'Carlos Reyes', email: 'carlos@gmail.com', amount: 7500, date: '2026-06-01', method: 'Credit Card', status: 'Completed', campaign: 'Building Fund', paymongoRefId: 'pay_127' },
];

export default function Donations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [useMockData, setUseMockData] = useState(true);
  const { addToast } = useToast();

  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/payments?type=donation&status=paid&limit=50');
      const payments = response.data.payments || response.data || [];
      // Map Payment model fields → UI Donation shape
      const mapped: Donation[] = payments.map((p: any) => ({
        _id:            p._id,
        donorName:      p.paidBy?.displayName || 'Anonymous',
        email:          p.paidBy?.email || '',
        amount:         (p.amount || 0) / 100,           // centavos → PHP
        date:           p.paidAt || p.createdAt,
        method:         p.paymentMethod || 'PayMongo',
        status:         p.status === 'paid' ? 'Completed' : p.status === 'failed' ? 'Failed' : 'Pending',
        campaign:       p.description || 'General Fund',
        paymongoRefId:  p.paymongoPaymentId || '',
      }));
      setDonations(mapped);
      setUseMockData(false);
    } catch (err: any) {
      setError("Failed to fetch donation records. Using mock data for preview.");
      setDonations(MOCK_DONATIONS);
      setUseMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchDonations(); 
  }, []);

  const filteredDonations = donations.filter(d => {
    const matchesSearch = d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.campaign.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || d.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalThisMonth = donations.filter(d => new Date(d.date).getMonth() === new Date().getMonth()).reduce((sum, d) => sum + d.amount, 0);
  const uniqueDonors = new Set(donations.map(d => d.email)).size;

  const handleExportCSV = () => {
    const headers = ['Donor Name', 'Amount', 'Campaign', 'Method', 'Date', 'Status'];
    const rows = filteredDonations.map(d => [
      d.donorName,
      `₱${d.amount.toLocaleString()}`,
      d.campaign,
      d.method,
      new Date(d.date).toLocaleDateString(),
      d.status
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `donations-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    addToast('success', 'Donation report exported successfully');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header - Stack on mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Donations</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Track financial contributions and donor history.</p>
          {useMockData && <p className="text-xs text-amber-600 font-medium mt-1">📋 Showing mock data (backend pending)</p>}
        </div>
        <button onClick={handleExportCSV} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Stats Cards - Grid adapts automatically */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Raised (This Year)</p>
            <h3 className="text-2xl font-bold text-gray-800">₱ {totalRaised.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Donations This Month</p>
            <h3 className="text-2xl font-bold text-gray-800">₱ {totalThisMonth.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
            <HeartHandshake size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Unique Donors</p>
            <h3 className="text-2xl font-bold text-gray-800">{uniqueDonors}</h3>
          </div>
        </div>
      </div>

      {error && !useMockData ? (
        <ErrorState title="Backend Dependency Missing" message={error} onRetry={fetchDonations} />
      ) : isLoading ? (
        <LoadingState message="Loading financial records..." />
      ) : filteredDonations.length === 0 && !isLoading ? (
        <EmptyState title="No Donations Found" message="No donations match your search criteria." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar - Stack on mobile */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50/50 gap-4">
            <h2 className="font-semibold text-lg text-gray-800 w-full md:w-auto">Recent Transactions</h2>
            <div className="flex w-full md:w-auto gap-3 flex-wrap">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search donors..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"/>
              </div>
              <div className="flex gap-2">
                {['all', 'completed', 'pending', 'failed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CRITICAL: overflow-x-auto for Mobile Tables */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Donor Name</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Campaign</th>
                  <th className="p-4 font-medium">Method</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map((donation) => (
                  <tr key={donation._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <span className="font-medium text-gray-800 block">{donation.donorName}</span>
                        {donation.email && <span className="text-xs text-gray-500">{donation.email}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-emerald-600">₱ {donation.amount.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">{donation.campaign}</td>
                    <td className="p-4 text-gray-600 text-sm">{donation.method}</td>
                    <td className="p-4 text-gray-600 text-sm">{new Date(donation.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        donation.status === 'Completed' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : donation.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-800 transition-colors" title="View details">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-800 transition-colors" title="Download receipt">
                          <DownloadIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm">
            <span className="text-gray-600">Showing {filteredDonations.length} of {donations.length} donations</span>
            <div className="flex gap-2">
              <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Previous</button>
              <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
