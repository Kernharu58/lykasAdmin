import { useEffect, useState } from 'react';
import { Building, Mail, Phone, Save } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ErrorState, LoadingState } from '../components/ui/StateDisplays';
import { Card, PageHeader, SectionHeader } from '../components/ui/SharedUI';

export default function Settings() {
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useToast();

  const fetchSettings = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      const response = await api.get('/settings');
      if (response.data) {
        setFormData({
          address: response.data.address || '',
          phone: response.data.phone || '',
          email: response.data.email || '',
        });
      }
    } catch (fetchError) {
      console.error('Error fetching settings:', fetchError);
      setError('Unable to load shelter settings right now. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', formData);
      addToast('success', 'Settings saved successfully.');
    } catch (saveError) {
      console.error('Error saving settings:', saveError);
      addToast('error', 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <LoadingState message="Loading shelter settings..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <ErrorState message={error} onRetry={fetchSettings} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <PageHeader
        title="Shelter Settings"
        description="Manage the public contact information displayed throughout the CarePaws experience."
      />

      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/60">
          <SectionHeader
            title="Get in Touch Details"
            description="These values appear in public-facing support and contact sections."
          />
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Building size={16} className="text-emerald-600" />
              Shelter Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
              placeholder="e.g. Happy Paws Shelter, Pampanga"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Phone size={16} className="text-emerald-600" />
              Contact Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
              placeholder="e.g. +63 939 268 3311"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Mail size={16} className="text-emerald-600" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
              placeholder="e.g. info@carepaws.org"
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/60 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Card>
    </div>
  );
}
