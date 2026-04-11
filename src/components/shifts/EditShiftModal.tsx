import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

interface EditShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shift: any;
}

export default function EditShiftModal({ isOpen, onClose, onSuccess, shift }: EditShiftModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    durationHours: '',
    capacity: '',
    status: 'Open'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shift) {
      // Format MongoDB date for HTML datetime-local input (YYYY-MM-DDTHH:mm)
      const dateObj = new Date(shift.date);
      // Adjusting for local timezone offset to display correctly in the input
      const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
      const formattedDate = localDate.toISOString().slice(0, 16);

      setFormData({
        title: shift.title || '',
        date: formattedDate,
        durationHours: shift.durationHours?.toString() || '',
        capacity: shift.capacity?.toString() || '',
        status: shift.status || 'Open'
      });
    }
  }, [shift]);

  if (!isOpen || !shift) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/appointments/${shift._id}`, {
        ...formData,
        durationHours: Number(formData.durationHours),
        capacity: Number(formData.capacity)
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating shift:", error);
      alert("Failed to update shift.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-gray-800">Edit Shift</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 rounded-full p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Title</label>
              <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input required type="datetime-local" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours)</label>
                <input required type="number" step="0.5" value={formData.durationHours} onChange={(e) => setFormData({...formData, durationHours: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Volunteers</label>
                <input required type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
                <option value="Open">Open</option>
                <option value="Full">Full</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}