import { useEffect, useState } from 'react';
import {
  CalendarClock, Video, MapPin, CheckCircle2, XCircle, UserX, Plus, MessagesSquare,
} from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard, Toolbar } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

type Tab = 'interviews' | 'homeVisits';
type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';

interface Interview {
  _id: string;
  applicant: { _id: string; displayName: string; email: string };
  pet: { _id: string; name: string };
  application: string;
  scheduledDate: string;
  method: 'in-person' | 'video-call' | 'phone-call';
  location?: string;
  status: ScheduleStatus;
  result?: 'passed' | 'failed';
  notes?: string;
}

interface HomeVisit {
  _id: string;
  applicant: { _id: string; displayName: string; email: string };
  pet: { _id: string; name: string };
  application: string;
  scheduledDate: string;
  address: string;
  status: ScheduleStatus;
  result?: 'passed' | 'failed';
  notes?: string;
}

interface PendingApplication {
  _id: string;
  applicant: { _id: string; displayName: string };
  pet: { _id: string; name: string };
  address?: string;
}

const STATUS_VARIANT: Record<ScheduleStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  scheduled: 'warning', completed: 'success', cancelled: 'danger', 'no-show': 'danger', rescheduled: 'default',
};

export default function AdoptionScheduling() {
  const [tab, setTab] = useState<Tab>('interviews');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [visits, setVisits] = useState<HomeVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Schedule modal
  const [showSchedule, setShowSchedule] = useState(false);
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [appId, setAppId] = useState('');
  const [date, setDate] = useState('');
  const [method, setMethod] = useState<'in-person' | 'video-call' | 'phone-call'>('video-call');
  const [location, setLocation] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Complete modal
  const [completing, setCompleting] = useState<Interview | HomeVisit | null>(null);
  const [result, setResult] = useState<'passed' | 'failed'>('passed');
  const [resultNotes, setResultNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [iRes, vRes] = await Promise.all([
        api.get('/interviews?limit=100'),
        api.get('/home-visits?limit=100'),
      ]);
      setInterviews(iRes.data.interviews || []);
      setVisits(vRes.data.visits || []);
    } catch {
      setError('Could not load the adoption schedule.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openSchedule = async () => {
    setAppId(''); setDate(''); setLocation(''); setMethod('video-call');
    try {
      const res = await api.get('/applications?status=pending&limit=100');
      setApplications(res.data.applications || []);
    } catch {
      setApplications([]);
    }
    setShowSchedule(true);
  };

  const handleSchedule = async () => {
    if (!appId || !date) { addToast('error', 'Pick an application and a date.'); return; }
    setScheduling(true);
    try {
      if (tab === 'interviews') {
        await api.post('/interviews', { applicationId: appId, scheduledDate: date, method, location });
      } else {
        await api.post('/home-visits', { applicationId: appId, scheduledDate: date, address: location });
      }
      addToast('success', `${tab === 'interviews' ? 'Interview' : 'Home visit'} scheduled.`);
      setShowSchedule(false);
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not schedule.');
    } finally { setScheduling(false); }
  };

  const handleComplete = async () => {
    if (!completing) return;
    setSaving(true);
    try {
      const path = tab === 'interviews' ? `/interviews/${completing._id}/complete` : `/home-visits/${completing._id}/complete`;
      const body = tab === 'interviews' ? { result, notes: resultNotes } : { result, notes: resultNotes, report: {} };
      await api.put(path, body);
      addToast('success', `Marked as ${result}.`);
      setCompleting(null);
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not save result.');
    } finally { setSaving(false); }
  };

  const quickAction = async (item: Interview | HomeVisit, action: 'cancel' | 'no-show') => {
    try {
      const base = tab === 'interviews' ? `/interviews/${item._id}` : `/home-visits/${item._id}`;
      if (action === 'cancel') await api.put(`${base}/cancel`, { cancelReason: 'Cancelled by staff' });
      else await api.put(`${base}/no-show`, {});
      addToast('success', 'Updated.');
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not update.');
    }
  };

  const list = tab === 'interviews' ? interviews : visits;
  const scheduledCount = list.filter(i => i.status === 'scheduled').length;
  const completedCount = list.filter(i => i.status === 'completed').length;
  const passedCount = list.filter(i => i.result === 'passed').length;
  const noShowCount = list.filter(i => i.status === 'no-show').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Adoption Scheduling"
        description="Manage adoption interviews and home visits for pending applications."
        action={
          <button
            onClick={openSchedule}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} /> Schedule {tab === 'interviews' ? 'Interview' : 'Home Visit'}
          </button>
        }
      />

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('interviews')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'interviews' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
        >
          Interviews
        </button>
        <button
          onClick={() => setTab('homeVisits')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'homeVisits' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
        >
          Home Visits
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<CalendarClock size={22} />} label="Scheduled" value={scheduledCount.toString()} tone="amber" />
        <StatCard icon={<CheckCircle2 size={22} />}  label="Completed" value={completedCount.toString()} tone="emerald" />
        <StatCard icon={<MessagesSquare size={22} />} label="Passed"    value={passedCount.toString()}    tone="blue" />
        <StatCard icon={<UserX size={22} />}          label="No-shows"  value={noShowCount.toString()}    tone="rose" />
      </div>

      {loading && <LoadingState message="Loading schedule..." />}
      {error && <ErrorState message={error} onRetry={fetchData} />}

      {!loading && !error && (
        <Card noPadding>
<<<<<<< HEAD
          <Toolbar>
=======
          <div className="p-5 border-b border-slate-100 bg-slate-50/60">
>>>>>>> 2b7d60c76aec6bd7c3f978897f9be8111398c9cb
            <SectionHeader
              title={tab === 'interviews' ? 'Interviews' : 'Home Visits'}
              description="Failing an interview or home visit automatically rejects the application and frees the pet."
            />
<<<<<<< HEAD
          </Toolbar>
=======
          </div>
>>>>>>> 2b7d60c76aec6bd7c3f978897f9be8111398c9cb

          {list.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Nothing scheduled" message="Use the Schedule button to book the next step for a pending application." icon={<CalendarClock size={28} />} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pet</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">When</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{tab === 'interviews' ? 'Method' : 'Address'}</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {list.map(item => (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-800">{item.applicant?.displayName}</td>
                      <td className="px-5 py-4 text-slate-600">{item.pet?.name}</td>
                      <td className="px-5 py-4 text-slate-600">{new Date(item.scheduledDate).toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-500 capitalize flex items-center gap-1.5">
                        {tab === 'interviews'
                          ? <><Video size={13} />{(item as Interview).method?.replace('-', ' ')}</>
                          : <><MapPin size={13} />{(item as HomeVisit).address}</>}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={STATUS_VARIANT[item.status]} className="capitalize">{item.status}</Badge>
                        {item.result && <p className="text-[11px] mt-1 font-semibold capitalize text-slate-500">{item.result}</p>}
                      </td>
                      <td className="px-5 py-4">
                        {(item.status === 'scheduled' || item.status === 'rescheduled') ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setCompleting(item); setResult('passed'); setResultNotes(''); }}
                              className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => quickAction(item, 'no-show')}
                              className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              No-show
                            </button>
                            <button
                              onClick={() => quickAction(item, 'cancel')}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-1"
                            >
                              Cancel
                            </button>
                          </div>
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

      {/* Schedule modal */}
      {showSchedule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">
              Schedule {tab === 'interviews' ? 'Interview' : 'Home Visit'}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Application</label>
              <select
                value={appId}
                onChange={e => setAppId(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="">Select a pending application…</option>
                {applications.map(a => (
                  <option key={a._id} value={a._id}>{a.applicant?.displayName} — {a.pet?.name}</option>
                ))}
              </select>
              {applications.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">No pending applications found.</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date &amp; time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {tab === 'interviews' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Method</label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value as any)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="video-call">Video call</option>
                  <option value="phone-call">Phone call</option>
                  <option value="in-person">In-person</option>
                </select>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {tab === 'interviews' ? 'Location / link (optional)' : 'Address'}
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={tab === 'interviews' ? 'Zoom link or shelter office' : "Applicant's home address"}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSchedule(false)}
                className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={scheduling}
                className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {scheduling ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete modal */}
      {completing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-slate-800 mb-0.5">Record Result</h3>
            <p className="text-sm text-slate-500 mb-5">{completing.applicant?.displayName} — {completing.pet?.name}</p>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setResult('passed')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold border-2 transition-colors ${result === 'passed' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
              >
                <CheckCircle2 size={16} /> Passed
              </button>
              <button
                onClick={() => setResult('failed')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold border-2 transition-colors ${result === 'failed' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-500'}`}
              >
                <XCircle size={16} /> Failed
              </button>
            </div>

            {result === 'failed' && (
              <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700">
                Marking this as failed will automatically reject the application and free up the pet.
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
              <textarea
                value={resultNotes}
                onChange={e => setResultNotes(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCompleting(null)}
                className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
