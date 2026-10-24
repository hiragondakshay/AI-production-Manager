import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('manufacturing_token') || sessionStorage.getItem('manufacturing_token');
      const savedUser = localStorage.getItem('manufacturing_user') || sessionStorage.getItem('manufacturing_user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('manufacturing_token');
          localStorage.removeItem('manufacturing_user');
          sessionStorage.removeItem('manufacturing_token');
          sessionStorage.removeItem('manufacturing_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (username, password, rememberMe = true) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const { access_token, user: userData } = res.data;

      if (rememberMe) {
        localStorage.setItem('manufacturing_token', access_token);
        localStorage.setItem('manufacturing_user', JSON.stringify(userData));
        localStorage.setItem('manufacturing_remembered_username', username);
        sessionStorage.removeItem('manufacturing_token');
        sessionStorage.removeItem('manufacturing_user');
      } else {
        sessionStorage.setItem('manufacturing_token', access_token);
        sessionStorage.setItem('manufacturing_user', JSON.stringify(userData));
        localStorage.removeItem('manufacturing_token');
        localStorage.removeItem('manufacturing_user');
        localStorage.removeItem('manufacturing_remembered_username');
      }

      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const msg = 
        err.response?.data?.detail || 
        (err.code === 'ERR_NETWORK' || !err.response 
          ? 'Unable to connect to the factory authentication server. Please check your network or ensure backend is running.' 
          : 'Invalid username or password.');
      return { success: false, error: msg };
    }
  };

  const register = async (username, email, password, role) => {
    try {
      await api.post('/auth/register', { username, email, password, role });
      return await login(username, password, true);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('manufacturing_token');
    localStorage.removeItem('manufacturing_user');
    sessionStorage.removeItem('manufacturing_token');
    sessionStorage.removeItem('manufacturing_user');
    setUser(null);
    window.location.href = '/login';
  };


  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (typeof allowedRoles === 'string') return user.role === allowedRoles;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
