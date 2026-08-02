import { useCallback, useEffect, useState } from 'react';
import {
  Download, Edit, History, Plus, RotateCcw, Search, Trash2, X,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import PetFormModal, { type PetRecord } from '../components/pets/PetFormModal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateDisplays';
import { Badge, Card, PageHeader, Toolbar } from '../components/ui/SharedUI';

interface PetAdminRecord extends PetRecord {
  owner?: { displayName: string; email: string } | null;
  isDeleted?: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface HistoryEntry {
  _id: string;
  action: string;
  actor?: { displayName: string; email: string; role: string } | null;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  Available: 'success',
  Pending: 'warning',
  Adopted: 'info',
  Foster: 'default',
};

const SPECIES_OPTIONS = ['All', 'Dog', 'Cat', 'Other'];
const STATUS_OPTIONS = ['All', 'Available', 'Pending', 'Adopted', 'Foster'];

export default function PetManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isSuperAdmin = user?.role === 'super_admin';

  const [pets, setPets] = useState<PetAdminRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [species, setSpecies] = useState('All');
  const [status, setStatus] = useState('All');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState<{ open: boolean; pet: PetAdminRecord | null }>({ open: false, pet: null });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; pet: PetAdminRecord | null }>({ open: false, pet: null });
  const [confirmPermanent, setConfirmPermanent] = useState<{ open: boolean; pet: PetAdminRecord | null }>({ open: false, pet: null });
  const [historyPanel, setHistoryPanel] = useState<{ open: boolean; pet: PetAdminRecord | null; entries: HistoryEntry[]; loading: boolean }>({
    open: false, pet: null, entries: [], loading: false,
  });
  const [exporting, setExporting] = useState(false);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean> = { page, limit: 20 };
      if (q) params.q = q;
      if (species !== 'All') params.species = species;
      if (status !== 'All') params.status = status;
      if (includeDeleted) params.includeDeleted = true;

      const res = await api.get('/pets/admin', { params });
      setPets(res.data.pets);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch pets:', err);
      setError('Unable to load the pet directory right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, q, species, status, includeDeleted]);

  useEffect(() => {
    const timeout = setTimeout(fetchPets, q ? 350 : 0); // debounce free-text search only
    return () => clearTimeout(timeout);
  }, [fetchPets, q]);

  // Any filter change other than the page itself should reset back to page 1
  useEffect(() => { setPage(1); }, [q, species, status, includeDeleted]);

  const handleSoftDelete = async () => {
    if (!confirmDelete.pet) return;
    try {
      await api.delete(`/pets/${confirmDelete.pet._id}`);
      addToast('success', `${confirmDelete.pet.name} was removed (recoverable via Restore).`);
      fetchPets();
    } catch (err) {
      console.error('Failed to delete pet:', err);
      addToast('error', 'Could not delete the pet. Please try again.');
    } finally {
      setConfirmDelete({ open: false, pet: null });
    }
  };

  const handleRestore = async (pet: PetAdminRecord) => {
    try {
      await api.post(`/pets/${pet._id}/restore`);
      addToast('success', `${pet.name} was restored.`);
      fetchPets();
    } catch (err) {
      console.error('Failed to restore pet:', err);
      addToast('error', 'Could not restore the pet. Please try again.');
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmPermanent.pet) return;
    try {
      await api.delete(`/pets/${confirmPermanent.pet._id}/permanent`);
      addToast('success', `${confirmPermanent.pet.name} was permanently deleted.`);
      fetchPets();
    } catch (err) {
      console.error('Failed to permanently delete pet:', err);
      addToast('error', 'Could not permanently delete the pet.');
    } finally {
      setConfirmPermanent({ open: false, pet: null });
    }
  };

  const handleViewHistory = async (pet: PetAdminRecord) => {
    setHistoryPanel({ open: true, pet, entries: [], loading: true });
    try {
      const res = await api.get(`/pets/${pet._id}/history`);
      setHistoryPanel({ open: true, pet, entries: res.data.logs, loading: false });
    } catch (err) {
      console.error('Failed to fetch history:', err);
      addToast('error', "Could not load this pet's history.");
      setHistoryPanel({ open: false, pet: null, entries: [], loading: false });
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const params: Record<string, string> = { format };
      if (q) params.q = q;
      if (species !== 'All') params.species = species;
      if (status !== 'All') params.status = status;

      const res = await api.get('/pets/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'excel' ? 'xlsx' : format;
      link.setAttribute('download', `pets.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      addToast('error', 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Pet Management"
        description="The full shelter directory — search, sort, restore soft-deleted records, and export."
        action={
          <button
            onClick={() => setFormModal({ open: true, pet: null })}
            className="w-full sm:w-auto bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold inline-flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={20} className="mr-2" />
            Add New Pet
          </button>
        }
      />

      <Card noPadding className="mb-8">
        <Toolbar>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search name, breed, description..."
                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium w-64"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            >
              {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Species' : s}</option>)}
            </select>
            <select
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 px-1 cursor-pointer">
              <input type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} className="rounded accent-emerald-600" />
              Show deleted
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <Download size={15} /> CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <Download size={15} /> Excel
            </button>
          </div>
        </Toolbar>

        <div className="p-5 sm:p-6">
          {error ? (
            <ErrorState message={error} onRetry={fetchPets} />
          ) : loading ? (
            <LoadingState message="Loading the pet directory..." />
          ) : pets.length === 0 ? (
            <EmptyState
              title="No pets match these filters"
              message="Try clearing a filter, or add a new pet to get started."
            />
          ) : (
            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 sm:px-6 py-3">Pet</th>
                    <th className="px-3 py-3">Species / Breed</th>
                    <th className="px-3 py-3">Age / Gender / Size</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Owner</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pets.map((pet) => (
                    <tr key={pet._id} className={pet.isDeleted ? 'bg-rose-50/40' : 'hover:bg-slate-50/70'}>
                      <td className="px-5 sm:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <img src={pet.imageUrl} alt={pet.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">{pet.name}</p>
                            {pet.isDeleted && <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wide">Deleted</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{pet.species} &middot; {pet.breed}</td>
                      <td className="px-3 py-3 text-slate-600">{pet.age} &middot; {pet.gender} &middot; {pet.size || '\u2014'}</td>
                      <td className="px-3 py-3"><Badge variant={STATUS_VARIANT[pet.status] || 'default'}>{pet.status}</Badge></td>
                      <td className="px-3 py-3 text-slate-600">{pet.owner?.displayName || '\u2014'}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleViewHistory(pet)} title="View history" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                            <History size={16} />
                          </button>
                          <button onClick={() => setFormModal({ open: true, pet })} title="Edit pet" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          {pet.isDeleted ? (
                            <button onClick={() => handleRestore(pet)} title="Restore pet" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <RotateCcw size={16} />
                            </button>
                          ) : (
                            <button onClick={() => setConfirmDelete({ open: true, pet })} title="Delete pet" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                          {isSuperAdmin && pet.isDeleted && (
                            <button onClick={() => setConfirmPermanent({ open: true, pet })} title="Permanently delete (super admin)" className="p-2 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg transition-colors">
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-100">
              <p className="text-sm text-slate-500 font-medium">
                Page {pagination.page} of {pagination.pages} &middot; {pagination.total} total
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <PetFormModal
        isOpen={formModal.open}
        pet={formModal.pet}
        onClose={() => setFormModal({ open: false, pet: null })}
        onSuccess={fetchPets}
      />

      <ConfirmModal
        isOpen={confirmDelete.open}
        title="Delete Pet"
        message={`Remove ${confirmDelete.pet?.name} from the active directory? This is recoverable — you can restore it later from "Show deleted".`}
        confirmText="Delete Pet"
        isDestructive
        onConfirm={handleSoftDelete}
        onCancel={() => setConfirmDelete({ open: false, pet: null })}
      />

      <ConfirmModal
        isOpen={confirmPermanent.open}
        title="Permanently Delete Pet"
        message={`This permanently erases ${confirmPermanent.pet?.name}'s record. This cannot be undone, unlike a regular delete.`}
        confirmText="Permanently Delete"
        isDestructive
        onConfirm={handlePermanentDelete}
        onCancel={() => setConfirmPermanent({ open: false, pet: null })}
      />

      {historyPanel.open && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-start gap-4 p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">History &middot; {historyPanel.pet?.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">Every recorded change to this pet's record.</p>
              </div>
              <button
                onClick={() => setHistoryPanel({ open: false, pet: null, entries: [], loading: false })}
                className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-1">
              {historyPanel.loading ? (
                <LoadingState message="Loading history..." />
              ) : historyPanel.entries.length === 0 ? (
                <EmptyState title="No history yet" message="Changes to this pet will appear here." />
              ) : (
                <ul className="space-y-4">
                  {historyPanel.entries.map((entry) => (
                    <li key={entry._id} className="border-l-2 border-emerald-200 pl-4">
                      <p className="text-sm font-bold text-slate-800">{entry.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {entry.actor?.displayName || 'System'} &middot; {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      {entry.newValues && Object.keys(entry.newValues).length > 0 && (
                        <div className="mt-2 text-xs bg-slate-50 rounded-lg p-2.5 font-mono text-slate-600 space-y-1">
                          {Object.entries(entry.newValues).map(([field, value]) => (
                            <div key={field}>
                              <span className="font-bold">{field}:</span> {JSON.stringify(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
