import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ManagePets from './pages/ManagePets';
import Shifts from './pages/Shifts';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
// We use a Layout wrapper to decide if we should show the Sidebar or not!
function Layout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // If they are on the login page, ONLY show the login page (no sidebar)
  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Otherwise, show the full Dashboard layout with the Sidebar
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pets" element={<ManagePets />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/chat" element={<Chat />} />  
          <Route path="/settings" element={<Settings />} /> 
        </Routes>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;