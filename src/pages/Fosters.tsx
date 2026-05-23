import { Activity, CalendarClock, HeartHandshake, MessageSquare, ShieldCheck } from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard } from '../components/ui/SharedUI';

const fosters = [
  { id: 'FOS-1004', foster: 'Ana Reyes', pet: 'Milo', start: 'May 18', end: 'Jul 18', health: 'Due in 3 days', status: 'Active Trial' },
  { id: 'FOS-1005', foster: 'Carlo Lim', pet: 'Poppy', start: 'May 22', end: 'Jun 22', health: 'Submitted today', status: 'Monitoring' },
  { id: 'FOS-1006', foster: 'Nina Cruz', pet: 'Koko', start: 'Pending', end: 'Pending', health: 'Not started', status: 'Review' },
];

export default function Fosters() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Foster Management"
        description="Track mandatory trial periods, health updates, and foster-to-adoption decisions."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<HeartHandshake size={24} />} label="Active Fosters" value="2" tone="emerald" />
        <StatCard icon={<CalendarClock size={24} />} label="Ending Soon" value="1" tone="amber" />
        <StatCard icon={<Activity size={24} />} label="Health Updates Due" value="1" tone="blue" />
        <StatCard icon={<ShieldCheck size={24} />} label="Ready Decisions" value="0" tone="slate" />
      </div>

      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <SectionHeader title="Foster Pipeline" description="Every row keeps the trial period, welfare check, and final decision visible." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-white text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Case</th>
                <th className="p-4">Foster</th>
                <th className="p-4">Pet</th>
                <th className="p-4">Trial Period</th>
                <th className="p-4">Health Updates</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fosters.map((foster) => (
                <tr key={foster.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-mono text-sm text-slate-600">{foster.id}</td>
                  <td className="p-4 font-bold text-slate-800">{foster.foster}</td>
                  <td className="p-4 text-slate-700">{foster.pet}</td>
                  <td className="p-4 text-sm text-slate-600">{foster.start} - {foster.end}</td>
                  <td className="p-4 text-sm text-slate-600">{foster.health}</td>
                  <td className="p-4"><Badge variant={foster.status === 'Review' ? 'warning' : 'success'}>{foster.status}</Badge></td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">Decision</button>
                      <button className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700"><MessageSquare size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
