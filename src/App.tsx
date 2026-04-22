import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ManagePets from './pages/ManagePets';
import Shifts from './pages/Shifts';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Donations from './pages/Donations';
import Adoptions from './pages/Adoptions';
import Accounts from './pages/Accounts';
import AuditLogs from './pages/AuditLogs';

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden ml-10">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col lg:ml-64 w-full min-w-0 transition-all duration-300">
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu size={24} />
          </button>
          <span className="font-bold text-[#1B2A49] text-lg">CarePaws Admin</span>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/adoptions" element={<Adoptions />} />
            <Route path="/pets" element={<ManagePets />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* STRICT ADMIN-ONLY ROUTE */}
            <Route path="/accounts" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Accounts />
              </ProtectedRoute>
            } />

            <Route path="/audit-logs" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AuditLogs />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <AdminLayout />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
