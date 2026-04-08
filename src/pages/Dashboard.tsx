import { useState, useEffect } from 'react';
import { PawPrint, HeartHandshake, Users, Activity } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    availablePets: 0,
    pendingAdoptions: 0,
    activeVolunteers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch both Pets and Appointments simultaneously for speed!
        const [petsResponse, appointmentsResponse] = await Promise.all([
          api.get('/pets'),
          api.get('/appointments')
        ]);

        const allPets = petsResponse.data;
        const allAppointments = appointmentsResponse.data;

        // 2. Calculate Pet Statistics
        const available = allPets.filter((pet: any) => pet.status === 'Available').length;
        const pending = allPets.filter((pet: any) => pet.status === 'Pending').length;

        // 3. Calculate Volunteer Statistics (count total enrolled users in upcoming shifts)
        let volunteersCount = 0;
        const now = new Date();
        allAppointments.forEach((shift: any) => {
          // Only count volunteers for shifts that haven't finished yet
          if (new Date(shift.date) > now && shift.status !== 'Completed') {
            volunteersCount += shift.enrolledUsers.length;
          }
        });

        // 4. Update the UI state
        setStats({
          availablePets: available,
          pendingAdoptions: pending,
          activeVolunteers: volunteersCount,
        });

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
      <div className="p-8 h-full flex flex-col justify-center items-center">
        <Activity className="animate-spin text-[#2D6A4F] mb-4" size={40} />
        <p className="text-gray-500 font-medium">Calculating shelter statistics...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#1B2A49] mb-2">Welcome Back, Staff</h1>
      <p className="text-gray-500 mb-8">Here is a real-time overview of the shelter today.</p>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Stat Card 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <PawPrint size={100} />
          </div>
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mr-4">
            <PawPrint size={24} className="text-[#2D6A4F]" />
          </div>
          <div>
            <h3 className="text-gray-500 font-medium text-sm mb-1">Available Pets</h3>
            <p className="text-3xl font-extrabold text-[#1B2A49]">{stats.availablePets}</p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <HeartHandshake size={100} />
          </div>
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mr-4">
            <HeartHandshake size={24} className="text-[#D08C60]" />
          </div>
          <div>
            <h3 className="text-gray-500 font-medium text-sm mb-1">Pending Adoptions</h3>
            <p className="text-3xl font-extrabold text-[#1B2A49]">{stats.pendingAdoptions}</p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Users size={100} />
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mr-4">
            <Users size={24} className="text-[#1B2A49]" />
          </div>
          <div>
            <h3 className="text-gray-500 font-medium text-sm mb-1">Active Volunteers</h3>
            <p className="text-3xl font-extrabold text-[#1B2A49]">{stats.activeVolunteers}</p>
          </div>
        </div>

      </div>

      {/* System Status */}
      <div className="bg-[#1B2A49] rounded-3xl p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
           <PawPrint size={200} />
        </div>
        <h2 className="text-2xl font-bold mb-2">System Online</h2>
        <p className="text-gray-300 max-w-lg leading-relaxed">
          The CarePaws mobile app is currently connected and routing applications to this dashboard. Remember to monitor the Live Chat for incoming questions from the community!
        </p>
      </div>
    </div>
  );
}