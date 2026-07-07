import { useEffect, useMemo, useState } from 'react';
import {
  PawPrint, Users, ClipboardList, Wallet, HandHeart, CalendarDays,
  Siren, MessageSquareWarning, Package, Building2, TrendingUp, TrendingDown,
} from 'lucide-react';
import { Card, PageHeader, SectionHeader, StatCard } from '../components/ui/SharedUI';
import { LoadingState, ErrorState } from '../components/ui/StateDisplays';
import api from '../services/api';

interface Overview {
  pets: { total: number; available: number; adopted: number };
  users: { total: number; newThisMonth: number };
  adoptions: { pending: number; approvedThisMonth: number };
  revenue: { thisMonth: number; lastMonth: number; growthPercent: number };
  volunteers: { active: number };
  events: { upcoming: number };
  emergencies: { open: number };
  feedback: { new: number };
  inventory: { lowStock: number };
  shelters: { total: number; totalCapacity: number; totalOccupancy: number; utilizationRate: number };
}

interface TrendPoint { year: number; month: number; count?: number; total?: number }
interface Trends { users: TrendPoint[]; applications: TrendPoint[]; revenue: TrendPoint[] }
interface Breakdown { bySpecies: { label: string; count: number }[]; byStatus: { label: string; count: number }[] }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MiniBarChart({ data, colorClass = 'bg-emerald-500' }: { data: { label: string; value: number }[]; colorClass?: string }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <span className="text-[11px] font-bold text-slate-600">{d.value}</span>
          <div
            className={`w-full rounded-t-md ${colorClass} transition-all`}
            style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
          />
          <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function HorizontalBarList({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">{d.label}</span>
            <span className="text-slate-500">{d.count}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true); setError(null);
      const [o, t, b] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/trends?months=6'),
        api.get('/analytics/pets-breakdown'),
      ]);
      setOverview(o.data);
      setTrends(t.data);
      setBreakdown(b.data);
    } catch {
      setError('Could not load analytics.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const userTrendData = useMemo(() => (trends?.users || []).map(p => ({
    label: MONTH_NAMES[p.month - 1], value: p.count || 0,
  })), [trends]);

  const revenueTrendData = useMemo(() => (trends?.revenue || []).map(p => ({
    label: MONTH_NAMES[p.month - 1], value: Math.round(p.total || 0),
  })), [trends]);

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full"><LoadingState message="Loading analytics..." /></div>;
  if (error || !overview) return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full"><ErrorState message={error || 'No data'} onRetry={fetchAll} /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Analytics Dashboard"
        description="A bird's-eye view of the whole system. For deep-dive exportable breakdowns, see Reports."
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={<PawPrint size={22} />} label="Pets Available" value={overview.pets.available} tone="emerald" />
        <StatCard icon={<Users size={22} />} label="Total Adopters" value={overview.users.total} tone="blue" />
        <StatCard icon={<ClipboardList size={22} />} label="Pending Applications" value={overview.adoptions.pending} tone="amber" />
        <StatCard
          icon={overview.revenue.growthPercent >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
          label="Revenue (this month)"
          value={`₱${overview.revenue.thisMonth.toLocaleString()}`}
          tone={overview.revenue.growthPercent >= 0 ? 'emerald' : 'rose'}
        />
        <StatCard
          icon={<Wallet size={22} />}
          label="Revenue (last month)"
          value={`₱${overview.revenue.lastMonth.toLocaleString()}`}
          tone="slate"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={<HandHeart size={20} />} label="Active Volunteers" value={overview.volunteers.active} tone="purple" />
        <StatCard icon={<CalendarDays size={20} />} label="Upcoming Events" value={overview.events.upcoming} tone="blue" />
        <StatCard icon={<Siren size={20} />} label="Open Emergencies" value={overview.emergencies.open} tone="rose" />
        <StatCard icon={<MessageSquareWarning size={20} />} label="New Feedback" value={overview.feedback.new} tone="amber" />
        <StatCard icon={<Package size={20} />} label="Low Stock Items" value={overview.inventory.lowStock} tone="rose" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <SectionHeader title="New Adopter Signups" description="Last 6 months" />
          <div className="mt-4">
            {userTrendData.every(d => d.value === 0)
              ? <p className="text-sm text-slate-400 text-center py-8">No signups recorded in this range yet.</p>
              : <MiniBarChart data={userTrendData} />}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Revenue Trend (₱)" description="Paid donations & fees, last 6 months" />
          <div className="mt-4">
            {revenueTrendData.every(d => d.value === 0)
              ? <p className="text-sm text-slate-400 text-center py-8">No paid transactions recorded yet.</p>
              : <MiniBarChart data={revenueTrendData} colorClass="bg-blue-500" />}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <SectionHeader title="Pets by Species" />
          <div className="mt-4">
            {breakdown?.bySpecies.length
              ? <HorizontalBarList data={breakdown.bySpecies} />
              : <p className="text-sm text-slate-400 text-center py-8">No pets recorded yet.</p>}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Pets by Status" />
          <div className="mt-4">
            {breakdown?.byStatus.length
              ? <HorizontalBarList data={breakdown.byStatus} />
              : <p className="text-sm text-slate-400 text-center py-8">No pets recorded yet.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Building2 size={20} />
          </div>
          <SectionHeader title="Shelter Capacity Overview" description={`${overview.shelters.total} facilities tracked`} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-extrabold text-slate-800">{overview.shelters.totalOccupancy}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Current Occupancy</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-800">{overview.shelters.totalCapacity}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Total Capacity</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-800">{overview.shelters.utilizationRate}%</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Utilization</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
