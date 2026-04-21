import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PawPrint, Calendar, MessageSquare, Settings, LogOut, HeartHandshake, ClipboardList, Shield, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Restored the navItems array!
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

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
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
          {/* Mobile Close Button */}
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => onClose()} // Close mobile menu on navigate
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
          <button onClick={handleLogout} className="flex items-center px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl w-full transition-colors">
            <LogOut size={20} className="mr-3" />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}