import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import api from '../../services/api';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddShiftModal({ isOpen, onClose, onSuccess }: AddShiftModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    durationHours: '',
    capacity: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/appointments', {
        ...formData,
        durationHours: Number(formData.durationHours),
        capacity: Number(formData.capacity)
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create shift", error);
      alert("Failed to create shift. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Create Volunteer Shift</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g., Morning Dog Walking"
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                required
                type="datetime-local" 
                className="w-full pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required
                  type="number" 
                  min="1"
                  placeholder="e.g., 2"
                  className="w-full pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  onChange={(e) => setFormData({...formData, durationHours: e.target.value})}
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required
                  type="number" 
                  min="1"
                  placeholder="Max volunteers"
                  className="w-full pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}