import { useState } from 'react';
import { PawPrint, Mail, Lock, AlertCircle } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Handle Standard Email Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      processSuccessfulLogin(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('/auth/google', { idToken: credentialResponse.credential });
      processSuccessfulLogin(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Shared Role Enforcer
  const processSuccessfulLogin = (data: any) => {
    const { token, user } = data;
    
    // Check if the user is a normal customer
    if (user.role !== 'admin' && user.role !== 'staff') {
      setError("Access Denied: You do not have staff or admin privileges.");
      return;
    }

    login(token, user);
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Header Section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <PawPrint className="h-12 w-12 text-[#2D6A4F]" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to Dashboard
        </h2>
      </div>

      {/* Form Section */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  id="email" 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-[#2D6A4F] focus:border-[#2D6A4F] py-2 border" 
                  placeholder="you@example.com" 
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  id="password" 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-[#2D6A4F] focus:border-[#2D6A4F] py-2 border" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button 
                type="submit" 
                disabled={isLoading} 
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2D6A4F] hover:bg-[#1f4a37]'}`}
              >
                {isLoading ? 'Signing in...' : 'Sign in with Email'}
              </button>
            </div>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <div className="flex justify-center">
              <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => setError("Google authentication encountered an error.")}
                theme="outline"
                size="large"
              />
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}