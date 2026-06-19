import { Activity, CalendarClock, HeartHandshake, MessageSquare, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge, Card, PageHeader, SectionHeader, StatCard } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

interface Foster {
  _id: string;
  pet: { _id: string; name: string; species: string };
  fosterer: { _id: string; displayName: string; email: string };
  startDate: string;
  expectedEndDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  fosterAgreementSigned: boolean;
}

function daysLeft(date?: string) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export default function Fosters() {
  const [fosters, setFosters]           = useState<Foster[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [selected, setSelected]         = useState<Foster | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [returnNotes, setReturnNotes]   = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const { addToast } = useToast();

  const fetchFosters = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/foster?status=active&limit=50');
      setFosters(res.data.fosters || res.data);
    } catch (e: any) {
      setError('Could not load foster placements.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchFosters(); }, []);

  const handleEnd = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.put(`/foster/${selected._id}/end`, { returnNotes });
      addToast('success', `Foster placement for ${selected.pet.name} ended.`);
      setShowEndModal(false); setSelected(null); setReturnNotes('');
      fetchFosters();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not end placement.');
    } finally { setSubmitting(false); }
  };

  const active     = fosters.filter(f => f.status === 'active');
  const endingSoon = fosters.filter(f => { const d = daysLeft(f.expectedEndDate); return d !== null && d <= 14 && d >= 0; });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Foster Management"
        description="Track mandatory trial periods, health updates, and foster-to-adoption decisions."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<HeartHandshake size={24} />} label="Active Fosters"  value={active.length.toString()}     tone="emerald" />
        <StatCard icon={<CalendarClock  size={24} />} label="Ending Soon"     value={endingSoon.length.toString()} tone="amber" />
        <StatCard icon={<Activity       size={24} />} label="Total Placements" value={fosters.length.toString()}   tone="blue" />
        <StatCard icon={<ShieldCheck    size={24} />} label="Agreement Signed" value={fosters.filter(f => f.fosterAgreementSigned).length.toString()} tone="slate" />
      </div>

      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <SectionHeader title="Foster Pipeline" description="Real-time placements from the mobile app." />
        </div>

        {error ? <div className="p-6"><ErrorState message={error} onRetry={fetchFosters} /></div>
          : loading ? <div className="p-6"><LoadingState message="Loading foster placements..." /></div>
          : fosters.length === 0 ? <div className="p-6"><EmptyState title="No active fosters" message="Foster placements will appear here once assigned from the mobile app." /></div>
          : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-white text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4">Foster</th>
                  <th className="p-4">Pet</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">Expected End</th>
                  <th className="p-4">Days Left</th>
                  <th className="p-4">Agreement</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fosters.map(f => {
                  const days = daysLeft(f.expectedEndDate);
                  return (
                    <tr key={f._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{f.fosterer?.displayName}<br /><span className="text-xs font-normal text-slate-500">{f.fosterer?.email}</span></td>
                      <td className="p-4 text-slate-700">{f.pet?.name} <span className="text-xs text-slate-400">({f.pet?.species})</span></td>
                      <td className="p-4 text-sm text-slate-600">{new Date(f.startDate).toLocaleDateString()}</td>
                      <td className="p-4 text-sm text-slate-600">{f.expectedEndDate ? new Date(f.expectedEndDate).toLocaleDateString() : '—'}</td>
                      <td className="p-4 text-sm font-bold">
                        {days !== null ? (
                          <span className={days <= 7 ? 'text-red-600' : days <= 14 ? 'text-amber-600' : 'text-slate-600'}>{days}d</span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="p-4">
                        <Badge variant={f.fosterAgreementSigned ? 'success' : 'warning'}>
                          {f.fosterAgreementSigned ? 'Signed' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={f.status === 'active' ? 'info' : f.status === 'completed' ? 'success' : 'danger'}>
                          {f.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {f.status === 'active' && (
                            <button onClick={() => { setSelected(f); setShowEndModal(true); }}
                              className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
                              End Foster
                            </button>
                          )}
                          <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1">
                            <MessageSquare size={16} /> Chat
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showEndModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">End Foster — {selected.pet.name}</h2>
              <button onClick={() => { setShowEndModal(false); setSelected(null); }} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 space-y-1">
                <p><strong>Foster:</strong> {selected.fosterer.displayName}</p>
                <p><strong>Pet:</strong> {selected.pet.name}</p>
                <p><strong>Started:</strong> {new Date(selected.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Return notes</label>
                <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)} rows={3}
                  placeholder="Condition on return, any notes..." className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setShowEndModal(false); setSelected(null); }}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button onClick={handleEnd} disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Confirm End'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
