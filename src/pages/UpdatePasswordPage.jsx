import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase.js';

const UpdatePasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('updatePassword.mismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('updatePassword.tooShort'));
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden font-auth">
      <div className="fixed inset-0 bg-gradient-to-br from-auth-teal via-auth-teal to-auth-violet animate-[auth-gradient-shift_8s_ease-in-out_infinite]" aria-hidden />
      <div className="fixed top-[-20%] right-[-10%] w-[80vmax] h-[80vmax] rounded-full bg-auth-violet/20 blur-3xl" aria-hidden />
      <div className="fixed bottom-[-30%] left-[-15%] w-[70vmax] h-[70vmax] rounded-full bg-auth-teal/25 blur-3xl" aria-hidden />

      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-10 z-10">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-2xl p-6 space-y-4 border border-white/40 shadow-xl">
          <h1 className="text-xl font-bold text-center text-slate-900 font-auth">
            {t('updatePassword.title')}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600" htmlFor="new-password">
                {t('updatePassword.newPassword')}
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-auth-teal/50 focus:border-auth-teal shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600" htmlFor="confirm-password">
                {t('updatePassword.confirmPassword')}
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-auth-teal/50 focus:border-auth-teal shadow-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-auth-teal to-auth-violet text-white text-sm font-semibold disabled:opacity-60 hover:brightness-110 transition-all shadow-md"
              disabled={loading}
            >
              {loading ? t('auth.loading') : t('updatePassword.submit')}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default UpdatePasswordPage;
