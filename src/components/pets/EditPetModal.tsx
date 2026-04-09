import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

// The shape of the pet data coming from your MongoDB
interface Pet {
  _id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  weight: string;
  healthStatus: string;
  description: string;
  imageUrl: string;
  status: string;
}

interface EditPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPetUpdated: () => void; // Refresh the grid after editing
  pet: Pet | null;          // The specific pet we are editing
}

export default function EditPetModal({ isOpen, onClose, onPetUpdated, pet }: EditPetModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    gender: 'Male',
    weight: '',
    healthStatus: '',
    description: '',
    imageUrl: '',
    status: 'Available', // We can now update the adoption status!
  });
  const [loading, setLoading] = useState(false);

  // 👉 This is the magic! Whenever the 'pet' prop changes, we fill the form!
  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || '',
        species: pet.species || 'Dog',
        breed: pet.breed || '',
        age: pet.age || '',
        gender: pet.gender || 'Male',
        weight: pet.weight || '',
        healthStatus: pet.healthStatus || '',
        description: pet.description || '',
        imageUrl: pet.imageUrl || '',
        status: pet.status || 'Available'
      });
    }
  }, [pet]);

  if (!isOpen || !pet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send the PUT request to your Node.js backend to update the pet
      await api.put(`/pets/${pet._id}`, formData);
      onPetUpdated(); 
      onClose();   
    } catch (error) {
      console.error("Error updating pet:", error);
      alert("Failed to update pet. Please check the console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-[#1B2A49] p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Edit Pet: {pet.name}</h2>
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
                <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                  value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
                <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                  value={formData.healthStatus} onChange={e => setFormData({...formData, healthStatus: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                  value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
              
              {/* 👉 NEW: Adoption Status Dropdown */}
              <div>
                <label className="block text-sm font-bold text-[#D08C60] mb-1">Adoption Status</label>
                <select className="w-full border border-orange-200 bg-orange-50 rounded-xl px-4 py-2.5 text-[#1B2A49] font-medium"
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Available">Available</option>
                  <option value="Pending">Pending</option>
                  <option value="Adopted">Adopted</option>
                </select>
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
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#D08C60] hover:bg-[#b0744d] transition-colors disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Pet'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}