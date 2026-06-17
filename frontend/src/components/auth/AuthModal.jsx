import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../core/backend';

const GOOGLE_CLIENT_ID = '277488906528-8rk7dpimukrm1kivdq019eueoc4krcdp.apps.googleusercontent.com';

export function AuthModal({ onClose }) {
  const { login }                   = useAuth();
  const [tab, setTab]               = useState('signin');
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState(null); // { text, ok }
  const googleBtnRef                = useRef(null);

  // Form state
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [twofa, setTwofa]           = useState(false); // 2FA code step
  const [otp, setOtp]               = useState('');
  const [forgot, setForgot]         = useState(false); // forgot-password step

  // Google Sign-In button
  useEffect(() => {
    const gsi = window.google?.accounts?.id;
    if (!gsi || !googleBtnRef.current) return;
    gsi.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setLoading(true);
        setMsg(null);
        try {
          const result = await api.google(response.credential);
          login(result.access_token, result.user);
          setMsg({ text: `Welcome, ${result.user.name}!`, ok: true });
          setTimeout(onClose, 900);
        } catch (e) {
          setMsg({ text: e.message, ok: false });
        } finally {
          setLoading(false);
        }
      },
    });
    gsi.renderButton(googleBtnRef.current, {
      theme: 'filled_black',
      size: 'large',
      shape: 'rectangular',
      width: googleBtnRef.current.offsetWidth || 320,
      text: 'continue_with',
    });
  }, [login, onClose]);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleForgot = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setMsg({ text: res.message || 'If that email exists, a reset link has been sent.', ok: true });
    } catch (e) {
      setMsg({ text: e.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      let result;
      if (tab === 'signup') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.');
        result = await api.signup(name.trim(), email.trim(), password);
      } else {
        result = await api.login(email.trim(), password, twofa ? otp.trim() : undefined);
        // Account has 2FA — switch to code-entry step instead of logging in.
        if (result?.requires_2fa) {
          setTwofa(true);
          setMsg({ text: 'Enter the 6-digit code from your authenticator app.', ok: true });
          setLoading(false);
          return;
        }
      }
      login(result.access_token, result.user);
      setMsg({ text: `Welcome${tab === 'signup' ? '' : ' back'}, ${result.user.name}!`, ok: true });
      setTimeout(onClose, 800);
    } catch (e) {
      setMsg({ text: e.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-dark w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-pop">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full text-muted hover:text-white hover:bg-white/10 flex items-center justify-center transition"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-2xl font-black gradient-text">CINEMII</span>
          <p className="text-muted text-sm mt-1">Your cinema, your rules</p>
        </div>

        {/* Tabs (hidden during 2FA / forgot steps) */}
        {!twofa && !forgot && (
          <div className="flex rounded-xl bg-surface p-1 mb-6">
            {['signin', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setMsg(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  tab === t ? 'bg-accent text-white shadow' : 'text-muted hover:text-white'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {/* Google + divider (hidden during 2FA / forgot steps) */}
        {!twofa && !forgot && (
          <>
            <div ref={googleBtnRef} className="w-full mb-4" />
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-muted text-xs">or with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={forgot ? handleForgot : handleSubmit} className="flex flex-col gap-3">
          {forgot ? (
            <>
              <div className="text-center mb-1">
                <p className="text-white font-semibold">Reset your password</p>
                <p className="text-muted text-xs mt-1">Enter your email and we'll send a reset link.</p>
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                className="w-full glass rounded-xl px-4 py-3 text-white placeholder:text-muted text-sm focus:outline-none focus:border-accent/60 border border-transparent transition"
              />
            </>
          ) : twofa ? (
            <>
              <div className="text-center mb-1">
                <p className="text-white font-semibold">Two-factor verification</p>
                <p className="text-muted text-xs mt-1">Enter the 6-digit code from your authenticator app (or a backup code).</p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
                required
                className="w-full glass rounded-xl px-4 py-3 text-white placeholder:text-muted text-center text-2xl tracking-[0.4em] font-bold focus:outline-none focus:border-accent/60 border border-transparent transition"
              />
            </>
          ) : (
            <>
              {tab === 'signup' && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full glass rounded-xl px-4 py-3 text-white placeholder:text-muted text-sm focus:outline-none focus:border-accent/60 border border-transparent transition"
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full glass rounded-xl px-4 py-3 text-white placeholder:text-muted text-sm focus:outline-none focus:border-accent/60 border border-transparent transition"
              />
              <input
                type="password"
                placeholder={tab === 'signup' ? 'Password (8+ characters)' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full glass rounded-xl px-4 py-3 text-white placeholder:text-muted text-sm focus:outline-none focus:border-accent/60 border border-transparent transition"
              />
              {tab === 'signin' && (
                <button type="button" onClick={() => { setForgot(true); setMsg(null); }} className="text-muted text-xs hover:text-accent transition text-right">
                  Forgot password?
                </button>
              )}
            </>
          )}

          {msg && (
            <p className={`text-sm text-center py-2 px-3 rounded-lg ${msg.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-accent text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {loading ? 'Please wait…' : forgot ? 'Send reset link' : twofa ? 'Verify' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          {(twofa || forgot) && (
            <button
              type="button"
              onClick={() => { setTwofa(false); setForgot(false); setOtp(''); setMsg(null); }}
              className="text-muted text-xs hover:text-white transition"
            >
              ← Back to sign in
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
