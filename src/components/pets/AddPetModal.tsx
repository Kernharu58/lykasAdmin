import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import api from '../../services/api';

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPetModal({ isOpen, onClose, onSuccess }: AddPetModalProps) {
  const [formData, setFormData] = useState({
    name: '', type: 'Dog', breed: '', age: '', 
    gender: 'Male', size: 'Medium', status: 'Available', description: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      if (imageFile) {
        data.append('image', imageFile);
      }

      await api.post('/pets', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onSuccess(); 
      onClose();   
    } catch (error) {
      console.error("Failed to add pet", error);
      alert("Failed to add pet. Please check the form and your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop with blur
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      
      {/* Modal Container: Max height is 90% of screen. Flex column to manage scrolling */}
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 flex-shrink-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">Add New Pet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pet Photo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <Upload className="text-emerald-500 mb-3" size={32} />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {imageFile ? imageFile.name : "Click to upload a photo"}
                </p>
                <p className="text-xs text-gray-500 mb-4">PNG, JPG, or JPEG up to 5MB</p>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer w-full max-w-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed *</label>
                <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  onChange={(e) => setFormData({...formData, breed: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (Years) *</label>
                <input required type="number" step="0.1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  onChange={(e) => setFormData({...formData, age: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  onChange={(e) => setFormData({...formData, size: e.target.value})}>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="Available">Available for Adoption</option>
                <option value="Pending">Adoption Pending</option>
                <option value="Adopted">Adopted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description & Medical Notes</label>
              <textarea rows={4} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none resize-none transition-all"
                placeholder="Enter pet personality, medical history, vaccinations..."
                onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>

          </div>

          {/* Fixed Footer Buttons */}
          <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-white flex-shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors">
              {loading ? 'Saving...' : 'Add Pet'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}