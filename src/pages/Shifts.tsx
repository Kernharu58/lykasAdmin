import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// 👉 FIX: Imported Pencil for the edit button
import { Calendar, Users, Clock, PlusCircle, Eye, X, User as UserIcon, Mail, Phone, AlertCircle, MessageSquare, Trash2, Pencil } from 'lucide-react';
import api from '../services/api';
import AddShiftModal from '../components/shifts/AddShiftModal';
import EditShiftModal from '../components/shifts/EditShiftModal'; // 👉 Imported the new modal

export default function Shifts() {
  const [shifts, setShifts] = useState<any[]>([]);
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any | null>(null); // For Viewing Volunteers
  
  // 👉 NEW: States for Editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<any | null>(null);
  
  const navigate = useNavigate();

  const fetchShifts = async () => {
    try {
      const response = await api.get('/appointments');
      setShifts(response.data);
      
      if (selectedShift) {
        const updatedShift = response.data.find((s: any) => s._id === selectedShift._id);
        if (updatedShift) setSelectedShift(updatedShift);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleDelete = async (shiftId: string, shiftTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the shift "${shiftTitle}"? This will cancel it for all enrolled volunteers.`)) {
      try {
        await api.delete(`/appointments/${shiftId}`);
        fetchShifts(); 
      } catch (error) {
        console.error("Error deleting shift:", error);
        alert("Failed to delete shift.");
      }
    }
  };

  const openEditModal = (shift: any) => {
    setShiftToEdit(shift);
    setIsEditModalOpen(true);
  };

  const totalVolunteers = shifts.reduce((acc, shift) => acc + (shift.enrolledUsers?.length || 0), 0);
  const openShifts = shifts.filter(s => s.status === 'Open').length;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full relative">
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
                  <tr key={shift._id} key={shift._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-medium text-gray-800">{shift.title}</td>
                    <td className="p-4 text-gray-600 text-sm">{new Date(shift.date).toLocaleString()}</td>
                    <td className="p-4 text-gray-600 text-sm">{shift.durationHours} hours</td>
                    <td className="p-4 text-gray-600 text-sm font-medium">
                      {shift.enrolledUsers?.length || 0} / {shift.capacity}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        shift.status === 'Open' ? 'bg-emerald-100 text-emerald-700' :
                        shift.status === 'Full' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {shift.status}
                      </span>
                    </td>
                    
                    {/* 👉 UPDATED: Action Buttons (View, Edit, Delete) */}
                    <td className="p-4 flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedShift(shift)}
                        className="flex items-center gap-2 text-sm text-emerald-700 font-medium hover:bg-emerald-100 bg-emerald-50 px-4 py-2 rounded-xl transition-colors"
                      >
                        <Eye size={16} /> View
                      </button>
                      
                      {/* 👉 NEW: Edit Button */}
                      <button 
                        onClick={() => openEditModal(shift)}
                        className="flex items-center justify-center p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Shift"
                      >
                        <Pencil size={18} />
                      </button>

                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDelete(shift._id, shift.title)}
                        className="flex items-center justify-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Shift"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Volunteers Modal (Code preserved exactly as it was) */}
      {selectedShift && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Enrolled Volunteers</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {selectedShift.title} • {new Date(selectedShift.date).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setSelectedShift(null)} className="text-gray-400 hover:text-gray-700 bg-gray-50 rounded-full p-2">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
              {(!selectedShift.enrolledUsers || selectedShift.enrolledUsers.length === 0) ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={32} />
                  </div>
                  <p className="text-gray-500 font-medium">No volunteers have signed up yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedShift.enrolledUsers.map((enrollment: any, idx: number) => {
                    const volunteer = enrollment.user || {};
                    return (
                      <div key={idx} className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm flex flex-col md:flex-row gap-6">
                        
                        <div className="md:w-1/3 flex flex-col items-center text-center md:items-start md:text-left border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 pr-0 md:pr-4">
                          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold overflow-hidden border border-emerald-200 mb-3">
                            {volunteer.profilePicture ? (
                              <img src={volunteer.profilePicture} alt={volunteer.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon size={24} />
                            )}
                          </div>
                          <h4 className="font-bold text-gray-800 text-lg">{volunteer.displayName || "Unknown User"}</h4>
                          <p className="text-sm text-gray-500 mt-1 flex items-center justify-center md:justify-start gap-1">
                            <Mail size={14} /> {volunteer.email || "No email"}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Applied: {new Date(enrollment.appliedAt).toLocaleDateString()}
                          </p>
                          
                          <button 
                            onClick={() => navigate('/chat', { state: { selectedUserId: volunteer._id } })}
                            className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 text-emerald-700 font-medium rounded-xl hover:bg-emerald-100 transition-colors"
                          >
                            <MessageSquare size={16} />
                            Message
                          </button>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Phone size={18} className="text-emerald-600 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</p>
                                <p className="font-medium text-gray-800">{enrollment.phone || 'Not provided'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <AlertCircle size={18} className="text-amber-500 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Emergency Contact</p>
                                <p className="font-medium text-gray-800">{enrollment.emergencyContact || 'Not provided'}</p>
                              </div>
                            </div>
                          </div>

                          {enrollment.notes && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Additional Notes</p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                                "{enrollment.notes}"
                              </p>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Render the Modals */}
      <AddShiftModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchShifts} 
      />
      
      {/* 👉 NEW: Render the Edit Modal */}
      <EditShiftModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={fetchShifts} 
        shift={shiftToEdit}
      />
    </div>
  );
}