import { AlertTriangle, Ban, FileText, ShieldAlert, UserCheck } from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard } from '../components/ui/SharedUI';

const adopters = [
  { name: 'Maria Santos', email: 'maria@example.com', apps: 3, risk: 18, status: 'Active', flags: ['Valid ID confirmed', 'Stable application history'] },
  { name: 'Ben Tan', email: 'ben@example.com', apps: 2, risk: 82, status: 'Flagged', flags: ['Prior rejection noted', 'Multiple high-demand pet applications'] },
  { name: 'Lea Garcia', email: 'lea@example.com', apps: 1, risk: 44, status: 'Review', flags: ['Address verification pending'] },
];

function riskVariant(risk: number) {
  if (risk >= 70) return 'danger' as const;
  if (risk >= 40) return 'warning' as const;
  return 'success' as const;
}

export default function Adopters() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Adopter Profiles & Risk"
        description="Review adopter history, risk indicators, admin notes, and blacklist decisions."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<UserCheck size={24} />} label="Active Profiles" value="146" tone="emerald" />
        <StatCard icon={<ShieldAlert size={24} />} label="High Risk" value="3" tone="amber" />
        <StatCard icon={<Ban size={24} />} label="Blacklisted" value="1" tone="slate" />
        <StatCard icon={<FileText size={24} />} label="Pending Reviews" value="7" tone="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <Card noPadding>
          <div className="p-5 border-b border-slate-100 bg-slate-50/70">
            <SectionHeader title="Adopter Directory" description="Risk scores combine application history, documents, and staff review signals." />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Applications</th>
                  <th className="p-4">Risk Score</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adopters.map((adopter) => (
                  <tr key={adopter.email} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{adopter.name}</td>
                    <td className="p-4 text-sm text-slate-600">{adopter.email}</td>
                    <td className="p-4 text-slate-700">{adopter.apps}</td>
                    <td className="p-4"><Badge variant={riskVariant(adopter.risk)}>{adopter.risk}/100</Badge></td>
                    <td className="p-4"><Badge variant={adopter.status === 'Flagged' ? 'danger' : adopter.status === 'Review' ? 'warning' : 'success'}>{adopter.status}</Badge></td>
                    <td className="p-4 text-right">
                      <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">View Profile</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-rose-100 p-3 text-rose-700"><AlertTriangle size={22} /></div>
            <div>
              <h2 className="font-extrabold text-slate-900">High-Risk Review</h2>
              <p className="text-sm text-slate-500">Ben Tan requires admin decision logging.</p>
            </div>
          </div>
          <div className="space-y-3">
            {adopters[1].flags.map((flag) => (
              <div key={flag} className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm font-medium text-rose-900">{flag}</div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">Add Note</button>
            <button className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-bold text-white">Blacklist</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
