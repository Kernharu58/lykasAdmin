import { useEffect, useMemo, useState } from 'react';
<<<<<<< HEAD
import type { JSX } from 'react';
=======
>>>>>>> 2b7d60c76aec6bd7c3f978897f9be8111398c9cb
import { FileText, HelpCircle, PlusCircle, Trash2, Edit3, Megaphone, BookOpen } from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, Toolbar } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

type ContentType = 'faq' | 'policy' | 'page' | 'announcement';

interface ContentItem {
  _id: string;
  type: ContentType;
  title: string;
  body: string;
  category: string;
  order: number;
  isPublished: boolean;
  slug?: string | null;
  version: number;
  updatedAt: string;
}

const TABS: { key: ContentType; label: string; icon: JSX.Element }[] = [
  { key: 'faq', label: 'FAQs', icon: <HelpCircle size={15} /> },
  { key: 'policy', label: 'Policies', icon: <FileText size={15} /> },
  { key: 'page', label: 'Pages', icon: <BookOpen size={15} /> },
  { key: 'announcement', label: 'Announcements', icon: <Megaphone size={15} /> },
];

const emptyForm = { title: '', body: '', category: 'General', order: 0, isPublished: true, slug: '' };

export default function ContentManagement() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentType>('faq');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/content');
      setItems(res.data || []);
    } catch {
      setError('Could not load content.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => items.filter(i => i.type === activeTab).sort((a, b) => a.order - b.order), [items, activeTab]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item: ContentItem) => {
    setEditing(item);
    setForm({ title: item.title, body: item.body, category: item.category, order: item.order, isPublished: item.isPublished, slug: item.slug || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.body) { addToast('error', 'Title and content are required.'); return; }
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/content/${editing._id}`, form);
        addToast('success', 'Content updated.');
      } else {
        await api.post('/content', { ...form, type: activeTab });
        addToast('success', 'Content created.');
      }
      setShowForm(false);
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not save content.');
    } finally { setSubmitting(false); }
  };

  const togglePublish = async (item: ContentItem) => {
    try {
      await api.put(`/content/${item._id}`, { isPublished: !item.isPublished });
      fetchData();
    } catch {
      addToast('error', 'Could not update publish state.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content item?')) return;
    try {
      await api.delete(`/content/${id}`);
      addToast('success', 'Content deleted.');
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not delete content.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Content Management"
        description="Manage FAQs, policies, static pages, and announcements shown in the mobile app."
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            <PlusCircle size={16} /> Add {TABS.find(t => t.key === activeTab)?.label.replace(/s$/, '')}
          </button>
        }
      />

      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === t.key ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && <LoadingState message="Loading content..." />}
      {error && <ErrorState message={error} onRetry={fetchData} />}

      {!loading && !error && (
        <Card noPadding>
          <Toolbar>
            <SectionHeader title={TABS.find(t => t.key === activeTab)?.label || ''} description={`${filtered.length} item(s)`} />
          </Toolbar>

          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Nothing here yet" message="Create your first item for this section." icon={<FileText size={28} />} />
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(item => (
                <div key={item._id} className="p-5 flex justify-between items-start gap-4 hover:bg-slate-50/60">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{item.title}</h3>
                      <Badge variant={item.isPublished ? 'success' : 'default'}>{item.isPublished ? 'Published' : 'Draft'}</Badge>
                      <Badge variant="info">{item.category}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{item.body}</p>
                    {item.slug && <p className="text-xs text-slate-400 mt-1">/{item.slug}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => togglePublish(item)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-100">
                      {item.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-emerald-600"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(item._id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">
              {editing ? 'Edit' : 'New'} {activeTab === 'faq' ? 'FAQ' : TABS.find(t => t.key === activeTab)?.label.replace(/s$/, '')}
            </h3>
            <div className="space-y-3">
              <input
                placeholder={activeTab === 'faq' ? 'Question' : 'Title'}
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm"
              />
              <textarea
                placeholder={activeTab === 'faq' ? 'Answer' : 'Body content'}
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm h-32 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
                <input type="number" placeholder="Display order" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              </div>
              {(activeTab === 'page' || activeTab === 'policy') && (
                <input placeholder="URL slug (optional, auto-generated from title)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              )}
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
                Published (visible in the mobile app)
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={submitting} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
