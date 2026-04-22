import { useState, useEffect } from 'react';
import { DollarSign, HeartHandshake, TrendingUp, Download, Search, Filter } from 'lucide-react';
import api from '../services/api';
import { ErrorState, LoadingState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';

interface Donation {
  _id: string;
  donorName: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  campaign: string;
}

export default function Donations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // This endpoint does not currently exist on the backend!
      // We are wiring it so it is ready once the backend team builds it.
      const response = await api.get('/donations'); 
      setDonations(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("The Donations API endpoint is not yet implemented on the server.");
      } else {
        setError("Failed to fetch donation records. Please try again later.");
        addToast('error', 'Failed to sync donations data.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchDonations(); 
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header - Stack on mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Donations</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Track financial contributions and donor history.</p>
        </div>
        <button className="w-full sm:w-auto flex justify-center items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Download size={20} />
          Export Report
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
            <h3 className="text-2xl font-bold text-gray-800">₱ 145,200</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Donations This Month</p>
            <h3 className="text-2xl font-bold text-gray-800">₱ 17,200</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
            <HeartHandshake size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Unique Donors</p>
            <h3 className="text-2xl font-bold text-gray-800">128</h3>
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState title="Backend Dependency Missing" message={error} onRetry={fetchDonations} />
      ) : isLoading ? (
        <LoadingState message="Loading financial records..." />
      ) : donations.length === 0 ? (
        <EmptyState title="No Donations Yet" message="When donations are received, they will appear here." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar - Stack on mobile */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50/50 gap-4">
            <h2 className="font-semibold text-lg text-gray-800 w-full md:w-auto">Recent Transactions</h2>
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search donors..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"/>
              </div>
              <button className="flex shrink-0 items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">
                <Filter size={18} />
                <span className="hidden sm:inline">Filter</span>
              </button>
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
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-gray-800">{donation.donorName}</span>
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
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
