import { Link, useLocation } from 'react-router-dom';
import { Home, PawPrint, Calendar, MessageSquare, Settings, LogOut, HeartHandshake, ClipboardList, Shield } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

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
    <div className="w-64 h-screen bg-[#1B2A49] text-white flex flex-col fixed left-0 top-0">
      
      {/* Brand Header - Pinned to Top */}
      <div className="p-6 flex items-center border-b border-gray-700/50 shrink-0">
        <div className="w-10 h-10 bg-[#2D6A4F] rounded-full flex items-center justify-center mr-3">
          <PawPrint size={24} color="white" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-wide">CarePaws</h1>
          <p className="text-xs text-gray-400">Staff Portal</p>
        </div>
      </div>

      {/* Navigation Links - Scrollable Area */}
      <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-[#2D6A4F] text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button - Pinned to Bottom */}
      <div className="p-4 border-t border-gray-700/50 shrink-0">
        <button className="flex items-center px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl w-full transition-colors">
          <LogOut size={20} className="mr-3" />
          Log Out
        </button>
      </div>
      
    </div>
  );
}