import { Activity, CalendarClock, HeartHandshake, MessageSquare, ShieldCheck, X, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge, Card, PageHeader, SectionHeader, StatCard, Modal, Button } from '../components/ui/SharedUI';

interface Foster {
  id: string;
  foster: string;
  pet: string;
  start: string;
  end: string;
  health: string;
  status: 'Active Trial' | 'Monitoring' | 'Review' | 'Ready';
  days_remaining?: number;
}

const fosters: Foster[] = [
  { id: 'FOS-1004', foster: 'Ana Reyes', pet: 'Milo', start: 'May 18', end: 'Jul 18', health: 'Due in 3 days', status: 'Active Trial', days_remaining: 44 },
  { id: 'FOS-1005', foster: 'Carlo Lim', pet: 'Poppy', start: 'May 22', end: 'Jun 22', health: 'Submitted today', status: 'Monitoring', days_remaining: 17 },
  { id: 'FOS-1006', foster: 'Nina Cruz', pet: 'Koko', start: 'Pending', end: 'Pending', health: 'Not started', status: 'Review', days_remaining: 0 },
  { id: 'FOS-1007', foster: 'Marco Paz', pet: 'Rex', start: 'Apr 1', end: 'Jun 1', health: 'Excellent', status: 'Ready', days_remaining: 0 },
];

export default function Fosters() {
  const [selectedFoster, setSelectedFoster] = useState<Foster | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showNewFosterModal, setShowNewFosterModal] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'conditional' | 'deny' | null>(null);
  const [notes, setNotes] = useState('');

  const handleDecision = (decision: 'approve' | 'conditional' | 'deny') => {
    setDecision(decision);
    // In real app, send to backend
    console.log(`Decision: ${decision} for ${selectedFoster?.id}`);
    setShowDecisionModal(false);
    setNotes('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Foster Management"
        description="Track mandatory trial periods, health updates, and foster-to-adoption decisions."
        action={
          <button onClick={() => setShowNewFosterModal(true)} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800">
            <Plus size={18} />
            New Foster
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<HeartHandshake size={24} />} label="Active Fosters" value={fosters.filter(f => f.status === 'Active Trial').length.toString()} tone="emerald" />
        <StatCard icon={<CalendarClock size={24} />} label="Ending Soon" value={fosters.filter(f => f.days_remaining && f.days_remaining <= 14).length.toString()} tone="amber" />
        <StatCard icon={<Activity size={24} />} label="Health Updates Due" value="1" tone="blue" />
        <StatCard icon={<ShieldCheck size={24} />} label="Ready Decisions" value={fosters.filter(f => f.status === 'Ready').length.toString()} tone="slate" />
      </div>

      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <SectionHeader title="Foster Pipeline" description="Every row keeps the trial period, welfare check, and final decision visible." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-white text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Case</th>
                <th className="p-4">Foster</th>
                <th className="p-4">Pet</th>
                <th className="p-4">Trial Period</th>
                <th className="p-4">Days Left</th>
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
                  <td className="p-4 text-sm text-slate-600">{foster.start === 'Pending' ? 'Pending Setup' : `${foster.start} - ${foster.end}`}</td>
                  <td className="p-4 text-sm font-bold text-slate-700">
                    {foster.days_remaining ? (
                      <span className={foster.days_remaining <= 7 ? 'text-red-600' : foster.days_remaining <= 14 ? 'text-amber-600' : 'text-slate-600'}>
                        {foster.days_remaining}d
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-600">{foster.health}</td>
                  <td className="p-4">
                    <Badge variant={
                      foster.status === 'Ready' ? 'success' : 
                      foster.status === 'Active Trial' ? 'info' :
                      foster.status === 'Monitoring' ? 'warning' :
                      'danger'
                    }>
                      {foster.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {foster.status === 'Ready' && (
                        <button 
                          onClick={() => {
                            setSelectedFoster(foster);
                            setShowDecisionModal(true);
                          }}
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          Decision
                        </button>
                      )}
                      <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1">
                        <MessageSquare size={16} />
                        <span>Chat</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Decision Modal */}
      {showDecisionModal && selectedFoster && (
        <Modal title={`Foster Decision: ${selectedFoster.pet}`} onClose={() => {
          setShowDecisionModal(false);
          setSelectedFoster(null);
          setNotes('');
          setDecision(null);
        }}>
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600"><strong>Foster:</strong> {selectedFoster.foster}</p>
              <p className="text-sm text-slate-600 mt-1"><strong>Pet:</strong> {selectedFoster.pet}</p>
              <p className="text-sm text-slate-600 mt-1"><strong>Trial Period:</strong> {selectedFoster.start} - {selectedFoster.end}</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Decision</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleDecision('approve')}
                  className="p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-sm hover:border-emerald-400 transition-colors"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleDecision('conditional')}
                  className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50 text-amber-700 font-bold text-sm hover:border-amber-400 transition-colors"
                >
                  ⚠ Conditional
                </button>
                <button
                  onClick={() => handleDecision('deny')}
                  className="p-4 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 font-bold text-sm hover:border-red-400 transition-colors"
                >
                  ✕ Deny
                </button>
              </div>
            </div>

            {decision && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Document your decision..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={4}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDecisionModal(false);
                  setSelectedFoster(null);
                  setNotes('');
                  setDecision(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log(`Submitted: ${decision} with notes: ${notes}`);
                  setShowDecisionModal(false);
                  setSelectedFoster(null);
                }}
                disabled={!decision}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Foster Modal */}
      {showNewFosterModal && (
        <Modal title="Start New Foster Program" onClose={() => setShowNewFosterModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Select Pet</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Emma (Available)</option>
                <option>Max (Available)</option>
                <option>Luna (Available)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Select Foster</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Ana Reyes</option>
                <option>Carlo Lim</option>
                <option>Nina Cruz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Trial Duration (days)</label>
              <input type="number" defaultValue={60} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNewFosterModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={() => setShowNewFosterModal(false)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700">Create Foster</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
