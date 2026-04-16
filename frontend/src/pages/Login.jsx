import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const { login, login2FA, loginWithToken } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      loginWithToken(token).then(() => {
        toast.success?.('Successfully logged in with Google!');
        navigate('/dashboard');
      }).catch((err) => {
        toast.error('Failed to validate Google login');
      });
    }
  }, [searchParams, navigate, toast, loginWithToken]);

  const handleGoogleLogin = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5039/api';
    window.location.href = `${baseUrl}/auth/google`;
  };

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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-medium tracking-wider">or continue with</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 text-center">Demo: admin@dosystems.io / password123</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
