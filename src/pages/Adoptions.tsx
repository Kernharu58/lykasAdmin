import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, User as UserIcon, Mail } from 'lucide-react';
import api from '../services/api';

export default function Adoptions() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/pets/pending-adoptions');
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching adoptions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (petId: string, petName: string, userName: string) => {
    if (window.confirm(`Are you sure you want to approve ${userName} to adopt ${petName}?`)) {
      try {
        // Change status to Adopted, leave the owner as is
        await api.put(`/pets/${petId}`, { status: 'Adopted' });
        fetchApplications(); // Refresh list
      } catch (error) {
        console.error("Error approving adoption:", error);
        alert("Failed to approve adoption.");
      }
    }
  };

  const handleReject = async (petId: string) => {
    if (window.confirm("Are you sure you want to reject this application? The pet will become available again.")) {
      try {
        // Change status back to Available, and clear the owner
        await api.put(`/pets/${petId}`, { status: 'Available', owner: null });
        fetchApplications(); // Refresh list
      } catch (error) {
        console.error("Error rejecting adoption:", error);
        alert("Failed to reject adoption.");
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Adoption Applications</h1>
        <p className="text-gray-500 mt-1">Review, approve, or reject pending adoption requests.</p>
      </div>

      {loading ? (
        <div className="p-8 text-gray-500">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-lg">No pending adoption applications right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {applications.map((pet) => (
            <div key={pet._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="flex flex-col md:flex-row p-5 gap-6 border-b border-gray-50 flex-1">
                
                {/* Adopter Info Column */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Applicant Details</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold overflow-hidden border border-emerald-200 flex-shrink-0">
                      {pet.owner?.profilePicture ? (
                        <img src={pet.owner.profilePicture} alt="Adopter" className="w-full h-full object-cover" />
                      ) : (
                        pet.owner?.displayName ? pet.owner.displayName.charAt(0).toUpperCase() : <UserIcon size={24} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{pet.owner?.displayName || "Unknown User"}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Mail size={14} /> {pet.owner?.email || "No email"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pet Info Column */}
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Pet Requested</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {pet.imageUrl ? (
                        <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{pet.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{pet.breed} • {pet.age} Years</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50/50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => handleReject(pet._id)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-red-600 font-medium rounded-xl hover:bg-red-50 hover:border-red-100 transition-colors shadow-sm"
                >
                  <XCircle size={18} />
                  Reject
                </button>
                <button 
                  onClick={() => handleApprove(pet._id, pet.name, pet.owner?.displayName)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckCircle size={18} />
                  Approve Application
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}