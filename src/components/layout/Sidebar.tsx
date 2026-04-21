import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PawPrint, Calendar, MessageSquare, Settings, LogOut, HeartHandshake, ClipboardList, Shield, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={20} /> },
    { name: 'Adoption Apps', path: '/adoptions', icon: <ClipboardList size={20} /> },
    { name: 'Manage Pets', path: '/pets', icon: <PawPrint size={20} /> },
    { name: 'Shifts & Volunteers', path: '/shifts', icon: <Calendar size={20} /> },
    { name: 'Donations', path: '/donations', icon: <HeartHandshake size={20} /> },
    { name: 'Live Chat', path: '/chat', icon: <MessageSquare size={20} /> },
    { name: 'Accounts', path: '/accounts', icon: <Shield size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  // RBAC: Filter out the Accounts tab if the user is not an admin
  const filteredNavItems = navItems.filter(item => {
    if (item.path === '/accounts' && user?.role !== 'admin') return false;
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={onClose} />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1B2A49] text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-700/50 shrink-0">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-[#2D6A4F] rounded-full flex items-center justify-center mr-3">
              <PawPrint size={24} color="white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-wide">CarePaws</h1>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'Staff'} Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => onClose()}
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-[#2D6A4F] text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50 shrink-0">
          <button 
            onClick={() => setShowLogoutModal(true)} 
            className="flex items-center px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl w-full transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Log Out
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="text-red-600 w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
            </div>
            
            <p className="text-gray-600 mb-6 text-sm ml-13">
              Are you sure you want to sign out of the admin portal? You will need to sign back in to access the dashboard.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors text-sm shadow-sm"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}