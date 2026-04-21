import { useState, useEffect } from 'react';
import { PawPrint, HeartHandshake, Users, Activity } from 'lucide-react';
import api from '../services/api';
import { PageHeader, Card } from '../components/ui/SharedUI';

export default function Dashboard() {
  const [stats, setStats] = useState({ availablePets: 0, pendingAdoptions: 0, activeVolunteers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [petsRes, apptsRes] = await Promise.all([api.get('/pets'), api.get('/appointments')]);
        
        const available = petsRes.data.filter((p: any) => p.status === 'Available').length;
        const pending = petsRes.data.filter((p: any) => p.status === 'Pending').length;
        
        const now = new Date();
        const volunteersCount = apptsRes.data.reduce((acc: number, shift: any) => {
          return (new Date(shift.date) > now && shift.status !== 'Completed') 
            ? acc + (shift.enrolledUsers?.length || 0) 
            : acc;
        }, 0);

        setStats({ availablePets: available, pendingAdoptions: pending, activeVolunteers: volunteersCount });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 h-[70vh] flex flex-col justify-center items-center">
        <Activity className="animate-spin text-emerald-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Calculating metrics...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader 
        title="Dashboard Overview" 
        description="Real-time metrics and system status for the shelter." 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card className="flex items-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
            <PawPrint size={100} />
          </div>
          <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mr-5 shrink-0">
            <PawPrint size={24} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Available Pets</h3>
            <p className="text-3xl font-extrabold text-slate-800">{stats.availablePets}</p>
          </div>
        </Card>

        <Card className="flex items-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
            <HeartHandshake size={100} />
          </div>
          <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mr-5 shrink-0">
            <HeartHandshake size={24} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Pending Adoptions</h3>
            <p className="text-3xl font-extrabold text-slate-800">{stats.pendingAdoptions}</p>
          </div>
        </Card>

        <Card className="flex items-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
            <Users size={100} />
          </div>
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mr-5 shrink-0">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Upcoming Volunteers</h3>
            <p className="text-3xl font-extrabold text-slate-800">{stats.activeVolunteers}</p>
          </div>
        </Card>
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
        <div className="absolute right-0 bottom-0 opacity-[0.03] transform translate-x-1/4 translate-y-1/4">
          <PawPrint size={250} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-wider text-sm">System Online</h2>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">Mobile App Connected</h3>
            <p className="text-slate-300 max-w-2xl leading-relaxed text-sm sm:text-base">
              The CarePaws app is actively routing applications and messages to this dashboard. Keep an eye on the Live Chat for incoming community questions!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}