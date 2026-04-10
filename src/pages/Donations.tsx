import React, { useState } from 'react';
import { DollarSign, HeartHandshake, TrendingUp, Download, Search, Filter } from 'lucide-react';

export default function Donations() {
  // Mock data for the UI
  const [donations] = useState([
    { id: '1', donor: 'Maria Santos', amount: 5000, date: '2026-04-10', method: 'GCash', status: 'Completed', campaign: 'General Fund' },
    { id: '2', donor: 'Anonymous', amount: 1500, date: '2026-04-09', method: 'Bank Transfer', status: 'Completed', campaign: 'Medical Emergency: Max' },
    { id: '3', donor: 'Juan Dela Cruz', amount: 500, date: '2026-04-08', method: 'Maya', status: 'Completed', campaign: 'General Fund' },
    { id: '4', donor: 'Sarah Lee', amount: 10000, date: '2026-04-05', method: 'Credit Card', status: 'Pending', campaign: 'New Shelter Roof' },
    { id: '5', donor: 'Mark Rivera', amount: 200, date: '2026-04-02', method: 'GCash', status: 'Completed', campaign: 'General Fund' },
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Donations</h1>
          <p className="text-gray-500 mt-1">Track financial contributions and donor history.</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors">
          <Download size={20} />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

      {/* Transaction Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-semibold text-lg text-gray-800">Recent Transactions</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search donors..." 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                <tr key={donation.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <span className="font-medium text-gray-800">{donation.donor}</span>
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
    </div>
  );
}