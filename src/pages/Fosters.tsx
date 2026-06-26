import { Activity, CalendarClock, HeartHandshake, MessageSquare, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
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
  trialDurationDays?: number;
  weeklyReportsRequired?: number;
  weeklyReportsSubmitted?: number;
  outcome?: 'ADOPTED' | 'RETURNED' | 'EXTENDED' | null;
}

function daysLeft(date?: string) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function reportProgress(foster: Foster) {
  if (!foster.weeklyReportsRequired) return null;
  return `${foster.weeklyReportsSubmitted ?? 0}/${foster.weeklyReportsRequired}`;
}

export default function Fosters() {
  const [fosters, setFosters]           = useState<Foster[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [selected, setSelected]         = useState<Foster | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [returnNotes, setReturnNotes]   = useState('');
  const [outcome, setOutcome]           = useState<'ADOPTED' | 'RETURNED' | 'EXTENDED'>('RETURNED');
  const [eligibility, setEligibility]   = useState<{ allowed: boolean; reason?: string } | null>(null);
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

  const checkEligibility = async (foster: Foster) => {
    try {
      const res = await api.get(`/foster/${foster._id}/can-finalize`);
      setEligibility(res.data);
    } catch { setEligibility(null); }
  };

  const handleSelectFoster = async (foster: Foster) => {
    setSelected(foster);
    setOutcome('RETURNED');
    setReturnNotes('');
    setEligibility(null);
    await checkEligibility(foster);
    setShowEndModal(true);
  };

  const handleEnd = async () => {
    if (!selected) return;
    if (outcome === 'ADOPTED' && eligibility && !eligibility.allowed) {
      addToast('error', eligibility.reason || 'Not eligible for adoption yet.');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/foster/${selected._id}/end`, { returnNotes, outcome });
      addToast('success', `Foster for ${selected.pet.name}: ${outcome}`);
      setShowEndModal(false); setSelected(null); setReturnNotes('');
      fetchFosters();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not end placement.');
    } finally { setSubmitting(false); }
  };

  const active      = fosters.filter(f => f.status === 'active');
  const endingSoon  = fosters.filter(f => { const d = daysLeft(f.expectedEndDate); return d !== null && d <= 14 && d >= 0; });
  const reportsOk   = fosters.filter(f => f.weeklyReportsRequired && f.weeklyReportsSubmitted === f.weeklyReportsRequired);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Foster Management"
        description="Track mandatory trial periods, health updates, and foster-to-adoption decisions."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<HeartHandshake size={24} />} label="Active Fosters"    value={active.length.toString()}      tone="emerald" />
        <StatCard icon={<CalendarClock  size={24} />} label="Ending Soon"       value={endingSoon.length.toString()}  tone="amber"   />
        <StatCard icon={<Activity       size={24} />} label="Reports Complete"  value={reportsOk.length.toString()}   tone="sky"     />
        <StatCard icon={<ShieldCheck    size={24} />} label="Total Placements"  value={fosters.length.toString()}     tone="violet"  />
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}

      {!loading && !error && (
        <Card>
          <SectionHeader title="Active Foster Placements" />
          {fosters.length === 0
            ? <EmptyState message="No foster placements found." />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th className="pb-2 pr-4 font-medium">Pet</th>
                      <th className="pb-2 pr-4 font-medium">Fosterer</th>
                      <th className="pb-2 pr-4 font-medium">Trial</th>
                      <th className="pb-2 pr-4 font-medium">Reports</th>
                      <th className="pb-2 pr-4 font-medium">Days Left</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fosters.map(f => {
                      const dl = daysLeft(f.expectedEndDate);
                      const rp = reportProgress(f);
                      const reportsComplete = f.weeklyReportsRequired
                        ? f.weeklyReportsSubmitted === f.weeklyReportsRequired
                        : true;
                      return (
                        <tr key={f._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 pr-4 font-semibold text-gray-800">{f.pet?.name}</td>
                          <td className="py-3 pr-4 text-gray-600">{f.fosterer?.displayName}</td>
                          <td className="py-3 pr-4 text-gray-500">
                            {f.trialDurationDays ? `${f.trialDurationDays}d` : '—'}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`font-medium ${reportsComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {rp || '—'}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {dl !== null
                              ? <span className={dl <= 7 ? 'text-red-600 font-semibold' : 'text-gray-600'}>{dl}d</span>
                              : '—'
                            }
                          </td>
                          <td className="py-3 pr-4">
                            <Badge tone={f.status === 'active' ? 'success' : 'neutral'} label={f.status} />
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleSelectFoster(f)}
                              className="text-xs text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Finalize
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>
      )}

      {/* Finalize Modal */}
      {showEndModal && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Finalize: {selected.pet.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Fosterer: {selected.fosterer.displayName}</p>

            {/* Eligibility banner */}
            {eligibility && (
              <div className={`flex items-start gap-2 rounded-xl p-3 mb-4 ${eligibility.allowed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-100'}`}>
                {eligibility.allowed
                  ? <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                  : <XCircle      size={18} className="text-red-500 mt-0.5 shrink-0" />
                }
                <div>
                  <p className={`text-sm font-medium ${eligibility.allowed ? 'text-emerald-700' : 'text-red-700'}`}>
                    {eligibility.allowed ? 'Eligible for adoption' : 'Not yet eligible'}
                  </p>
                  {!eligibility.allowed && eligibility.reason && (
                    <p className="text-xs text-red-600 mt-0.5">{eligibility.reason}</p>
                  )}
                </div>
              </div>
            )}

            {/* Report progress */}
            {selected.weeklyReportsRequired != null && (
              <div className="mb-4 bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-600">
                  Weekly reports: <span className="font-semibold text-gray-800">
                    {selected.weeklyReportsSubmitted ?? 0} / {selected.weeklyReportsRequired} submitted
                  </span>
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
              <select
                value={outcome}
                onChange={e => setOutcome(e.target.value as any)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="RETURNED">Return to shelter</option>
                <option value="EXTENDED">Extend trial (14 days)</option>
                <option value="ADOPTED">Finalize adoption</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff notes</label>
              <textarea
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)}
                placeholder="Optional notes about this decision…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowEndModal(false); setSelected(null); }}
                className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEnd}
                disabled={submitting || (outcome === 'ADOPTED' && eligibility !== null && !eligibility?.allowed)}
                className="flex-1 bg-emerald-700 text-white rounded-xl py-2 text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
