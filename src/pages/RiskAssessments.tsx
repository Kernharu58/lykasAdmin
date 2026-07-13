import { useEffect, useState } from 'react';
import {
  ShieldAlert, ShieldCheck, ShieldQuestion, Plus, X, Search,
} from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard, Toolbar } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

type RiskLevel = 'Low' | 'Medium' | 'High';
type Recommendation = 'Approve' | 'Reject' | 'Further Review';

interface Assessment {
  _id: string;
  applicant: { _id: string; displayName: string; email: string; profilePicture?: string };
  pet: { _id: string; name: string; species?: string; breed?: string };
  application: { _id: string; status: string; createdAt: string };
  assessedBy: { _id: string; displayName: string; email: string };
  scores: {
    housingStability: number;
    financialReadiness: number;
    petExperience: number;
    lifestyleMatch: number;
    familyCommitment: number;
    knowledgeOfPet: number;
  };
  totalScore: number;
  riskLevel: RiskLevel;
  notes?: string;
  redFlags: string[];
  recommendation: Recommendation;
  createdAt: string;
}

interface PendingApplication {
  _id: string;
  applicant: { _id: string; displayName: string };
  pet: { _id: string; name: string };
}

const CRITERIA: { key: keyof Assessment['scores']; label: string; hint: string }[] = [
  { key: 'housingStability', label: 'Housing Stability', hint: 'Owns / stable rental situation' },
  { key: 'financialReadiness', label: 'Financial Readiness', hint: 'Income / funds for vet care' },
  { key: 'petExperience', label: 'Pet Experience', hint: 'Prior pet ownership history' },
  { key: 'lifestyleMatch', label: 'Lifestyle Match', hint: 'Activity level fits the pet' },
  { key: 'familyCommitment', label: 'Family Commitment', hint: 'All household members on board' },
  { key: 'knowledgeOfPet', label: 'Knowledge of Pet', hint: 'Understands species/breed needs' },
];

const emptyScores = {
  housingStability: 3, financialReadiness: 3, petExperience: 3,
  lifestyleMatch: 3, familyCommitment: 3, knowledgeOfPet: 3,
};

function riskVariant(level: string): 'success' | 'warning' | 'danger' | 'default' {
  if (level === 'Low') return 'success';
  if (level === 'Medium') return 'warning';
  if (level === 'High') return 'danger';
  return 'default';
}

function recVariant(rec: string): 'success' | 'warning' | 'danger' | 'default' {
  if (rec === 'Approve') return 'success';
  if (rec === 'Further Review') return 'warning';
  if (rec === 'Reject') return 'danger';
  return 'default';
}

export default function RiskAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToast } = useToast();
  const LIMIT = 20;

  // Create/edit modal
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [appId, setAppId] = useState('');
  const [scores, setScores] = useState({ ...emptyScores });
  const [notes, setNotes] = useState('');
  const [redFlagsText, setRedFlagsText] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation>('Further Review');
  const [saving, setSaving] = useState(false);

  const fetchAssessments = async (p = 1) => {
    try {
      setLoading(true); setError(null);
      const url = riskFilter !== 'all'
        ? `/risk-assessments?riskLevel=${riskFilter}&page=${p}&limit=${LIMIT}`
        : `/risk-assessments?page=${p}&limit=${LIMIT}`;
      const res = await api.get(url);
      setAssessments(res.data.assessments || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setPage(p);
    } catch {
      setError('Could not load risk assessments.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAssessments(1); }, [riskFilter]);

  const totalScoreToLevel = (s: typeof emptyScores) => {
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    if (total >= 24) return 'Low';
    if (total >= 15) return 'Medium';
    return 'High';
  };

  const openCreate = async () => {
    setEditing(null);
    setAppId(''); setScores({ ...emptyScores }); setNotes('');
    setRedFlagsText(''); setRecommendation('Further Review');
    try {
      const res = await api.get('/applications?status=pending&limit=100');
      setApplications(res.data.applications || []);
    } catch {
      setApplications([]);
    }
    setShowForm(true);
  };

  const openEdit = (a: Assessment) => {
    setEditing(a);
    setScores({ ...a.scores });
    setNotes(a.notes || '');
    setRedFlagsText((a.redFlags || []).join(', '));
    setRecommendation(a.recommendation);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editing && !appId) { addToast('error', 'Select an application to assess.'); return; }
    setSaving(true);
    const redFlags = redFlagsText.split(',').map(s => s.trim()).filter(Boolean);
    try {
      if (editing) {
        await api.put(`/risk-assessments/${editing._id}`, { scores, notes, redFlags, recommendation });
        addToast('success', 'Risk assessment updated.');
      } else {
        await api.post('/risk-assessments', { applicationId: appId, scores, notes, redFlags, recommendation });
        addToast('success', 'Risk assessment submitted.');
      }
      setShowForm(false);
      fetchAssessments(page);
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not save assessment.');
    } finally { setSaving(false); }
  };

  const filtered = assessments.filter(a =>
    (a.applicant?.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.pet?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const highCount = assessments.filter(a => a.riskLevel === 'High').length;
  const lowCount = assessments.filter(a => a.riskLevel === 'Low').length;
  const furtherReviewCount = assessments.filter(a => a.recommendation === 'Further Review').length;

  const previewLevel = totalScoreToLevel(scores);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Risk Assessments"
        description="Score applicants against adoption-readiness criteria and decide whether their adoption should proceed."
        action={
          <button
            onClick={openCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} /> New Assessment
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<ShieldCheck size={24} />} label="Low Risk" value={lowCount.toString()} tone="emerald" />
        <StatCard icon={<ShieldQuestion size={24} />} label="Further Review" value={furtherReviewCount.toString()} tone="amber" />
        <StatCard icon={<ShieldAlert size={24} />} label="High Risk" value={highCount.toString()} tone="slate" />
      </div>

      <Card noPadding>
        <Toolbar>
          <SectionHeader title="Assessments" description="One assessment per adoption application." />
          <div className="flex gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text" placeholder="Search applicant or pet..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value as RiskLevel | 'all')}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </Toolbar>

        {loading ? <div className="p-6"><LoadingState message="Loading risk assessments..." /></div>
          : error ? <div className="p-6"><ErrorState message={error} onRetry={() => fetchAssessments(page)} /></div>
          : filtered.length === 0 ? <div className="p-6"><EmptyState title="No assessments found" message="Assessments you submit for applicants will appear here." /></div>
          : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead className="text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-4">Applicant</th>
                    <th className="p-4">Pet</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Risk Level</th>
                    <th className="p-4">Recommendation</th>
                    <th className="p-4">Assessed By</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{a.applicant?.displayName}</td>
                      <td className="p-4 text-sm text-slate-600">{a.pet?.name}</td>
                      <td className="p-4 text-sm text-slate-700">{a.totalScore} / 30</td>
                      <td className="p-4"><Badge variant={riskVariant(a.riskLevel)}>{a.riskLevel}</Badge></td>
                      <td className="p-4"><Badge variant={recVariant(a.recommendation)}>{a.recommendation}</Badge></td>
                      <td className="p-4 text-sm text-slate-500">{a.assessedBy?.displayName || '—'}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openEdit(a)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Review / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 flex justify-between items-center border-t border-slate-100 text-sm">
                <span className="text-slate-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => fetchAssessments(page - 1)}
                    className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium">Previous</button>
                  <button disabled={page >= totalPages} onClick={() => fetchAssessments(page + 1)}
                    className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create / edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-extrabold text-slate-800">
                {editing ? 'Review Risk Assessment' : 'New Risk Assessment'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {editing ? (
              <p className="text-sm text-slate-500 mb-5">{editing.applicant?.displayName} — {editing.pet?.name}</p>
            ) : (
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
                  <p className="text-xs text-slate-400 mt-1">No pending applications available to assess.</p>
                )}
              </div>
            )}

            <div className="mb-4 space-y-3">
              {CRITERIA.map(c => (
                <div key={c.key}>
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm font-semibold text-slate-700">{c.label}</label>
                    <span className="text-sm font-bold text-emerald-600">{scores[c.key]} / 5</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">{c.hint}</p>
                  <input
                    type="range" min={1} max={5} step={1}
                    value={scores[c.key]}
                    onChange={e => setScores(s => ({ ...s, [c.key]: Number(e.target.value) }))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-sm font-semibold text-slate-700">Projected risk level</span>
              <Badge variant={riskVariant(previewLevel)}>{previewLevel}</Badge>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Recommendation</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Approve', 'Further Review', 'Reject'] as Recommendation[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRecommendation(r)}
                    className={`rounded-xl py-2 text-xs font-bold border-2 transition-colors ${recommendation === r ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Red flags (comma separated, optional)</label>
              <input
                type="text"
                value={redFlagsText}
                onChange={e => setRedFlagsText(e.target.value)}
                placeholder="e.g. inconsistent income, no vet on file"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Submit Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
