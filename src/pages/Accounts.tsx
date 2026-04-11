import React, { useState, useEffect } from 'react';
// 👉 FIX: Added 'Search' to the Lucide icon imports
import { Shield, Trash2, User as UserIcon, Mail, Search } from 'lucide-react';
import api from '../services/api';

export default function Accounts() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 👉 NEW: State for tracking the search bar input
  const [searchTerm, setSearchTerm] = useState(""); 

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update user role.");
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete ${userName}'s account? This cannot be undone.`)) {
      try {
        await api.delete(`/auth/users/${userId}`);
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user.");
      }
    }
  };

  // 👉 NEW: Filter the users array based on the search term (checks both name and email)
  const filteredUsers = users.filter((user) => {
    const query = searchTerm.toLowerCase();
    return (
      (user.displayName && user.displayName.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Accounts</h1>
        <p className="text-gray-500 mt-1">View users, assign staff roles, or remove accounts.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* 👉 UPDATED: Added the Search Bar to the header section */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-semibold text-lg text-gray-800">Registered Users</h2>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all shadow-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">User Details</th>
                <th className="p-4 font-medium">Joined Date</th>
                <th className="p-4 font-medium">Account Role</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    {/* Display a dynamic message if the search turns up empty */}
                    {searchTerm ? `No users found matching "${searchTerm}".` : "No users found."}
                  </td>
                </tr>
              ) : (
                /* 👉 UPDATED: Map over filteredUsers instead of the full users array */
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    
                    {/* User Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold overflow-hidden border border-emerald-200">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={18} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{user.displayName || "Unknown User"}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={12}/> {user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Role Dropdown */}
                    <td className="p-4">
                      <select 
                        value={user.role || 'user'} 
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold border outline-none cursor-pointer ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          user.role === 'staff' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        <option value="user">Mobile User</option>
                        <option value="staff">Shelter Staff</option>
                        <option value="admin">Super Admin</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(user._id, user.displayName)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}