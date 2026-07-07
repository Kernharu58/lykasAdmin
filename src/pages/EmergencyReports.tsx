import { useEffect, useMemo, useState } from 'react';
import {
  Siren, MapPin, Phone, User as UserIcon, Clock, CheckCircle2, AlertTriangle, ImageIcon,
} from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard, Toolbar } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';
type Priority = 'low' | 'medium' | 'high' | 'critical';

interface EmergencyReport {
  _id: string;
  type: string;
  animalType?: string;
  description: string;
  location: string;
  contactName?: string;
  contactPhone?: string;
  photos?: string[];
  priority: Priority;
  status: ReportStatus;
  submittedBy: { _id: string; displayName: string; email: string };
  assignedTo?: { _id: string; displayName: string } | null;
  resolutionNote?: string;
  createdAt: string;
}

const PRIORITY_VARIANT: Record<Priority, 'success' | 'warning' | 'danger' | 'default'> = {
  low: 'default', medium: 'warning', high: 'danger', critical: 'danger',
};

const STATUS_VARIANT: Record<ReportStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  open: 'danger', in_progress: 'warning', resolved: 'success', dismissed: 'default',
};

export default function EmergencyReports() {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('open');

  const [selected, setSelected] = useState<EmergencyReport | null>(null);
  const [status, setStatus] = useState<ReportStatus>('open');
  const [priority, setPriority] = useState<Priority>('medium');
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/emergency-reports?limit=100');
      setReports(res.data.reports || res.data || []);
    } catch {
      setError('Could not load emergency reports.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const counts = useMemo(() => ({
    open:     reports.filter(r => r.status === 'open').length,
    critical: reports.filter(r => r.priority === 'critical' || r.priority === 'high').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  }), [reports]);

  const filtered = statusFilter === 'all' ? reports : reports.filter(r => r.status === statusFilter);

  const openModal = (r: EmergencyReport) => {
    setSelected(r);
    setStatus(r.status);
    setPriority(r.priority);
    setResolutionNote(r.resolutionNote || '');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.put(`/emergency-reports/${selected._id}`, { status, priority, resolutionNote });
      addToast('success', 'Report updated.');
      setSelected(null);
      fetchReports();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not update report.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Emergency Reports"
        description="Triage rescue calls and abuse reports submitted from the mobile app."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Siren size={22} />}         label="Open"        value={counts.open.toString()}       tone="rose" />
        <StatCard icon={<AlertTriangle size={22} />} label="High/Critical" value={counts.critical.toString()} tone="amber" />
        <StatCard icon={<Clock size={22} />}         label="In Progress" value={counts.inProgress.toString()} tone="blue" />
        <StatCard icon={<CheckCircle2 size={22} />}  label="Resolved"    value={counts.resolved.toString()}   tone="emerald" />
      </div>

      {loading && <LoadingState message="Loading emergency reports..." />}
      {error && <ErrorState message={error} onRetry={fetchReports} />}

      {!loading && !error && (
        <Card noPadding>
          <Toolbar>
            <SectionHeader title="All Reports" description="Sorted by priority, then most recent." />
            <div className="flex gap-2 flex-wrap">
              {(['open', 'in_progress', 'resolved', 'dismissed', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    statusFilter === f ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </Toolbar>

          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No reports here" message="Emergency reports submitted by users will show up in this view." icon={<Siren size={28} />} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Report</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted By</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-semibold text-slate-800 capitalize">{r.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={12} />{r.location}</p>
                        {!!r.photos?.length && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><ImageIcon size={12} />{r.photos.length} photo(s)</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-800 font-medium flex items-center gap-1.5"><UserIcon size={13} className="text-slate-400" />{r.submittedBy?.displayName}</p>
                        {r.contactPhone && <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5"><Phone size={12} />{r.contactPhone}</p>}
                      </td>
                      <td className="px-5 py-4"><Badge variant={PRIORITY_VARIANT[r.priority]} className="capitalize">{r.priority}</Badge></td>
                      <td className="px-5 py-4"><Badge variant={STATUS_VARIANT[r.status]} className="capitalize">{r.status.replace('_', ' ')}</Badge></td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => openModal(r)}
                          className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-slate-800 mb-0.5 capitalize">{selected.type.replace(/_/g, ' ')}</h3>
            <p className="text-sm text-slate-500 mb-4 flex items-center gap-1.5"><MapPin size={13} />{selected.location}</p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 text-sm text-slate-700">
              {selected.description}
            </div>

            {!!selected.photos?.length && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {selected.photos.map((p, i) => (
                  <a key={i} href={p} target="_blank" rel="noreferrer">
                    <img src={p} alt={`evidence-${i}`} className="rounded-lg object-cover h-20 w-full border border-slate-200" />
                  </a>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as ReportStatus)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Resolution notes</label>
              <textarea
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder="What action was taken?"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
