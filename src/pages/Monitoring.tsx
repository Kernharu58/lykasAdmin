import { Heart, AlertTriangle, CheckCircle2, Clock, Download, Search, Plus } from 'lucide-react';
import { useState } from 'react';
import { Card, PageHeader, SectionHeader, StatCard, Badge } from '../components/ui/SharedUI';

interface MonitoringReport {
  id: string;
  petName: string;
  adopter: string;
  lastUpdate: string;
  nextDue: string;
  health: 'good' | 'concern' | 'alert' | 'pending';
  weight: string;
  behavioral: string;
  vaccinations: 'current' | 'due' | 'overdue';
}

const mockReports: MonitoringReport[] = [
  {
    id: 'MON-001',
    petName: 'Emma',
    adopter: 'Maria Santos',
    lastUpdate: 'Jun 3, 2026',
    nextDue: 'Jul 3, 2026',
    health: 'good',
    weight: '12.5 kg (↑0.5 kg)',
    behavioral: 'Adjusting well, playful',
    vaccinations: 'current',
  },
  {
    id: 'MON-002',
    petName: 'Max',
    adopter: 'Rico Cruz',
    lastUpdate: 'May 20, 2026',
    nextDue: 'Jun 20, 2026',
    health: 'concern',
    weight: '28.2 kg (stable)',
    behavioral: 'Anxious - may need training',
    vaccinations: 'due',
  },
  {
    id: 'MON-003',
    petName: 'Luna',
    adopter: 'Bea Lopez',
    lastUpdate: 'May 8, 2026',
    nextDue: 'Jun 8, 2026',
    health: 'alert',
    weight: '8.1 kg (↓0.3 kg)',
    behavioral: 'Lethargy noted',
    vaccinations: 'overdue',
  },
  {
    id: 'MON-004',
    petName: 'Buddy',
    adopter: 'Alex Reyes',
    lastUpdate: 'Jun 5, 2026',
    nextDue: 'Jul 5, 2026',
    health: 'good',
    weight: '35.2 kg (stable)',
    behavioral: 'Happy and healthy',
    vaccinations: 'current',
  },
];

export default function Monitoring() {
  const [reports, setReports] = useState(mockReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHealth, setFilterHealth] = useState<'all' | 'good' | 'concern' | 'alert' | 'pending'>('all');
  const [selectedReport, setSelectedReport] = useState<MonitoringReport | null>(null);

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.adopter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterHealth === 'all' || r.health === filterHealth;
    return matchesSearch && matchesFilter;
  });

  const healthStats = {
    good: reports.filter(r => r.health === 'good').length,
    concern: reports.filter(r => r.health === 'concern').length,
    alert: reports.filter(r => r.health === 'alert').length,
    overdue: reports.filter(r => r.vaccinations === 'overdue').length,
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'success';
      case 'concern': return 'warning';
      case 'alert': return 'danger';
      default: return 'default';
    }
  };

  const getVaccineColor = (vaccine: string) => {
    switch (vaccine) {
      case 'current': return 'success';
      case 'due': return 'warning';
      case 'overdue': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Post-Adoption Monitoring"
        description="Track health, behavior, and welfare of adopted pets. Request updates from adopters."
        action={
          <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800">
            <Download size={18} />
            Export Report
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Heart size={24} />} label="Healthy Pets" value={healthStats.good.toString()} tone="emerald" />
        <StatCard icon={<Clock size={24} />} label="Need Attention" value={healthStats.concern.toString()} tone="amber" />
        <StatCard icon={<AlertTriangle size={24} />} label="Alerts" value={healthStats.alert.toString()} tone="rose" />
        <StatCard icon={<CheckCircle2 size={24} />} label="Vaccine Overdue" value={healthStats.overdue.toString()} tone="slate" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search pet or adopter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'good', 'concern', 'alert', 'pending'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterHealth(status)}
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                filterHealth === status
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-500 font-medium">No monitoring reports found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <Card key={report.id} noPadding className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedReport(report)}>
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Pet Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-slate-800">{report.petName}</h3>
                    <Badge variant={getHealthColor(report.health)}>
                      {report.health.charAt(0).toUpperCase() + report.health.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">Adopted by: {report.adopter}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-600">
                    <span>📏 Weight: {report.weight}</span>
                    <span>🧬 Behavior: {report.behavioral.split(' ')[0]}...</span>
                    <span>💉 Vaccines: <Badge variant={getVaccineColor(report.vaccinations)}>{report.vaccinations}</Badge></span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex flex-col gap-2 text-xs text-slate-600 md:text-right">
                  <span>📅 Last Update: {report.lastUpdate}</span>
                  <span className={report.nextDue ? 'text-amber-600' : ''}>
                    ⏰ Next Due: {report.nextDue}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-sm transition-colors">
                    Request Update
                  </button>
                  <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                    ⋮
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedReport.petName}</h2>
                <p className="text-slate-600">Monitoring Report #{selectedReport.id}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Adopter</p>
                  <p className="text-lg font-bold text-slate-800">{selectedReport.adopter}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Health Status</p>
                  <Badge variant={getHealthColor(selectedReport.health)}>
                    {selectedReport.health}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Last Update</p>
                  <p className="text-sm text-slate-700">{selectedReport.lastUpdate}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Next Check</p>
                  <p className="text-sm text-slate-700">{selectedReport.nextDue}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Weight Progress</p>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-700">{selectedReport.weight}</p>
                  <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Behavioral Notes</p>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-700">{selectedReport.behavioral}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Vaccination Status</p>
                <Badge variant={getVaccineColor(selectedReport.vaccinations)}>
                  {selectedReport.vaccinations.charAt(0).toUpperCase() + selectedReport.vaccinations.slice(1)}
                </Badge>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700">
                  Request Update
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
