import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, PlusCircle, Eye } from 'lucide-react';
import api from '../services/api';
import AddShiftModal from '../components/shifts/AddShiftModal';

export default function Shifts() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any | null>(null);

  const fetchShifts = async () => {
    try {
      const response = await api.get('/appointments');
      setShifts(response.data);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  // Stats calculations
  const totalVolunteers = shifts.reduce((acc, shift) => acc + (shift.enrolledUsers?.length || 0), 0);
  const openShifts = shifts.filter(s => s.status === 'Open').length;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Shifts & Volunteers</h1>
          <p className="text-gray-500 mt-1">Manage volunteer schedules and view sign-ups.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <PlusCircle size={20} />
          Create Shift
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Shifts</p>
            <h3 className="text-2xl font-bold text-gray-800">{shifts.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Open Shifts</p>
            <h3 className="text-2xl font-bold text-gray-800">{openShifts}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Volunteers Enrolled</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalVolunteers}</h3>
          </div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-lg text-gray-800">All Scheduled Shifts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">Shift Title</th>
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium">Duration</th>
                <th className="p-4 font-medium">Volunteers</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500">No shifts scheduled. Create one to get started!</td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-medium text-gray-800">{shift.title}</td>
                    <td className="p-4 text-gray-600 text-sm">{new Date(shift.date).toLocaleString()}</td>
                    <td className="p-4 text-gray-600 text-sm">{shift.durationHours} hours</td>
                    <td className="p-4 text-gray-600 text-sm">
                      {shift.enrolledUsers?.length || 0} / {shift.capacity}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        shift.status === 'Open' ? 'bg-emerald-100 text-emerald-700' :
                        shift.status === 'Full' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {shift.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => setSelectedShift(shift)}
                        className="flex items-center gap-1 text-sm text-emerald-600 font-medium hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg"
                      >
                        <Eye size={16} /> View Volunteers
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Volunteers Modal (Inline) */}
      {selectedShift && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Volunteers</h2>
                <p className="text-sm text-gray-500">{selectedShift.title} • {new Date(selectedShift.date).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedShift(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {(!selectedShift.enrolledUsers || selectedShift.enrolledUsers.length === 0) ? (
                <p className="text-center text-gray-500 py-8">No volunteers have signed up for this shift yet.</p>
              ) : (
                <div className="space-y-4">
                  {selectedShift.enrolledUsers.map((enrollment: any, idx: number) => (
                    <div key={idx} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">Volunteer {idx + 1}</h4>
                        <span className="text-xs text-gray-500">Applied: {new Date(enrollment.appliedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Phone:</span> {enrollment.phone || 'N/A'}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Emergency:</span> {enrollment.emergencyContact || 'N/A'}</p>
                      {enrollment.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded border border-gray-200">
                          <span className="font-medium text-gray-700 block mb-1">Notes:</span> 
                          {enrollment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Shift Modal */}
      <AddShiftModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchShifts} 
      />
    </div>
  );
}