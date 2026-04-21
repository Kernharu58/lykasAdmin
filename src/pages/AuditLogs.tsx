import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // You will need to create this route in your backend authRoutes.js!
        const response = await api.get('/auth/audit-logs');
        setLogs(response.data);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
          <ShieldAlert className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">System Audit Logs</h1>
          <p className="text-gray-500 mt-1">Super Admin security overview and action tracking.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">Timestamp</th>
                <th className="p-4 font-medium">Action Performed</th>
                <th className="p-4 font-medium">Actor (Admin)</th>
                <th className="p-4 font-medium">Target User</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No recent activity found.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 text-sm text-gray-500 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      {log.actor?.displayName || 'System'}
                    </td>
                    <td className="p-4">
                      {log.targetUser ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ArrowRight size={14} className="text-gray-400" />
                          {log.targetUser.displayName}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm italic">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}