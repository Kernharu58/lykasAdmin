import { useEffect, useState } from 'react';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateDisplays';
import { Badge, Card, PageHeader, SectionHeader } from '../components/ui/SharedUI';

interface AuditLog {
  _id: string;
  action: string;
  createdAt: string;
  actor?: {
    displayName?: string;
  } | null;
  targetUser?: {
    displayName?: string;
  } | null;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/auth/audit-logs');
      setLogs(response.data);
    } catch (fetchError: any) {
      console.error('Error fetching audit logs:', fetchError);
      if (fetchError.response?.status === 404) {
        setError('The audit log endpoint is not available on the server yet.');
      } else {
        setError('Unable to load audit logs right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="System Audit Logs"
        description="Track privileged actions, access changes, and administrative activity across the platform."
      />

      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/60">
          <SectionHeader
            title="Security Activity Timeline"
            description="Use this log to review who acted, what changed, and when it happened."
          />
        </div>

        <div className="p-5 sm:p-6">
          {error ? (
            <ErrorState
              title="Audit Logs Unavailable"
              message={error}
              onRetry={fetchLogs}
            />
          ) : loading ? (
            <LoadingState message="Loading audit trail..." />
          ) : logs.length === 0 ? (
            <EmptyState
              title="No audit activity found"
              message="Once privileged actions are recorded, they will appear here."
              icon={<ShieldAlert size={48} />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Timestamp</th>
                    <th className="p-4 font-bold">Action</th>
                    <th className="p-4 font-bold">Actor</th>
                    <th className="p-4 font-bold">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b border-slate-50 hover:bg-slate-50/70">
                      <td className="p-4 text-sm text-slate-500 font-medium">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <Badge variant="default">{log.action}</Badge>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {log.actor?.displayName || 'System'}
                      </td>
                      <td className="p-4">
                        {log.targetUser ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <ArrowRight size={14} className="text-slate-400" />
                            {log.targetUser.displayName}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
