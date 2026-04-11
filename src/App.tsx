import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ManagePets from './pages/ManagePets';
import Shifts from './pages/Shifts';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Donations from './pages/Donations';
import Adoptions from './pages/Adoptions';

function Layout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/adoptions" element={<Adoptions />} />
          <Route path="/pets" element={<ManagePets />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}