import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Clock, Plus } from 'lucide-react';
import api from '../services/api';

// Interfaces matching your MongoDB Appointment model
interface EnrolledUser {
  _id: string;
  user: string; 
  phone: string;
  emergencyContact: string;
  notes: string;
}

interface Shift {
  _id: string;
  title: string;
  date: string;
  durationHours: number;
  capacity: number;
  status: string;
  enrolledUsers: EnrolledUser[];
}

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await api.get('/appointments');
        setShifts(response.data);
      } catch (error) {
        console.error("Failed to fetch shifts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, []);

  // Format the date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Calculate the end time based on the duration hours
  const formatTime = (dateString: string, duration: number) => {
    const date = new Date(dateString);
    const start = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const endDate = new Date(date.getTime() + duration * 3600000);
    const end = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${start} - ${end}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1B2A49]">Shifts & Volunteers</h1>
          <p className="text-gray-500 mt-1">Manage shelter tasks and volunteer capacity.</p>
        </div>
        <button className="bg-[#2D6A4F] text-white px-5 py-2.5 rounded-xl font-bold flex items-center hover:bg-[#1f4a37] transition-colors shadow-sm">
          <Plus size={20} className="mr-2" />
          Create Shift
        </button>
      </div>

      {/* Shifts List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500 font-medium">Loading shifts from database...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {shifts.map((shift) => (
            <div key={shift._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
              
              {/* Left Side: Shift Details */}
              <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-[#1B2A49]">{shift.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    shift.status === 'Open' ? 'bg-green-100 text-green-700' :
                    shift.status === 'Full' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {shift.status}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon size={18} className="mr-3 text-[#D08C60]" />
                    <span>{formatDate(shift.date)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock size={18} className="mr-3 text-[#D08C60]" />
                    <span>{formatTime(shift.date, shift.durationHours)} ({shift.durationHours} hrs)</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users size={18} className="mr-3 text-[#D08C60]" />
                    <span>{shift.enrolledUsers.length} / {shift.capacity} Volunteers</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Enrolled Volunteers List */}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                  Signed Up ({shift.enrolledUsers.length})
                </h4>
                
                {shift.enrolledUsers.length === 0 ? (
                  <p className="text-gray-400 text-sm italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                    No volunteers signed up yet.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {shift.enrolledUsers.map((user, i) => (
                      <div key={user._id || i} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-[#1B2A49] text-sm">Volunteer ID: {user.user.substring(0, 8)}...</span>
                          <span className="text-xs text-gray-500 font-medium">{user.phone}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1"><span className="font-semibold">Emergency:</span> {user.emergencyContact}</p>
                        {user.notes && (
                          <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Note:</span> {user.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}