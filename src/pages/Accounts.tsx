import React, { useState, useEffect } from 'react';
import { Shield, Trash2, User as UserIcon, Mail, Search, Lock, UserCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import { PageHeader, Card, Badge } from '../components/ui/SharedUI';

export default function Accounts() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  
  const { user: currentUser, startImpersonation } = useAuth();
  const { addToast } = useToast();
  
  const [confirmAction, setConfirmAction] = useState({ isOpen: false, action: '', userId: '', userName: '' });

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

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      addToast('success', 'User role updated successfully.');
      fetchUsers(); 
    } catch (error) {
      addToast('error', 'Failed to update user role.');
    }
  };

  const handleExecuteAction = async () => {
    const { action, userId, userName } = confirmAction;
    try {
      if (action === 'delete') await api.delete(`/auth/users/${userId}`);
      else if (action === 'lock') await api.put(`/auth/users/${userId}/status`, { status: 'locked' });
      else if (action === 'suspend') await api.put(`/auth/users/${userId}/status`, { status: 'suspended' });
      else if (action === 'activate') await api.put(`/auth/users/${userId}/status`, { status: 'active' });
      
      addToast('success', `User ${action} action successful.`);
      fetchUsers(); 
    } catch (error) {
      addToast('error', `Failed to ${action} user.`);
    } finally {
      setConfirmAction({ isOpen: false, action: '', userId: '', userName: '' });
    }
  };

  const handleImpersonate = async (targetUserId: string, targetUserName: string) => {
    try {
      const response = await api.post(`/auth/users/${targetUserId}/impersonate`);
      addToast('info', `Impersonating ${targetUserName}`);
      startImpersonation(response.data.token, response.data.user);
    } catch (error) {
      addToast('error', 'Failed to start impersonation.');
    }
  };

  const filteredUsers = users.filter((u) => 
    (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader 
        title="Manage Accounts" 
        description="View users, assign roles, and manage system access." 
      />

      <Card noPadding>
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-bold text-slate-800">Registered Users</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 sm:p-5 font-bold">User Details</th>
                <th className="p-4 sm:p-5 font-bold">Status</th>
                <th className="p-4 sm:p-5 font-bold">System Role</th>
                <th className="p-4 sm:p-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">Loading user data...</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 sm:p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold shrink-0">
                           {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={18} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{user.displayName || "Unknown"}</h4>
                          <p className="text-xs font-medium text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 sm:p-5">
                      <Badge variant={user.status === 'locked' ? 'danger' : user.status === 'suspended' ? 'warning' : 'success'}>
                        {user.status || 'active'}
                      </Badge>
                    </td>

                    <td className="p-4 sm:p-5">
                      <select 
                        value={user.role || 'user'} 
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={currentUser?.role !== 'super_admin' && user.role === 'super_admin'}
                        className="px-3 py-1.5 rounded-lg text-sm font-bold border outline-none cursor-pointer bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-700 disabled:opacity-50"
                      >
                        <option value="user">Mobile User</option>
                        <option value="staff">Shelter Staff</option>
                        <option value="admin">Admin</option>
                        {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                      </select>
                    </td>

                    <td className="p-4 sm:p-5 text-right">
                      <div className="flex justify-end gap-2">
                        {currentUser?.role === 'super_admin' && user._id !== currentUser._id && (
                          <>
                            <button onClick={() => handleImpersonate(user._id, user.displayName)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Impersonate">
                              <UserCheck size={18} />
                            </button>
                            {user.status === 'active' ? (
                              <button onClick={() => setConfirmAction({ isOpen: true, action: 'lock', userId: user._id, userName: user.displayName })} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Lock Account">
                                <Lock size={18} />
                              </button>
                            ) : (
                              <button onClick={() => setConfirmAction({ isOpen: true, action: 'activate', userId: user._id, userName: user.displayName })} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Reactivate Account">
                                <UserCheck size={18} />
                              </button>
                            )}
                          </>
                        )}
                        <button onClick={() => setConfirmAction({ isOpen: true, action: 'delete', userId: user._id, userName: user.displayName })} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Account">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal 
        isOpen={confirmAction.isOpen} title={`Confirm ${confirmAction.action}`}
        message={`Are you sure you want to ${confirmAction.action} ${confirmAction.userName}?`}
        confirmText={`Yes, ${confirmAction.action}`}
        isDestructive={['delete', 'lock', 'suspend'].includes(confirmAction.action)}
        onConfirm={handleExecuteAction}
        onCancel={() => setConfirmAction({ isOpen: false, action: '', userId: '', userName: '' })}
      />
    </div>
  );
}