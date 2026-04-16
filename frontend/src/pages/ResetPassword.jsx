import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { newPassword: form.newPassword });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e2d5e] to-[#2563eb] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1e2d5e] px-8 py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500 mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-lg">DS</div>
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
          <p className="text-blue-300 text-sm mt-1">Choose a strong password</p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
          <div>
            <label className="form-label">New Password</label>
            <input type="password" value={form.newPassword} onChange={(e) => setForm(p => ({ ...p, newPassword: e.target.value }))}
              required minLength={6} placeholder="••••••••" className="form-input" />
          </div>
          <div>
            <label className="form-label">Confirm Password</label>
            <input type="password" value={form.confirm} onChange={(e) => setForm(p => ({ ...p, confirm: e.target.value }))}
              required minLength={6} placeholder="••••••••" className="form-input" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? 'Saving...' : 'Reset Password'}
          </button>
          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">Back to Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
