import { useEffect, useState } from 'react';
import { FileText, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard, Toolbar } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

type DocStatus = 'pending' | 'verified' | 'rejected';

interface UserDoc {
  _id: string;
  type: string;
  label: string;
  fileUrl: string;
  fileType?: string;
  status: DocStatus;
  rejectedReason?: string;
  user: { _id: string; displayName: string; email: string };
  application?: { _id: string; status: string } | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  government_id: 'Government ID',
  proof_of_address: 'Proof of Address',
  proof_of_income: 'Proof of Income',
  house_photo: 'House Photo',
  pet_owner_agreement: 'Pet Owner Agreement',
  other: 'Other',
};

export default function DocumentReview() {
  const [docs, setDocs] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | DocStatus>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [selected, setSelected] = useState<UserDoc | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchDocs = async () => {
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await api.get(`/documents?${params.toString()}`);
      setDocs(res.data.documents || []);
    } catch {
      setError('Could not load documents.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, [statusFilter, typeFilter]);

  const verify = async (doc: UserDoc) => {
    setSubmitting(true);
    try {
      await api.put(`/documents/${doc._id}/verify`, { status: 'verified' });
      addToast('success', `${doc.label} verified.`);
      setSelected(null);
      fetchDocs();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not verify document.');
    } finally { setSubmitting(false); }
  };

  const reject = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.put(`/documents/${selected._id}/verify`, { status: 'rejected', rejectedReason: rejectReason });
      addToast('success', `${selected.label} rejected.`);
      setShowReject(false);
      setSelected(null);
      fetchDocs();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not reject document.');
    } finally { setSubmitting(false); }
  };

  const pendingCount = docs.filter(d => d.status === 'pending').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Document Review"
        description="Verify uploaded IDs, proof of address/income, house photos, and signed agreements."
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Clock size={22} />}       label="Pending"  value={docs.filter(d => d.status === 'pending').length.toString()}  tone="amber" />
        <StatCard icon={<CheckCircle2 size={22} />} label="Verified" value={docs.filter(d => d.status === 'verified').length.toString()} tone="emerald" />
        <StatCard icon={<XCircle size={22} />}      label="Rejected" value={docs.filter(d => d.status === 'rejected').length.toString()} tone="rose" />
      </div>

      {loading && <LoadingState message="Loading documents..." />}
      {error && <ErrorState message={error} onRetry={fetchDocs} />}

      {!loading && !error && (
        <Card noPadding>
          <Toolbar>
            <SectionHeader title={`Documents ${pendingCount > 0 ? `(${pendingCount} awaiting review)` : ''}`} />
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white"
              >
                <option value="all">All types</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {(['pending', 'verified', 'rejected', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    statusFilter === f ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </Toolbar>

          {docs.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No documents" message="Documents uploaded by applicants will show up here for review." icon={<FileText size={28} />} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Document</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {docs.map(d => (
                    <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{d.user?.displayName}</p>
                        <p className="text-xs text-slate-400">{d.user?.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <a href={d.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 font-medium hover:text-emerald-600">
                          <FileText size={14} className="text-slate-400" /> {d.label}
                          <ExternalLink size={12} className="text-slate-400" />
                        </a>
                        <p className="text-xs text-slate-400 mt-0.5">{TYPE_LABELS[d.type] || d.type}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <Badge variant={d.status === 'verified' ? 'success' : d.status === 'rejected' ? 'danger' : 'warning'} className="capitalize">{d.status}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        {d.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => verify(d)}
                              disabled={submitting}
                              className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => { setSelected(d); setRejectReason(''); setShowReject(true); }}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1.5"
                            >
                              Reject
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

      {showReject && selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-slate-800 mb-0.5">Reject Document</h3>
            <p className="text-sm text-slate-500 mb-5">{selected.label} — {selected.user?.displayName}</p>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason (shown to the user)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Photo is blurry, please re-upload a clearer copy."
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReject(false)}
                className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={submitting}
                className="flex-1 bg-rose-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
