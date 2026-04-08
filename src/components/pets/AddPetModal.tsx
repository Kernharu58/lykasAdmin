import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPetAdded: () => void; // Function to refresh the list after adding
}

export default function AddPetModal({ isOpen, onClose, onPetAdded }: AddPetModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    gender: 'Male',
    weight: '',
    healthStatus: 'Vaccinated',
    description: '',
    imageUrl: '', // For now, we'll just paste a URL. We can add a file picker later!
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send the data to your Node.js backend
      await api.post('/pets', formData);
      onPetAdded(); // Refresh the pet list
      onClose();    // Close the modal
    } catch (error) {
      console.error("Error adding pet:", error);
      alert("Failed to add pet. Please check the console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-[#1B2A49] p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Add New Pet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white"
                  value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})}>
                  <option>Dog</option>
                  <option>Cat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                  value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white"
                  value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (e.g., "2 years")</label>
                <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                  value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (e.g., "15 kg")</label>
                <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                  value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
                <input required type="text" placeholder="e.g., Vaccinated, Spayed" className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                  value={formData.healthStatus} onChange={e => setFormData({...formData, healthStatus: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input required type="text" placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                  value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 resize-none"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#2D6A4F] hover:bg-[#1f4a37] transition-colors disabled:opacity-50">
              {loading ? 'Adding...' : 'Save Pet'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}