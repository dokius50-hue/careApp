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

  const features = [
    { key: 'Cash', titleKey: 'featureCash', descKey: 'featureCashDesc', icon: '€' },
    { key: 'Bank', titleKey: 'featureBank', descKey: 'featureBankDesc', icon: '◉' },
    { key: 'Volunteers', titleKey: 'featureVolunteers', descKey: 'featureVolunteersDesc', icon: '👥' },
    { key: 'Reports', titleKey: 'featureReports', descKey: 'featureReportsDesc', icon: '📄' },
    { key: 'Orgs', titleKey: 'featureOrgs', descKey: 'featureOrgsDesc', icon: '◇' },
  ];

  const availability = [
    { titleKey: 'availabilityPwa', descKey: 'availabilityPwaDesc', icon: '📱' },
    { titleKey: 'availabilityMobile', descKey: 'availabilityMobileDesc', icon: '✓' },
    { titleKey: 'availabilitySecure', descKey: 'availabilitySecureDesc', icon: '🔒' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Login section – fixed height viewport, centered */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-10 shrink-0">
        <div className="w-full max-w-sm bg-white shadow-lg rounded-2xl p-6 space-y-4 border border-slate-200/80">
          <h1 className="text-xl font-semibold text-center text-slate-900">{t('app.title')}</h1>
          <div className="flex gap-2 text-sm" role="tablist">
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-full border transition-colors ${
                mode === 'signin' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setMode('signin')}
            >
              {t('auth.signIn')}
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-full border transition-colors ${
                mode === 'signup' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium disabled:opacity-60 hover:bg-slate-800 transition-colors"
              disabled={loading}
            >
              {loading ? t('auth.loading') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </form>
        </div>
      </section>

      {/* Landing / info section – scrollable */}
      <section className="flex-1 w-full max-w-lg mx-auto px-4 pb-16 pt-4">
        <div className="space-y-10">
          {/* Tagline + intro */}
          <div className="text-center space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">
              {t('authLanding.tagline')}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {t('authLanding.intro')}
            </p>
          </div>

          {/* For who */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              {t('authLanding.forWho')}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('authLanding.forWhoDesc')}
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-4 text-center">
              {t('authLanding.featuresTitle')}
            </h3>
            <ul className="space-y-3">
              {features.map(({ key, titleKey, descKey, icon }) => (
                <li
                  key={key}
                  className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex gap-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-base" aria-hidden>
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{t(`authLanding.${titleKey}`)}</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t(`authLanding.${descKey}`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Availability */}
          <div className="rounded-2xl bg-slate-800 text-white p-5">
            <h3 className="text-sm font-semibold mb-4">
              {t('authLanding.availabilityTitle')}
            </h3>
            <ul className="space-y-3">
              {availability.map(({ titleKey, descKey, icon }) => (
                <li key={titleKey} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15 text-sm" aria-hidden>
                    {icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t(`authLanding.${titleKey}`)}</p>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{t(`authLanding.${descKey}`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <p className="text-center text-xs text-slate-500">
            {t('authLanding.cta')}
          </p>
        </div>
      </section>
    </div>
  );
};

export default AuthPage;
