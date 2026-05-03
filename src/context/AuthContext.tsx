// C:\Users\Kernharu\Desktop\capstone_mid\lykas\client\src\context\AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import type { User } from './../types/auth'; // Ensure User type has 'super_admin' and 'status'

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isImpersonating: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  startImpersonation: (token: string, user: User) => void;
  stopImpersonation: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [isLoading, setIsLoading] = useState(true);
  
  // Track original token for impersonation
  const [originalToken, setOriginalToken] = useState<string | null>(localStorage.getItem('originalAdminToken'));

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('adminToken');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error("Session invalid or expired", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('adminToken', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Call backend to blacklist the token
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Still logout locally even if API call fails
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('originalAdminToken');
      setToken(null);
      setOriginalToken(null);
      setUser(null);
    }
  };

  const startImpersonation = (newToken: string, targetUser: User) => {
    if (!originalToken) {
      localStorage.setItem('originalAdminToken', token!);
      setOriginalToken(token);
    }
    localStorage.setItem('adminToken', newToken);
    setToken(newToken);
    setUser(targetUser);
  };

  const stopImpersonation = async () => {
    if (originalToken) {
      localStorage.setItem('adminToken', originalToken);
      setToken(originalToken);
      localStorage.removeItem('originalAdminToken');
      setOriginalToken(null);
      // Re-fetch original user details
      try {
         const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${originalToken}` }});
         setUser(res.data);
      } catch(e) {
         logout();
      }
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('admin:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('admin:unauthorized', handleUnauthorized);
    };
  }, [originalToken]);

  return (
    <AuthContext.Provider value={{ 
      user, token, isLoading, login, logout, 
      startImpersonation, stopImpersonation, 
      isImpersonating: !!originalToken, 
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
