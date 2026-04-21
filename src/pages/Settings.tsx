import React, { useState, useEffect } from 'react';
import { Save, Building, Phone, Mail } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { addToast } = useToast();

  // Fetch the current settings from the backend when the page loads
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        if (response.data) {
          setFormData({
            address: response.data.address || '',
            phone: response.data.phone || '',
            email: response.data.email || ''
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', formData);
      addToast('success', 'Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      addToast('error', 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-8 text-gray-500 font-medium">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Shelter Settings</h1>
        <p className="text-gray-500 mt-1">Manage public contact information displayed on the mobile app.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-lg text-gray-800">Get in Touch Details</h2>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building size={16} className="text-emerald-600" />
              Shelter Address
            </label>
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. Happy Paws Shelter, Pampanga"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="text-emerald-600" />
              Contact Number
            </label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. +63 939 268 3311"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="text-emerald-600" />
              Email Address
            </label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. info@carepaws.org"
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}