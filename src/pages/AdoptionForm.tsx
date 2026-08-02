import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Send, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Badge, Card, PageHeader } from '../components/ui/SharedUI';
import { ErrorState, LoadingState } from '../components/ui/StateDisplays';
import AdoptionFormComponent from '../components/adoption/AdoptionForm';

// Matches constants/applicationStageGraph.js on the backend — kept in sync
// by hand since this is a small, rarely-changing map; if the backend graph
// changes, update this alongside it.
const STAGE_GRAPH: Record<string, string[]> = {
  submitted: ['document_review', 'rejected'],
  document_review: ['interview', 'rejected'],
  interview: ['home_visit', 'rejected'],
  home_visit: ['risk_assessment', 'rejected'],
  risk_assessment: ['approved', 'rejected'],
  approved: ['adoption_scheduled'],
  adoption_scheduled: ['completed'],
  completed: [],
  rejected: [],
};

const STAGE_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  document_review: 'Document Review',
  interview: 'Interview',
  home_visit: 'Home Visit',
  risk_assessment: 'Risk Assessment',
  approved: 'Approved',
  adoption_scheduled: 'Adoption Scheduled',
  completed: 'Completed',
  rejected: 'Rejected',
};

interface Application {
  _id: string;
  pet: { _id: string; name: string; species: string; breed: string; imageUrl: string; status: string };
  applicant: { _id: string; displayName: string; email: string };
  phone: string;
  address: string;
  experience: string;
  householdSize: number | null;
  isRenting: boolean;
  landlordApproval: boolean;
  type: 'adoption' | 'foster';
  fosterPeriod: string | null;
  status: 'pending' | 'approved' | 'rejected';
  stage: string;
  stageHistory: { stage: string; changedBy?: { displayName: string } | string; changedAt: string; note?: string }[];
  createdAt: string;
}

interface Note {
  _id: string;
  author?: { displayName: string; email: string };
  text: string;
  createdAt: string;
}

export default function AdoptionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreateMode = !id;

  if (isCreateMode) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <PageHeader
          title="Log New Application"
          description="Record a walk-in or phone-in adoption/foster application on an adopter's behalf."
        />
        <Card>
          <AdoptionFormComponent
            onSuccess={(application) => navigate(`/adoptions/${application._id}`)}
            onCancel={() => navigate('/adoptions')}
          />
        </Card>
      </div>
    );
  }

  return <ApplicationReview id={id} />;
}

function ApplicationReview({ id }: { id: string }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [vetting, setVetting] = useState<{ cleared: boolean; missing: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appRes, notesRes, vettingRes] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get(`/applications/${id}/notes`),
        api.get(`/applications/${id}/vetting-status`),
      ]);
      setApplication(appRes.data);
      setNotes(notesRes.data.notes || []);
      setVetting(vettingRes.data);
    } catch (err) {
      console.error('Failed to load application:', err);
      setError('Unable to load this application.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAdvanceStage = async (nextStage: string) => {
    setBusy(true);
    try {
      await api.put(`/applications/${id}/stage`, { stage: nextStage });
      addToast('success', `Stage moved to "${STAGE_LABEL[nextStage] || nextStage}".`);
      load();
    } catch (err: any) {
      addToast('error', err?.response?.data?.message || 'Could not update the stage.');
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async (status: 'approved' | 'rejected') => {
    setBusy(true);
    try {
      const res = await api.put(`/applications/${id}/status`, { status });
      addToast('success', res.data.message || `Application ${status}.`);
      load();
    } catch (err: any) {
      addToast('error', err?.response?.data?.message || 'Could not update the application.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setBusy(true);
    try {
      const res = await api.post(`/applications/${id}/notes`, { text: newNote.trim() });
      setNotes(res.data.notes || []);
      setNewNote('');
    } catch (err) {
      console.error('Failed to add note:', err);
      addToast('error', 'Could not add the note.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-8"><LoadingState message="Loading application..." /></div>;
  if (error || !application) return <div className="p-8"><ErrorState message={error || 'Not found'} onRetry={load} /></div>;

  const validNextStages = application.status === 'pending' ? (STAGE_GRAPH[application.stage] || []) : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <button
        onClick={() => navigate('/adoptions')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={15} /> Back to Adoptions
      </button>

      <PageHeader
        title={`${application.type === 'foster' ? 'Foster' : 'Adoption'} Application`}
        description={`Submitted ${new Date(application.createdAt).toLocaleDateString()}`}
        action={
          <div className="flex gap-2">
            <Badge variant={application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'danger' : 'warning'}>
              {application.status}
            </Badge>
            <Badge variant="default">{STAGE_LABEL[application.stage] || application.stage}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="font-bold text-slate-800 mb-4">Applicant &amp; Pet</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-xs">Applicant</p>
                <p className="font-bold text-slate-800">{application.applicant.displayName}</p>
                <p className="text-slate-500">{application.applicant.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-xs">Pet</p>
                <div className="flex items-center gap-2 mt-1">
                  <img src={application.pet.imageUrl} alt={application.pet.name} className="w-8 h-8 rounded-lg object-cover" />
                  <p className="font-bold text-slate-800">{application.pet.name}</p>
                </div>
              </div>
              <div><p className="text-slate-400 font-semibold uppercase text-xs">Phone</p><p className="text-slate-700">{application.phone}</p></div>
              <div><p className="text-slate-400 font-semibold uppercase text-xs">Address</p><p className="text-slate-700">{application.address}</p></div>
              <div><p className="text-slate-400 font-semibold uppercase text-xs">Household Size</p><p className="text-slate-700">{application.householdSize ?? '\u2014'}</p></div>
              <div><p className="text-slate-400 font-semibold uppercase text-xs">Renting</p><p className="text-slate-700">{application.isRenting ? `Yes${application.landlordApproval ? ' (landlord approved)' : ' (landlord approval pending)'}` : 'No'}</p></div>
              {application.type === 'foster' && (
                <div><p className="text-slate-400 font-semibold uppercase text-xs">Foster Period</p><p className="text-slate-700">{application.fosterPeriod || '\u2014'}</p></div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-slate-400 font-semibold uppercase text-xs">Pet-care Experience</p>
              <p className="text-slate-700 text-sm mt-1">{application.experience}</p>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-800 mb-4">Stage History</h3>
            <ul className="space-y-3">
              {[...application.stageHistory].reverse().map((entry, i) => (
                <li key={i} className="border-l-2 border-emerald-200 pl-4">
                  <p className="text-sm font-bold text-slate-800">{STAGE_LABEL[entry.stage] || entry.stage}</p>
                  <p className="text-xs text-slate-500">
                    {typeof entry.changedBy === 'object' ? entry.changedBy?.displayName : 'Staff'} &middot; {new Date(entry.changedAt).toLocaleString()}
                  </p>
                  {entry.note && <p className="text-sm text-slate-600 mt-1">{entry.note}</p>}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-800 mb-4">Internal Notes</h3>
            <p className="text-xs text-slate-400 mb-3">Visible to staff only — never shown to the applicant.</p>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {notes.length === 0 && <p className="text-sm text-slate-400">No notes yet.</p>}
              {notes.map((note) => (
                <div key={note._id} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-sm text-slate-700">{note.text}</p>
                  <p className="text-xs text-slate-400 mt-1">{note.author?.displayName || 'Staff'} &middot; {new Date(note.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add an internal note..."
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button onClick={handleAddNote} disabled={busy || !newNote.trim()} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl font-semibold text-sm disabled:opacity-40">
                <Send size={15} />
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {application.status === 'pending' && (
            <Card>
              <h3 className="font-bold text-slate-800 mb-3">Advance Stage</h3>
              {validNextStages.length === 0 ? (
                <p className="text-sm text-slate-400">No further stage moves from here.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {validNextStages.map((stage) => (
                    <button
                      key={stage}
                      disabled={busy}
                      onClick={() => handleAdvanceStage(stage)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 ${
                        stage === 'rejected'
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Move to {STAGE_LABEL[stage] || stage}
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 mt-4 pt-4">
                <h4 className="font-bold text-slate-800 text-sm mb-2">Final Decision</h4>
                {vetting && !vetting.cleared && (
                  <p className="text-xs font-semibold text-amber-600 mb-2">
                    Needs: {vetting.missing.join(', ')} before this can be approved.
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    disabled={busy || (vetting ? !vetting.cleared : false)}
                    onClick={() => handleDecision('approved')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                  >
                    <Check size={15} /> Approve
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => handleDecision('rejected')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 disabled:opacity-40 transition-colors"
                  >
                    <X size={15} /> Reject
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
