import { useEffect, useMemo, useState } from 'react';
<<<<<<< HEAD
import { Building2, PlusCircle, MapPin, Phone, Mail, Users2, Trash2, Edit3, Search } from 'lucide-react';
=======
import { Building2, PlusCircle, MapPin, Phone, Mail, Users2, Trash2, Edit3 } from 'lucide-react';
>>>>>>> 2b7d60c76aec6bd7c3f978897f9be8111398c9cb
import { Badge, Card, PageHeader, SectionHeader, StatCard, Toolbar } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

type ShelterType = 'main_shelter' | 'foster_hub' | 'clinic' | 'satellite';
type ShelterStatus = 'active' | 'at_capacity' | 'under_maintenance' | 'inactive';

interface Shelter {
  _id: string;
  name: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  capacity: number;
  currentOccupancy: number;
  type: ShelterType;
  status: ShelterStatus;
  operatingHours?: string;
  notes?: string;
}

interface Summary {
  totalShelters: number;
  totalCapacity: number;
  totalOccupancy: number;
  utilizationRate: number;
  atCapacity: number;
}

const STATUS_VARIANT: Record<ShelterStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success', at_capacity: 'warning', under_maintenance: 'default', inactive: 'danger',
};

const emptyForm = {
  name: '', address: '', contactPerson: '', contactPhone: '', contactEmail: '',
  capacity: 10, type: 'main_shelter' as ShelterType, operatingHours: '', notes: '',
};

export default function ShelterManagement() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Shelter | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

<<<<<<< HEAD
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ShelterType | 'all'>('all');

  const filteredShelters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return shelters.filter(s => {
      const matchesTerm = !term
        || s.name.toLowerCase().includes(term)
        || s.address.toLowerCase().includes(term)
        || (s.contactPerson || '').toLowerCase().includes(term);
      const matchesType = typeFilter === 'all' || s.type === typeFilter;
      return matchesTerm && matchesType;
    });
  }, [shelters, searchTerm, typeFilter]);

=======
>>>>>>> 2b7d60c76aec6bd7c3f978897f9be8111398c9cb
  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [sRes, sumRes] = await Promise.all([api.get('/shelters'), api.get('/shelters/summary')]);
      setShelters(sRes.data || []);
      setSummary(sumRes.data);
    } catch {
      setError('Could not load shelters.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (s: Shelter) => {
    setEditing(s);
    setForm({
      name: s.name, address: s.address, contactPerson: s.contactPerson || '', contactPhone: s.contactPhone || '',
      contactEmail: s.contactEmail || '', capacity: s.capacity, type: s.type, operatingHours: s.operatingHours || '', notes: s.notes || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.address) { addToast('error', 'Name and address are required.'); return; }
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/shelters/${editing._id}`, form);
        addToast('success', 'Shelter updated.');
      } else {
        await api.post('/shelters', form);
        addToast('success', 'Shelter added.');
      }
      setShowForm(false);
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not save shelter.');
    } finally { setSubmitting(false); }
  };

  const handleOccupancyChange = async (s: Shelter, occupancy: number) => {
    try {
      await api.put(`/shelters/${s._id}`, { currentOccupancy: Math.max(0, occupancy) });
      fetchData();
    } catch (e: any) {
      addToast('error', 'Could not update occupancy.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shelter/facility?')) return;
    try {
      await api.delete(`/shelters/${id}`);
      addToast('success', 'Shelter deleted.');
      fetchData();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not delete shelter.');
    }
  };

  const typeLabel = (t: ShelterType) => ({ main_shelter: 'Main Shelter', foster_hub: 'Foster Hub', clinic: 'Clinic', satellite: 'Satellite' }[t]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Shelter Management"
        description="Manage physical facilities, capacity, and occupancy across all your sites."
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            <PlusCircle size={16} /> Add Facility
          </button>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Building2 size={22} />} label="Facilities" value={summary.totalShelters} tone="slate" />
          <StatCard icon={<Users2 size={22} />} label="Total Occupancy" value={summary.totalOccupancy} tone="blue" />
          <StatCard icon={<Users2 size={22} />} label="Total Capacity" value={summary.totalCapacity} tone="emerald" />
          <StatCard icon={<Building2 size={22} />} label="Utilization" value={`${summary.utilizationRate}%`} tone={summary.utilizationRate >= 90 ? 'rose' : 'amber'} />
        </div>
      )}

      {loading && <LoadingState message="Loading shelters..." />}
      {error && <ErrorState message={error} onRetry={fetchData} />}

      {!loading && !error && (
        shelters.length === 0 ? (
          <Card><EmptyState title="No facilities yet" message="Add your first shelter, foster hub, or clinic to start tracking capacity." icon={<Building2 size={28} />} /></Card>
        ) : (
<<<<<<< HEAD
          <Card noPadding className="mb-5">
            <Toolbar>
              <SectionHeader title="Facilities" description={`${filteredShelters.length} of ${shelters.length} shown`} />
              <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search name, address, contact…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as ShelterType | 'all')}
                  className="border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Types</option>
                  <option value="main_shelter">Main Shelter</option>
                  <option value="foster_hub">Foster Hub</option>
                  <option value="clinic">Clinic</option>
                  <option value="satellite">Satellite</option>
                </select>
              </div>
            </Toolbar>

            {filteredShelters.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No facilities match" message="Try a different search term or filter." icon={<Building2 size={28} />} />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5 p-5">
                {filteredShelters.map(s => (
                  <Card key={s._id} className="flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800">{s.name}</h3>
                          <Badge variant={STATUS_VARIANT[s.status]} className="capitalize">{s.status.replace(/_/g, ' ')}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin size={12} />{s.address}</p>
                        <p className="text-xs text-slate-400 mt-1">{typeLabel(s.type)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-emerald-600"><Edit3 size={16} /></button>
                        <button onClick={() => handleDelete(s._id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    {(s.contactPerson || s.contactPhone || s.contactEmail) && (
                      <div className="text-xs text-slate-500 space-y-1">
                        {s.contactPerson && <p>{s.contactPerson}</p>}
                        {s.contactPhone && <p className="flex items-center gap-1.5"><Phone size={11} />{s.contactPhone}</p>}
                        {s.contactEmail && <p className="flex items-center gap-1.5"><Mail size={11} />{s.contactEmail}</p>}
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-600">Occupancy</span>
                        <span className="text-slate-500">{s.currentOccupancy} / {s.capacity}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2.5">
                        <div
                          className={`h-full rounded-full ${s.currentOccupancy / (s.capacity || 1) >= 0.9 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (s.currentOccupancy / (s.capacity || 1)) * 100)}%` }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOccupancyChange(s, s.currentOccupancy - 1)} className="flex-1 text-xs font-semibold border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50">− Occupant</button>
                        <button onClick={() => handleOccupancyChange(s, s.currentOccupancy + 1)} className="flex-1 text-xs font-semibold border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50">+ Occupant</button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
=======
          <div className="grid md:grid-cols-2 gap-5">
            {shelters.map(s => (
              <Card key={s._id} className="flex flex-col gap-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800">{s.name}</h3>
                      <Badge variant={STATUS_VARIANT[s.status]} className="capitalize">{s.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin size={12} />{s.address}</p>
                    <p className="text-xs text-slate-400 mt-1">{typeLabel(s.type)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-emerald-600"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(s._id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                  </div>
                </div>

                {(s.contactPerson || s.contactPhone || s.contactEmail) && (
                  <div className="text-xs text-slate-500 space-y-1">
                    {s.contactPerson && <p>{s.contactPerson}</p>}
                    {s.contactPhone && <p className="flex items-center gap-1.5"><Phone size={11} />{s.contactPhone}</p>}
                    {s.contactEmail && <p className="flex items-center gap-1.5"><Mail size={11} />{s.contactEmail}</p>}
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-600">Occupancy</span>
                    <span className="text-slate-500">{s.currentOccupancy} / {s.capacity}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2.5">
                    <div
                      className={`h-full rounded-full ${s.currentOccupancy / (s.capacity || 1) >= 0.9 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (s.currentOccupancy / (s.capacity || 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOccupancyChange(s, s.currentOccupancy - 1)} className="flex-1 text-xs font-semibold border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50">− Occupant</button>
                    <button onClick={() => handleOccupancyChange(s, s.currentOccupancy + 1)} className="flex-1 text-xs font-semibold border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50">+ Occupant</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
>>>>>>> 2b7d60c76aec6bd7c3f978897f9be8111398c9cb
        )
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">{editing ? 'Edit Facility' : 'Add Facility'}</h3>
            <div className="space-y-3">
              <input placeholder="Facility name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ShelterType })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm">
                  <option value="main_shelter">Main Shelter</option>
                  <option value="foster_hub">Foster Hub</option>
                  <option value="clinic">Clinic</option>
                  <option value="satellite">Satellite</option>
                </select>
                <input type="number" placeholder="Capacity" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              </div>
              <input placeholder="Contact person (optional)" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Contact phone" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
                <input placeholder="Contact email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              </div>
              <input placeholder="Operating hours (optional)" value={form.operatingHours} onChange={e => setForm({ ...form, operatingHours: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm" />
              <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm h-16 resize-none" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={submitting} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Facility'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
