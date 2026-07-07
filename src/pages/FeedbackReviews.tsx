import { useEffect, useMemo, useState } from 'react';
import { MessageSquareText, Star, User as UserIcon, PawPrint, CheckCircle2 } from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard, Toolbar } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

type FeedbackType = 'general' | 'complaint' | 'review' | 'suggestion';
type FeedbackStatus = 'new' | 'in_review' | 'responded' | 'resolved' | 'archived';

interface Feedback {
  _id: string;
  type: FeedbackType;
  rating?: number | null;
  subject: string;
  message: string;
  status: FeedbackStatus;
  isPublic: boolean;
  isFeatured: boolean;
  adminResponse?: string;
  submittedBy: { _id: string; displayName: string; email: string };
  relatedPet?: { _id: string; name: string } | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<FeedbackStatus, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
  new: 'danger', in_review: 'warning', responded: 'info', resolved: 'success', archived: 'default',
};

export default function FeedbackReviews() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all');

  const [selected, setSelected] = useState<Feedback | null>(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<FeedbackStatus>('new');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/feedback?limit=100');
      setItems(res.data.items || res.data || []);
    } catch {
      setError('Could not load feedback.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const counts = useMemo(() => ({
    total: items.length,
    new: items.filter(i => i.status === 'new').length,
    complaints: items.filter(i => i.type === 'complaint').length,
    avgRating: (() => {
      const rated = items.filter(i => i.rating);
      return rated.length ? (rated.reduce((s, i) => s + (i.rating || 0), 0) / rated.length).toFixed(1) : '—';
    })(),
  }), [items]);

  const filtered = typeFilter === 'all' ? items : items.filter(i => i.type === typeFilter);

  const openModal = (item: Feedback) => {
    setSelected(item); setResponse(item.adminResponse || ''); setStatus(item.status);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.put(`/feedback/${selected._id}`, { status, adminResponse: response });
      addToast('success', 'Feedback updated.');
      setSelected(null);
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not update feedback.');
    } finally { setSubmitting(false); }
  };

  const toggleFeature = async (item: Feedback) => {
    try {
      await api.put(`/feedback/${item._id}`, { isFeatured: !item.isFeatured });
      fetchData();
    } catch {
      addToast('error', 'Could not update feature state.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Feedback & Reviews"
        description="Respond to adopter feedback, complaints, and success-story reviews."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<MessageSquareText size={22} />} label="Total" value={counts.total} tone="slate" />
        <StatCard icon={<MessageSquareText size={22} />} label="New" value={counts.new} tone="rose" />
        <StatCard icon={<MessageSquareText size={22} />} label="Complaints" value={counts.complaints} tone="amber" />
        <StatCard icon={<Star size={22} />} label="Avg. Rating" value={counts.avgRating} tone="emerald" />
      </div>

      {loading && <LoadingState message="Loading feedback..." />}
      {error && <ErrorState message={error} onRetry={fetchData} />}

      {!loading && !error && (
        <Card noPadding>
          <Toolbar>
            <SectionHeader title="All Feedback" description="Sorted by most recent." />
            <div className="flex gap-2 flex-wrap">
              {(['all', 'general', 'complaint', 'review', 'suggestion'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    typeFilter === f ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </Toolbar>

          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No feedback yet" message="Feedback and reviews submitted by adopters will show up here." icon={<MessageSquareText size={28} />} />
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(item => (
                <div key={item._id} className="p-5 hover:bg-slate-50/60 flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{item.subject}</h3>
                      <Badge variant={STATUS_VARIANT[item.status]} className="capitalize">{item.status.replace('_', ' ')}</Badge>
                      <Badge variant="default" className="capitalize">{item.type}</Badge>
                      {item.rating && (
                        <span className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                          {item.rating} <Star size={12} fill="currentColor" />
                        </span>
                      )}
                      {item.isFeatured && <Badge variant="info">Featured</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-1.5">{item.message}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><UserIcon size={11} />{item.submittedBy?.displayName}</span>
                      {item.relatedPet && <span className="flex items-center gap-1"><PawPrint size={11} />{item.relatedPet.name}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {item.type === 'review' && (
                      <button onClick={() => toggleFeature(item)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-100">
                        {item.isFeatured ? 'Unfeature' : 'Feature'}
                      </button>
                    )}
                    <button onClick={() => openModal(item)} className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg">
                      Respond
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-slate-800 mb-0.5">{selected.subject}</h3>
            <p className="text-xs text-slate-400 mb-3">from {selected.submittedBy?.displayName}</p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 text-sm text-slate-700">{selected.message}</div>

            <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as FeedbackStatus)}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm mb-4">
              <option value="new">New</option>
              <option value="in_review">In Review</option>
              <option value="responded">Responded</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>

            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your response</label>
            <textarea value={response} onChange={e => setResponse(e.target.value)}
              placeholder="Write a reply the adopter will see..."
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm h-24 resize-none mb-5" />

            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={submitting} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? 'Saving…' : <><CheckCircle2 size={15} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
