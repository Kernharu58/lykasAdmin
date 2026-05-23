import { BarChart3, Download, LineChart, PieChart, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, PageHeader, SectionHeader, StatCard } from '../components/ui/SharedUI';

const bars = [42, 58, 36, 75, 64, 89, 72, 96, 81, 68, 74, 91];
const risks = [
  { label: 'Low', width: '52%', color: 'bg-emerald-600' },
  { label: 'Medium', width: '34%', color: 'bg-amber-500' },
  { label: 'High', width: '14%', color: 'bg-rose-700' },
];

export default function Reports() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Reports & Analytics"
        description="Operational trends for adoptions, adopter vetting, volunteer coverage, and donations."
        action={
          <button className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
            <Download size={18} />
            Export PDF
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<TrendingUp size={24} />} label="Monthly Adoption Rate" value="+12%" tone="emerald" />
        <StatCard icon={<TrendingDown size={24} />} label="Return Rate" value="2.1%" tone="amber" />
        <StatCard icon={<BarChart3 size={24} />} label="Shift Fulfillment" value="87%" tone="blue" />
        <StatCard icon={<PieChart size={24} />} label="Avg. Donation" value="₱480" tone="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <SectionHeader title="Adoption Trend" description="Last 12 months" />
          <div className="mt-6 flex h-64 items-end gap-3 rounded-lg bg-slate-50 p-4">
            {bars.map((height, index) => (
              <div key={index} className="flex-1 rounded-t-md bg-emerald-700/90" style={{ height: `${height}%` }} title={`Month ${index + 1}`} />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Risk Score Distribution" description="Current adopter profile mix" />
          <div className="mt-6 space-y-5">
            {risks.map((risk) => (
              <div key={risk.label}>
                <div className="mb-2 flex justify-between text-sm font-bold text-slate-700">
                  <span>{risk.label} Risk</span>
                  <span>{risk.width}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className={`h-3 rounded-full ${risk.color}`} style={{ width: risk.width }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Volunteer Hours" description="Top contributors this month" />
          <div className="mt-5 space-y-3">
            {['Ana Reyes - 42 hrs', 'Carlo Lim - 37 hrs', 'Nina Cruz - 31 hrs', 'Marco Dela Paz - 28 hrs'].map((item) => (
              <div key={item} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm font-bold text-slate-700">{item}</div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Export Center" description="Generate staff-ready reports." />
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['Adoptions CSV', 'Volunteer Hours', 'Donation Summary', 'Audit Snapshot'].map((item) => (
              <button key={item} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                <LineChart size={16} />
                {item}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
