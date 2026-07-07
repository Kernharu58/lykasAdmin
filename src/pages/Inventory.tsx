import { useEffect, useMemo, useState } from 'react';
import { Package, PlusCircle, AlertTriangle, Boxes, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard, Toolbar } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

type Category = 'food' | 'medical' | 'bedding' | 'cleaning' | 'equipment' | 'office' | 'other';

interface InventoryItem {
  _id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  minThreshold: number;
  location?: string;
  supplier?: string;
  notes?: string;
  lastRestockedAt?: string;
}

interface Summary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  byCategory: Record<string, number>;
}

const CATEGORIES: Category[] = ['food', 'medical', 'bedding', 'cleaning', 'equipment', 'office', 'other'];

const emptyForm = { name: '', category: 'food' as Category, quantity: 0, unit: 'pcs', minThreshold: 5, location: '', supplier: '', notes: '' };

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'restock' | 'usage'>('restock');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [itemsRes, summaryRes] = await Promise.all([
        api.get('/inventory?limit=200'),
        api.get('/inventory/summary'),
      ]);
      setItems(itemsRes.data.items || []);
      setSummary(summaryRes.data);
    } catch {
      setError('Could not load inventory.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => items.filter(i => {
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
    if (showLowStockOnly && i.quantity > i.minThreshold) return false;
    return true;
  }), [items, categoryFilter, showLowStockOnly]);

  const handleCreate = async () => {
    if (!form.name || !form.unit) { addToast('error', 'Name and unit are required.'); return; }
    setSubmitting(true);
    try {
      await api.post('/inventory', form);
      addToast('success', 'Item added to inventory.');
      setShowForm(false);
      setForm(emptyForm);
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not add item.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from inventory?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      addToast('success', 'Item removed.');
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not remove item.');
    }
  };

  const openAdjust = (item: InventoryItem, type: 'restock' | 'usage') => {
    setAdjustItem(item); setAdjustType(type); setAdjustQty(''); setAdjustNote('');
  };

  const handleAdjust = async () => {
    if (!adjustItem || !adjustQty || Number(adjustQty) <= 0) { addToast('error', 'Enter a valid quantity.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/inventory/${adjustItem._id}/adjust`, { type: adjustType, quantity: Number(adjustQty), note: adjustNote });
      addToast('success', 'Stock updated.');
      setAdjustItem(null);
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not update stock.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Inventory"
        description="Track shelter supplies — food, medical, bedding, and equipment stock levels."
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <PlusCircle size={16} /> Add Item
          </button>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard icon={<Boxes size={22} />} label="Total Items" value={summary.totalItems} tone="slate" />
          <StatCard icon={<AlertTriangle size={22} />} label="Low Stock" value={summary.lowStockCount} tone="amber" />
          <StatCard icon={<Package size={22} />} label="Out of Stock" value={summary.outOfStockCount} tone="rose" />
        </div>
      )}

      {loading && <LoadingState message="Loading inventory..." />}
      {error && <ErrorState message={error} onRetry={fetchData} />}

      {!loading && !error && (
        <Card noPadding>
          <Toolbar>
            <SectionHeader title="All Items" description={`${filtered.length} item(s)`} />
            <div className="flex gap-2 flex-wrap items-center">
              <button
                onClick={() => setShowLowStockOnly(v => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  showLowStockOnly ? 'bg-rose-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Low stock only
              </button>
              {(['all', ...CATEGORIES] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    categoryFilter === c ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Toolbar>

          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No items found" message="Add supplies to start tracking shelter inventory." icon={<Package size={28} />} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(i => (
                    <tr key={i._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{i.name}</p>
                        {i.location && <p className="text-xs text-slate-500 mt-0.5">{i.location}</p>}
                      </td>
                      <td className="px-5 py-4"><Badge variant="default" className="capitalize">{i.category}</Badge></td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{i.quantity} {i.unit}</td>
                      <td className="px-5 py-4">
                        {i.quantity === 0
                          ? <Badge variant="danger">Out of stock</Badge>
                          : i.quantity <= i.minThreshold
                            ? <Badge variant="warning">Low stock</Badge>
                            : <Badge variant="success">In stock</Badge>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openAdjust(i, 'restock')} title="Restock" className="text-emerald-600 hover:text-emerald-800">
                            <ArrowUpCircle size={18} />
                          </button>
                          <button onClick={() => openAdjust(i, 'usage')} title="Log usage" className="text-amber-600 hover:text-amber-800">
                            <ArrowDownCircle size={18} />
                          </button>
                          <button onClick={() => handleDelete(i._id)} title="Delete" className="text-rose-500 hover:text-rose-700">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">Add Inventory Item</h3>
            <div className="space-y-3">
              <input placeholder="Item name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Category })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm capitalize">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Unit (kg, pcs...)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Starting quantity" value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
                <input type="number" placeholder="Low-stock threshold" value={form.minThreshold}
                  onChange={e => setForm({ ...form, minThreshold: Number(e.target.value) })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              </div>
              <input placeholder="Storage location (optional)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Supplier (optional)" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreate} disabled={submitting} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Saving…' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {adjustItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-extrabold text-slate-800 mb-1 capitalize">{adjustType} — {adjustItem.name}</h3>
            <p className="text-sm text-slate-500 mb-4">Current: {adjustItem.quantity} {adjustItem.unit}</p>
            <input type="number" placeholder={`Quantity to ${adjustType === 'restock' ? 'add' : 'remove'}`} value={adjustQty}
              onChange={e => setAdjustQty(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm mb-3" />
            <textarea placeholder="Note (optional)" value={adjustNote} onChange={e => setAdjustNote(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm h-16 resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setAdjustItem(null)} className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdjust} disabled={submitting} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
