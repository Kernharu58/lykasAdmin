import { useEffect, useState } from 'react';
import {
  Home, Calendar, MapPin, CheckCircle, XCircle,
  Filter, Plus, User as UserIcon, PawPrint, AlarmClockOff,
} from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/ui/ConfirmModal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateDisplays';
import { Badge, Card, PageHeader, SectionHeader } from '../components/ui/SharedUI';
import { useToast } from '../context/ToastContext';

type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show';

interface HomeVisit {
  _id: string;
  scheduledDate: string;
  address: string;
  status: VisitStatus;
  result?: 'passed' | 'failed' | 'pending';
  notes?: string;
  report?: { livingSpace?: string; safetyCheck?: string; overallImpression?: string };
  applicant?: { _id?: string; displayName?: string; email?: string } | null;
  pet?: { _id?: string; name?: string; species?: string } | null;
  application?: { _id?: string; status?: string } | null;
}

interface PendingApplication {
  _id: string;
  address?: string;
  applicant?: { displayName?: string; email?: string } | null;
  pet?: { name?: string } | null;
}

const STATUS_TABS: { label: string; value: VisitStatus | 'all' }[] = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No-show', value: 'no-show' },
  { label: 'All', value: 'all' },
];

function statusVariant(status: VisitStatus): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'completed') return 'success';
  if (status === 'scheduled' || status === 'rescheduled') return 'warning';
  if (status === 'no-show') return 'default';
  return 'danger';
}

export default function HomeVisits() {
  const [visits, setVisits] = useState<HomeVisit[]>([]);
  const [activeTab, setActiveTab] = useState<VisitStatus | 'all'>('scheduled');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Schedule modal
  const [showSchedule, setShowSchedule] = useState(false);
  const [pendingApps, setPendingApps] = useState<PendingApplication[]>([]);
  const [form, setForm] = useState({ applicationId: '', scheduledDate: '', address: '' });
  const [scheduling, setScheduling] = useState(false);

  // Complete modal
  const [completeTarget, setCompleteTarget] = useState<HomeVisit | null>(null);
  const [completeResult, setCompleteResult] = useState<'passed' | 'failed'>('passed');
  const [report, setReport] = useState({ livingSpace: '', safetyCheck: 'Pass', overallImpression: '' });
  const [completeNotes, setCompleteNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean; type: 'cancel' | 'no-show' | ''; id: string }>({
    isOpen: false, type: '', id: '',
  });

  const fetchVisits = async (status: VisitStatus | 'all' = activeTab) => {
    try {
      setLoading(true);
      setError(null);
      const url = status === 'all' ? '/home-visits' : `/home-visits?status=${status}`;
      const res = await api.get(url);
      setVisits(res.data.visits || res.data);
    } catch (e) {
      console.error(e);
      setError('Unable to load home visits right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVisits(activeTab); }, [activeTab]);

  const openScheduleModal = async () => {
    setShowSchedule(true);
    try {
      const res = await api.get('/applications?status=pending&limit=100');
      setPendingApps(res.data.applications || res.data);
    } catch {
      setPendingApps([]);
    }
  };

  const onSelectApplication = (id: string) => {
    const app = pendingApps.find(a => a._id === id);
    setForm({ ...form, applicationId: id, address: app?.address || form.address });
  };

  const submitSchedule = async () => {
    if (!form.applicationId || !form.scheduledDate) {
      addToast('error', 'Select an application and a date first.');
      return;
    }
    setScheduling(true);
    try {
      await api.post('/home-visits', form);
      addToast('success', 'Home visit scheduled.');
      setShowSchedule(false);
      setForm({ applicationId: '', scheduledDate: '', address: '' });
      fetchVisits(activeTab);
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Failed to schedule home visit.');
    } finally {
      setScheduling(false);
    }
  };

  const submitComplete = async () => {
    if (!completeTarget) return;
    setCompleting(true);
    try {
      await api.put(`/home-visits/${completeTarget._id}/complete`, {
        result: completeResult,
        notes: completeNotes,
        report,
      });
      addToast(completeResult === 'passed' ? 'success' : 'warning', `Home visit marked as ${completeResult}.`);
      setCompleteTarget(null);
      setCompleteNotes('');
      setReport({ livingSpace: '', safetyCheck: 'Pass', overallImpression: '' });
      fetchVisits(activeTab);
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Failed to update home visit.');
    } finally {
      setCompleting(false);
    }
  };

  const executeConfirm = async () => {
    try {
      if (confirmAction.type === 'cancel') {
        await api.put(`/home-visits/${confirmAction.id}/cancel`, {});
        addToast('warning', 'Home visit cancelled.');
      } else if (confirmAction.type === 'no-show') {
        await api.put(`/home-visits/${confirmAction.id}/no-show`);
        addToast('warning', 'Home visit marked as no-show.');
      }
      fetchVisits(activeTab);
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Action failed.');
    } finally {
      setConfirmAction({ isOpen: false, type: '', id: '' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Home Visits"
        description="Schedule and record home visits — the final vetting stage before an application can be approved."
        action={
          <button
            onClick={openScheduleModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus size={18} /> Schedule Home Visit
          </button>
        }
      />

      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center gap-4">
          <SectionHeader title="Home Visits" description="Filter by status to review current and historical records." />
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
            <ErrorState message={error} onRetry={() => fetchVisits(activeTab)} />
          ) : loading ? (
            <LoadingState message="Loading home visits..." />
          ) : visits.length === 0 ? (
            <EmptyState
              title={`No ${activeTab === 'all' ? '' : activeTab} home visits`}
              message="Home visits are usually scheduled after an applicant passes their interview."
              icon={<Home size={28} />}
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {visits.map((visit) => (
                <div key={visit._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Home Visit</h3>
                      <Badge variant={statusVariant(visit.status)}>
                        {visit.result && visit.status === 'completed'
                          ? visit.result.charAt(0).toUpperCase() + visit.result.slice(1)
                          : visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 font-bold text-lg mb-1">
                      <UserIcon size={16} className="text-emerald-600" />
                      {visit.applicant?.displayName || 'Unknown applicant'}
                    </div>
                    <p className="text-sm text-slate-500 mb-4">{visit.applicant?.email}</p>

                    <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="flex items-center gap-2"><PawPrint size={14} /> {visit.pet?.name || 'Unknown pet'}</p>
                      <p className="flex items-center gap-2"><Calendar size={14} /> {new Date(visit.scheduledDate).toLocaleString()}</p>
                      <p className="flex items-center gap-2"><MapPin size={14} /> {visit.address}</p>
                      {visit.report?.overallImpression && (
                        <p className="text-slate-400 italic">"{visit.report.overallImpression}"</p>
                      )}
                    </div>
                  </div>

                  {(visit.status === 'scheduled' || visit.status === 'rescheduled') && (
                    <div className="p-4 bg-slate-50/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                      <button
                        onClick={() => setConfirmAction({ isOpen: true, type: 'no-show', id: visit._id })}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                      >
                        <AlarmClockOff size={16} /> No-show
                      </button>
                      <button
                        onClick={() => setConfirmAction({ isOpen: true, type: 'cancel', id: visit._id })}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-rose-600 font-medium rounded-xl hover:bg-rose-50 transition-colors text-sm"
                      >
                        <XCircle size={16} /> Cancel
                      </button>
                      <button
                        onClick={() => { setCompleteTarget(visit); setCompleteResult('passed'); setCompleteNotes(''); }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors text-sm"
                      >
                        <CheckCircle size={16} /> Submit Report
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
              <h3 className="text-lg font-bold text-slate-900 mb-4">Schedule Home Visit</h3>

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Application</label>
              <select
                value={form.applicationId}
                onChange={e => onSelectApplication(e.target.value)}
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

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Defaults to the applicant's address"
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
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Home Visit Report — {completeTarget.applicant?.displayName}
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

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Living Space</label>
              <input
                type="text"
                value={report.livingSpace}
                onChange={e => setReport({ ...report, livingSpace: e.target.value })}
                placeholder="Describe the home environment..."
                className="w-full mb-4 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
              />

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Safety Check</label>
              <select
                value={report.safetyCheck}
                onChange={e => setReport({ ...report, safetyCheck: e.target.value })}
                className="w-full mb-4 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
              >
                <option value="Pass">Pass</option>
                <option value="Needs Improvement">Needs Improvement</option>
                <option value="Fail">Fail</option>
              </select>

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Overall Impression</label>
              <textarea
                value={report.overallImpression}
                onChange={e => setReport({ ...report, overallImpression: e.target.value })}
                rows={2}
                className="w-full mb-4 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
              />

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Notes</label>
              <textarea
                value={completeNotes}
                onChange={e => setCompleteNotes(e.target.value)}
                rows={2}
                placeholder="Optional additional notes..."
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
                {completing ? 'Saving...' : 'Save Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmAction.isOpen}
        title={confirmAction.type === 'cancel' ? 'Cancel Home Visit' : 'Mark as No-show'}
        message={
          confirmAction.type === 'cancel'
            ? 'This will cancel the scheduled home visit and notify the applicant.'
            : 'This will mark the applicant as a no-show for this home visit.'
        }
        confirmText={confirmAction.type === 'cancel' ? 'Cancel Visit' : 'Mark No-show'}
        isDestructive
        onConfirm={executeConfirm}
        onCancel={() => setConfirmAction({ isOpen: false, type: '', id: '' })}
      />
    </div>
  );
}
