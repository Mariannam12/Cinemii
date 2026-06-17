import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Check, AlertTriangle } from 'lucide-react';
import { api } from '../core/backend';

export function ResetPassword() {
  const [params]            = useSearchParams();
  const navigate            = useNavigate();
  const token               = params.get('token');
  const [pw, setPw]         = useState('');
  const [busy, setBusy]     = useState(false);
  const [msg, setMsg]       = useState(null);
  const [done, setDone]     = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) { setMsg({ ok: false, text: 'Password must be at least 8 characters.' }); return; }
    setBusy(true); setMsg(null);
    try {
      await api.resetPassword(token, pw);
      setDone(true);
      setTimeout(() => navigate('/'), 2500);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-dark w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-2xl font-black gradient-text">CINEMII</span>
          <p className="text-muted text-sm mt-1">Reset your password</p>
        </div>

        {!token ? (
          <div className="text-center text-muted">
            <AlertTriangle size={36} className="mx-auto mb-3 text-accent" />
            <p className="text-white font-semibold">Invalid reset link</p>
            <p className="text-sm mt-1">This link is missing its token.</p>
            <Link to="/" className="inline-block mt-4 gradient-accent text-white font-bold px-6 py-2.5 rounded-xl">Go home</Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-green-400" />
            </div>
            <p className="text-white font-semibold">Password updated!</p>
            <p className="text-muted text-sm mt-1">Redirecting you home…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="New password (8+ characters)"
                autoFocus
                required
                className="w-full glass rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-muted text-sm focus:outline-none focus:border-accent/50 border border-white/10 transition"
              />
            </div>
            {msg && <p className={`text-sm text-center py-2 px-3 rounded-lg ${msg.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{msg.text}</p>}
            <button type="submit" disabled={busy} className="w-full gradient-accent text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition disabled:opacity-50">
              {busy ? 'Please wait…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
