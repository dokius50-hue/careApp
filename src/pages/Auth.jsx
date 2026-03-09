import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fn = mode === 'signin' ? signIn : signUp;
    const { error: authError } = await fn({ email, password });

    if (authError) {
      setError(authError.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white shadow rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">{t('app.title')}</h1>
        <div className="flex gap-2 text-sm" role="tablist">
          <button
            type="button"
            className={`flex-1 py-2 rounded-full border ${
              mode === 'signin' ? 'bg-slate-900 text-white' : 'border-slate-300'
            }`}
            onClick={() => setMode('signin')}
          >
            {t('auth.signIn')}
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-full border ${
              mode === 'signup' ? 'bg-slate-900 text-white' : 'border-slate-300'
            }`}
            onClick={() => setMode('signup')}
          >
            {t('auth.signUp')}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600" htmlFor="email">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600" htmlFor="password">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 rounded-full bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
            disabled={loading}
          >
            {loading ? t('auth.loading') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;

