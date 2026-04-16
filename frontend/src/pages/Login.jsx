import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const { login, login2FA } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (result.twoFactorRequired) {
        setTempToken(result.tempToken);
        setTwoFactorStep(true);
        toast.info?.('Enter your authenticator code');
      } else if (result.user?.mustChangePassword) {
        navigate('/force-change-password');
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login2FA(tempToken, tfaCode);
      if (user.mustChangePassword) {
        navigate('/force-change-password');
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e2d5e] to-[#2563eb] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1e2d5e] px-8 py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500 mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-lg">DS</div>
          <h1 className="text-2xl font-bold text-white">Do Systems CRM</h1>
          <p className="text-blue-300 text-sm mt-1">{twoFactorStep ? 'Two-Factor Authentication' : 'Sign in to your account'}</p>
        </div>

        {twoFactorStep ? (
          <form onSubmit={handle2FA} className="px-8 py-8 space-y-5">
            <div className="text-center text-gray-500 text-sm bg-blue-50 rounded-xl p-4 border border-blue-100">
              <svg className="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Open your authenticator app and enter the 6-digit code
            </div>
            <div>
              <label className="form-label">Authenticator Code</label>
              <input type="text" value={tfaCode} onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required maxLength={6} placeholder="000000" className="form-input text-center text-xl tracking-[0.5em] font-mono"
                autoFocus autoComplete="one-time-code" />
            </div>
            <button type="submit" disabled={loading || tfaCode.length !== 6} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button type="button" onClick={() => { setTwoFactorStep(false); setTfaCode(''); }} className="w-full text-center text-sm text-gray-400 hover:text-gray-600">
              ← Back to login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div>
              <label className="form-label">Email address</label>
              <input type="email" value={form.email} onChange={set('email')} required
                placeholder="admin@dosystems.io" className="form-input" autoComplete="email" />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" value={form.password} onChange={set('password')} required
                placeholder="••••••••" className="form-input" autoComplete="current-password" />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-blue-500 hover:text-blue-700 font-medium">Forgot Password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Signing in...</>
              ) : 'Sign in'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700">Register</Link>
            </p>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 text-center">Demo: admin@dosystems.io / password123</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
