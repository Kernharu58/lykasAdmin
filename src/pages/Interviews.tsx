import { useEffect, useState } from 'react';
import {
  Mic, Calendar, MapPin, Video, CheckCircle, XCircle,
  Filter, Plus, User as UserIcon, PawPrint, AlarmClockOff,
} from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/ui/ConfirmModal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateDisplays';
import { Badge, Card, PageHeader, SectionHeader } from '../components/ui/SharedUI';
import { useToast } from '../context/ToastContext';

type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

interface Interview {
  _id: string;
  scheduledDate: string;
  method: string;
  location?: string;
  status: InterviewStatus;
  result?: 'passed' | 'failed' | null;
  notes?: string;
  applicant?: { _id?: string; displayName?: string; email?: string } | null;
  pet?: { _id?: string; name?: string; species?: string } | null;
  application?: { _id?: string; status?: string } | null;
}

interface PendingApplication {
  _id: string;
  applicant?: { displayName?: string; email?: string } | null;
  pet?: { name?: string } | null;
}

const STATUS_TABS: { label: string; value: InterviewStatus | 'all' }[] = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No-show', value: 'no-show' },
  { label: 'All', value: 'all' },
];

function statusVariant(status: InterviewStatus): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'completed') return 'success';
  if (status === 'scheduled') return 'warning';
  if (status === 'no-show') return 'default';
  return 'danger';
}

export default function Interviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [activeTab, setActiveTab] = useState<InterviewStatus | 'all'>('scheduled');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Schedule modal
  const [showSchedule, setShowSchedule] = useState(false);
  const [pendingApps, setPendingApps] = useState<PendingApplication[]>([]);
  const [form, setForm] = useState({ applicationId: '', scheduledDate: '', method: 'in-person', location: '' });
  const [scheduling, setScheduling] = useState(false);

  // Complete modal
  const [completeTarget, setCompleteTarget] = useState<Interview | null>(null);
  const [completeResult, setCompleteResult] = useState<'passed' | 'failed'>('passed');
  const [completeNotes, setCompleteNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean; type: 'cancel' | 'no-show' | ''; id: string }>({
    isOpen: false, type: '', id: '',
  });

  const fetchInterviews = async (status: InterviewStatus | 'all' = activeTab) => {
    try {
      setLoading(true);
      setError(null);
      const url = status === 'all' ? '/interviews' : `/interviews?status=${status}`;
      const res = await api.get(url);
      setInterviews(res.data.interviews || res.data);
    } catch (e) {
      console.error(e);
      setError('Unable to load interviews right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterviews(activeTab); }, [activeTab]);

  const openScheduleModal = async () => {
    setShowSchedule(true);
    try {
      const res = await api.get('/applications?status=pending&limit=100');
      setPendingApps(res.data.applications || res.data);
    } catch {
      setPendingApps([]);
    }
  };

  const submitSchedule = async () => {
    if (!form.applicationId || !form.scheduledDate) {
      addToast('error', 'Select an application and a date first.');
      return;
    }
    setScheduling(true);
    try {
      await api.post('/interviews', form);
      addToast('success', 'Interview scheduled.');
      setShowSchedule(false);
      setForm({ applicationId: '', scheduledDate: '', method: 'in-person', location: '' });
      fetchInterviews(activeTab);
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Failed to schedule interview.');
    } finally {
      setScheduling(false);
    }
  };

  const submitComplete = async () => {
    if (!completeTarget) return;
    setCompleting(true);
    try {
      await api.put(`/interviews/${completeTarget._id}/complete`, {
        result: completeResult,
        notes: completeNotes,
      });
      addToast(completeResult === 'passed' ? 'success' : 'warning', `Interview marked as ${completeResult}.`);
      setCompleteTarget(null);
      setCompleteNotes('');
      fetchInterviews(activeTab);
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Failed to update interview.');
    } finally {
      setCompleting(false);
    }
  };

  const executeConfirm = async () => {
    try {
      if (confirmAction.type === 'cancel') {
        await api.put(`/interviews/${confirmAction.id}/cancel`, {});
        addToast('warning', 'Interview cancelled.');
      } else if (confirmAction.type === 'no-show') {
        await api.put(`/interviews/${confirmAction.id}/no-show`);
        addToast('warning', 'Interview marked as no-show.');
      }
      fetchInterviews(activeTab);
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Action failed.');
    } finally {
      setConfirmAction({ isOpen: false, type: '', id: '' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Adoption Interviews"
        description="Schedule and record interviews — the first vetting stage before a home visit."
        action={
          <button
            onClick={openScheduleModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus size={18} /> Schedule Interview
          </button>
        }
      />

      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center gap-4">
          <SectionHeader title="Interviews" description="Filter by status to review current and historical records." />
          <div className="flex gap-2 flex-wrap">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter size={13} className="inline mr-1.5 -mt-0.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {error ? (
            <ErrorState message={error} onRetry={() => fetchInterviews(activeTab)} />
          ) : loading ? (
            <LoadingState message="Loading interviews..." />
          ) : interviews.length === 0 ? (
            <EmptyState
              title={`No ${activeTab === 'all' ? '' : activeTab} interviews`}
              message="Schedule an interview from here, or from an applicant's card on the Adoptions page."
              icon={<Mic size={28} />}
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {interviews.map((interview) => (
                <div key={interview._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interview</h3>
                      <Badge variant={statusVariant(interview.status)}>
                        {interview.result && interview.status === 'completed'
                          ? interview.result.charAt(0).toUpperCase() + interview.result.slice(1)
                          : interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 font-bold text-lg mb-1">
                      <UserIcon size={16} className="text-emerald-600" />
                      {interview.applicant?.displayName || 'Unknown applicant'}
                    </div>
                    <p className="text-sm text-slate-500 mb-4">{interview.applicant?.email}</p>

                    <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="flex items-center gap-2"><PawPrint size={14} /> {interview.pet?.name || 'Unknown pet'}</p>
                      <p className="flex items-center gap-2"><Calendar size={14} /> {new Date(interview.scheduledDate).toLocaleString()}</p>
                      <p className="flex items-center gap-2">
                        {interview.method === 'video' ? <Video size={14} /> : <MapPin size={14} />}
                        {interview.method} {interview.location ? `· ${interview.location}` : ''}
                      </p>
                      {interview.notes && (
                        <p className="text-slate-400 italic">"{interview.notes}"</p>
                      )}
                    </div>
                  </div>

                  {interview.status === 'scheduled' && (
                    <div className="p-4 bg-slate-50/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                      <button
                        onClick={() => setConfirmAction({ isOpen: true, type: 'no-show', id: interview._id })}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                      >
                        <AlarmClockOff size={16} /> No-show
                      </button>
                      <button
                        onClick={() => setConfirmAction({ isOpen: true, type: 'cancel', id: interview._id })}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-rose-600 font-medium rounded-xl hover:bg-rose-50 transition-colors text-sm"
                      >
                        <XCircle size={16} /> Cancel
                      </button>
                      <button
                        onClick={() => { setCompleteTarget(interview); setCompleteResult('passed'); setCompleteNotes(''); }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors text-sm"
                      >
                        <CheckCircle size={16} /> Record Result
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Schedule Interview</h3>

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Application</label>
              <select
                value={form.applicationId}
                onChange={e => setForm({ ...form, applicationId: e.target.value })}
                className="w-full mb-4 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
              >
                <option value="">Select a pending application...</option>
                {pendingApps.map(app => (
                  <option key={app._id} value={app._id}>
                    {app.applicant?.displayName || 'Unknown'} — {app.pet?.name || 'Unknown pet'}
                  </option>
                ))}
              </select>

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.scheduledDate}
                onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full mb-4 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
              />

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Method</label>
              <select
                value={form.method}
                onChange={e => setForm({ ...form, method: e.target.value })}
                className="w-full mb-4 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
              >
                <option value="in-person">In-person</option>
                <option value="video">Video call</option>
                <option value="phone">Phone call</option>
              </select>

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Location / Link</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="Shelter office, Zoom link, etc."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setShowSchedule(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-xl font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitSchedule}
                disabled={scheduling}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {scheduling ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completeTarget && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Record Interview Result — {completeTarget.applicant?.displayName}
              </h3>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setCompleteResult('passed')}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border ${completeResult === 'passed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  Passed
                </button>
                <button
                  onClick={() => setCompleteResult('failed')}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border ${completeResult === 'failed' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  Failed
                </button>
              </div>

              {completeResult === 'failed' && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4">
                  Marking this as failed will automatically reject the application and notify the applicant.
                </p>
              )}

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Notes</label>
              <textarea
                value={completeNotes}
                onChange={e => setCompleteNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes about the interview..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setCompleteTarget(null)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-xl font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitComplete}
                disabled={completing}
                className={`px-4 py-2.5 text-white rounded-xl font-semibold text-sm disabled:opacity-50 ${completeResult === 'passed' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {completing ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmAction.isOpen}
        title={confirmAction.type === 'cancel' ? 'Cancel Interview' : 'Mark as No-show'}
        message={
          confirmAction.type === 'cancel'
            ? 'This will cancel the scheduled interview and notify the applicant.'
            : 'This will mark the applicant as a no-show for this interview.'
        }
        confirmText={confirmAction.type === 'cancel' ? 'Cancel Interview' : 'Mark No-show'}
        isDestructive
        onConfirm={executeConfirm}
        onCancel={() => setConfirmAction({ isOpen: false, type: '', id: '' })}
      />
    </div>
  );
}
