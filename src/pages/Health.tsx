import { Bell, CalendarCheck, HeartPulse, Syringe } from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard } from '../components/ui/SharedUI';

const records = [
  { pet: 'Emma', adopter: 'Maria Santos', adopted: 'Jan 12, 2026', last: 'May 20, 2026', vaccine: 'Current', followUp: 'Complete' },
  { pet: 'Max', adopter: 'Rico Cruz', adopted: 'Feb 4, 2026', last: 'Apr 2, 2026', vaccine: 'Due Soon', followUp: 'Request Update' },
  { pet: 'Luna', adopter: 'Bea Lopez', adopted: 'Mar 1, 2026', last: 'Mar 8, 2026', vaccine: 'Overdue', followUp: 'Flagged' },
];

export default function Health() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Health & Baby Book"
        description="Monitor post-adoption health timelines, vaccination reminders, and adopter updates."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<HeartPulse size={24} />} label="Adopted Pets Tracked" value="38" tone="emerald" />
        <StatCard icon={<Syringe size={24} />} label="Vaccines Due" value="5" tone="amber" />
        <StatCard icon={<Bell size={24} />} label="Update Requests" value="4" tone="blue" />
        <StatCard icon={<CalendarCheck size={24} />} label="Checks Complete" value="21" tone="slate" />
      </div>

      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <SectionHeader title="Post-Adoption Oversight" description="Staff can request updates or flag records for follow-up." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Pet</th>
                <th className="p-4">Adopter</th>
                <th className="p-4">Adoption Date</th>
                <th className="p-4">Last Update</th>
                <th className="p-4">Vaccinations</th>
                <th className="p-4">Follow-up</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.pet} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{record.pet}</td>
                  <td className="p-4 text-slate-700">{record.adopter}</td>
                  <td className="p-4 text-sm text-slate-600">{record.adopted}</td>
                  <td className="p-4 text-sm text-slate-600">{record.last}</td>
                  <td className="p-4">
                    <Badge variant={record.vaccine === 'Overdue' ? 'danger' : record.vaccine === 'Due Soon' ? 'warning' : 'success'}>
                      {record.vaccine}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{record.followUp}</td>
                  <td className="p-4 text-right">
                    <button className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">Request Update</button>
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
