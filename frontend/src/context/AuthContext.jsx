import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('crm_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user, twoFactorRequired, tempToken } = res.data;
    if (twoFactorRequired) return { twoFactorRequired: true, tempToken };
    localStorage.setItem('crm_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return { user };
  }, []);

  const login2FA = useCallback(async (tempToken, code) => {
    const res = await api.post('/auth/2fa/login', { tempToken, token: code });
    const { token, user } = res.data;
    localStorage.setItem('crm_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('crm_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crm_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem('crm_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const res = await api.get('/auth/me');
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const updateUserState = useCallback((updatedUser) => setUser(updatedUser), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, login2FA, register, logout, loginWithToken, updateUserState }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
