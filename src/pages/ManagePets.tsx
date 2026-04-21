import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import api from '../services/api';
import AddPetModal from '../components/pets/AddPetModal';
import EditPetModal from '../components/pets/EditPetModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';

interface Pet {
  _id: string;
  name: string;
  breed: string;
  status: string;
  imageUrl: string;
}

export default function ManagePets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  
  const { addToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: string, name: string}>({ isOpen: false, id: '', name: '' });

  const fetchPets = async () => {
    setLoading(true);
    try {
      // 👉 FIX: Added ?all=true so the admin sees Adopted pets too!
      const response = await api.get('/pets?all=true');
      setPets(response.data);
    } catch (error) {
      console.error("Failed to fetch pets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const filteredPets = pets.filter(pet => 
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const executeDelete = async () => {
    try {
      await api.delete(`/pets/${confirmDelete.id}`); 
      addToast('success', `${confirmDelete.name} was removed from the shelter.`);
      fetchPets(); 
    } catch (error) {
      console.error("Failed to delete pet:", error);
      addToast('error', 'Could not delete the pet. Please try again.');
    } finally {
      setConfirmDelete({ isOpen: false, id: '', name: '' });
    }
  };

  const handleDeleteClick = (petId: string, petName: string) => {
    setConfirmDelete({ isOpen: true, id: petId, name: petName });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1B2A49]">Manage Pets</h1>
          <p className="text-gray-500 mt-1">Add, update, or remove shelter animals.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#2D6A4F] text-white px-5 py-2.5 rounded-xl font-bold flex items-center hover:bg-[#1f4a37] transition-colors shadow-sm"
        >
          <Plus size={20} className="mr-2" />
          Add New Pet
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center">
        <Search className="text-gray-400 ml-2 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or breed..." 
          className="flex-1 outline-none text-[#1B2A49] placeholder-gray-400 bg-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500 font-medium">Loading pets from database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPets.map((pet) => (
            <div key={pet._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
              
              <div className="h-48 overflow-hidden relative bg-gray-100">
                <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" />
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                  pet.status === 'Available' ? 'bg-green-100 text-green-700' :
                  pet.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {pet.status}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#1B2A49]">{pet.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{pet.breed}</p>
                </div>
                
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      setSelectedPet(pet);
                      setIsEditModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Pet"
                  >
                    <Edit size={18} />
                  </button>

                  <button 
                    onClick={() => handleDeleteClick(pet._id, pet.name)} 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Pet"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 👉 FIX: Updated prop names to onSuccess to match the modal files */}
      <AddPetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchPets} 
      />

      <EditPetModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchPets}
        pet={selectedPet}
      />

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="Delete Pet"
        message={`Are you sure you want to remove ${confirmDelete.name} from the shelter? This action cannot be undone.`}
        confirmText="Delete Pet"
        isDestructive={true}
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}