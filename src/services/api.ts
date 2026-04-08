import axios from 'axios';

// This points to your existing Node.js backend
// If you are using ngrok for the web version too, replace this URL!
const API_URL = 'http://localhost:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically add the JWT token to every request
api.interceptors.request.use(
  (config) => {
    // We use localStorage for the web admin instead of SecureStore
    const token = localStorage.getItem('adminToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;