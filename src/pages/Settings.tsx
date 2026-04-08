import { useState } from 'react';
import { Save, Building2, Phone, Mail, MapPin, Lock } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(false);

  // Default shelter info
  const [shelterInfo, setShelterInfo] = useState({
    name: 'Happy Paws Shelter',
    email: 'info@carepaws.org',
    phone: '+63 939 268 3311',
    address: 'Angeles City, Pampanga, Philippines',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate an API call to save settings
    setTimeout(() => {
      setLoading(false);
      alert('Shelter settings updated successfully!');
    }, 1000);
  };

  return (
    <div className="p-8">
      {/* Header Area */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B2A49]">Platform Settings</h1>
        <p className="text-gray-500 mt-1">Manage shelter details and admin security.</p>
      </div>

      <div className="max-w-4xl space-y-6">
        
        {/* Shelter Profile Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1B2A49] flex items-center">
              <Building2 size={20} className="mr-2 text-[#2D6A4F]" />
              Shelter Profile
            </h2>
            <p className="text-sm text-gray-500 mt-1">This information is displayed on the mobile app.</p>
          </div>
          
          <form onSubmit={handleSave} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shelter Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input type="text" className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]"
                    value={shelterInfo.name} onChange={e => setShelterInfo({...shelterInfo, name: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Public Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input type="email" className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-[#2D6A4F]"
                    value={shelterInfo.email} onChange={e => setShelterInfo({...shelterInfo, email: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input type="text" className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-[#2D6A4F]"
                    value={shelterInfo.phone} onChange={e => setShelterInfo({...shelterInfo, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input type="text" className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-[#2D6A4F]"
                    value={shelterInfo.address} onChange={e => setShelterInfo({...shelterInfo, address: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" disabled={loading} className="bg-[#2D6A4F] text-white px-6 py-2.5 rounded-xl font-bold flex items-center hover:bg-[#1f4a37] transition-colors shadow-sm disabled:opacity-50">
                <Save size={18} className="mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1B2A49] flex items-center">
              <Lock size={20} className="mr-2 text-red-500" />
              Security Settings
            </h2>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#1B2A49]">Admin Password</h3>
              <p className="text-sm text-gray-500">Last changed 3 months ago</p>
            </div>
            <button className="border border-gray-200 text-[#1B2A49] px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition-colors">
              Update Password
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}