import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ForceChangePassword() {
  const { user, updateUserState, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await api.put('/auth/force-change-password', { newPassword: form.newPassword });
      const { token, user: updatedUser } = res.data;
      localStorage.setItem('crm_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      updateUserState(updatedUser);
      toast.success('Password changed! Welcome to Do Systems CRM.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e2d5e] to-[#2563eb] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1e2d5e] px-8 py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Password Change Required</h1>
          <p className="text-blue-300 text-sm mt-1">Hello {user?.name?.split(' ')[0]}, please set a new password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-700 text-sm">Your account requires a password change before you can access the application.</p>
          </div>
          <div>
            <label className="form-label">New Password</label>
            <input type="password" value={form.newPassword} onChange={(e) => setForm(p => ({ ...p, newPassword: e.target.value }))}
              required minLength={6} placeholder="Min. 6 characters" className="form-input" autoFocus />
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input type="password" value={form.confirm} onChange={(e) => setForm(p => ({ ...p, confirm: e.target.value }))}
              required minLength={6} placeholder="••••••••" className="form-input" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? 'Saving...' : 'Set New Password & Continue'}
          </button>
          <button type="button" onClick={logout} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Sign out instead
          </button>
        </form>
      </div>
    </div>
  );
}
