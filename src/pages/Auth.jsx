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
    <div className="min-h-screen flex flex-col relative overflow-hidden font-auth">
      {/* Full-page gradient background (subtle shimmer via index.css keyframe) */}
      <div className="fixed inset-0 bg-gradient-to-br from-auth-teal via-auth-teal to-auth-violet animate-[auth-gradient-shift_8s_ease-in-out_infinite]" aria-hidden />

      {/* Floating blobs */}
      <div
        className="fixed top-[-20%] right-[-10%] w-[80vmax] h-[80vmax] rounded-full bg-auth-violet/20 blur-3xl"
        aria-hidden
      />
      <div
        className="fixed bottom-[-30%] left-[-15%] w-[70vmax] h-[70vmax] rounded-full bg-auth-teal/25 blur-3xl"
        aria-hidden
      />

      {/* Login section */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 py-10 shrink-0 z-10">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-2xl p-6 space-y-4 border border-white/40 shadow-xl">
          <h1 className="text-2xl font-bold text-center text-slate-900 font-auth">
            {t('app.title')}
          </h1>
          <div className="flex gap-2 text-sm" role="tablist">
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-full border transition-all ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-auth-teal to-auth-violet text-white border-transparent shadow-md'
                  : 'border-white/60 bg-white/50 text-slate-600 hover:bg-white/70'
              }`}
              onClick={() => setMode('signin')}
            >
              {t('auth.signIn')}
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-full border transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-auth-teal to-auth-violet text-white border-transparent shadow-md'
                  : 'border-white/60 bg-white/50 text-slate-600 hover:bg-white/70'
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
                className="w-full rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-auth-teal/50 focus:border-auth-teal shadow-sm"
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
                className="w-full rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-auth-teal/50 focus:border-auth-teal shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-auth-teal to-auth-violet text-white text-sm font-semibold disabled:opacity-60 hover:brightness-110 transition-all shadow-md"
              disabled={loading}
            >
              {loading ? t('auth.loading') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </form>
        </div>
      </section>

      {/* Landing section – transition background */}
      <section className="relative flex-1 w-full max-w-lg mx-auto px-4 pb-16 pt-6 z-10">
        <div className="rounded-t-3xl bg-slate-50/95 backdrop-blur-sm border-t border-white/30 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pt-8 px-4 pb-4">
          <div className="space-y-10">
            {/* Tagline + intro */}
            <div className="text-center space-y-3 opacity-0 animate-auth-fade-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-auth-teal to-auth-violet bg-clip-text text-transparent">
                {t('authLanding.tagline')}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                {t('authLanding.intro')}
              </p>
            </div>

            {/* For who – glass card */}
            <div
              className="rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 p-5 shadow-sm hover:shadow-lg transition-shadow opacity-0 animate-auth-fade-up"
              style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
            >
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                {t('authLanding.forWho')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('authLanding.forWhoDesc')}
              </p>
            </div>

            {/* Features – gradient border cards */}
            <div className="opacity-0 animate-auth-fade-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              <h3 className="text-sm font-semibold text-slate-800 mb-4 text-center">
                {t('authLanding.featuresTitle')}
              </h3>
              <ul className="space-y-3">
                {features.map(({ key, titleKey, descKey, icon }) => (
                  <li
                    key={key}
                    className="rounded-xl p-[1px] bg-gradient-to-r from-auth-teal/30 to-auth-violet/30 hover:from-auth-teal/50 hover:to-auth-violet/50 transition-all"
                  >
                    <div className="rounded-[11px] bg-white/90 backdrop-blur-sm p-4 flex gap-3 hover:shadow-md transition-shadow">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-auth-teal/20 to-auth-violet/20 text-slate-700 text-base" aria-hidden>
                        {icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{t(`authLanding.${titleKey}`)}</p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t(`authLanding.${descKey}`)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Always available – dark with accent */}
            <div
              className="rounded-2xl bg-slate-800 text-white p-5 border-2 border-auth-teal/40 shadow-lg opacity-0 animate-auth-fade-up"
              style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
            >
              <h3 className="text-sm font-semibold mb-4">
                {t('authLanding.availabilityTitle')}
              </h3>
              <ul className="space-y-3">
                {availability.map(({ titleKey, descKey, icon }) => (
                  <li key={titleKey} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-auth-teal/30 text-sm" aria-hidden>
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
            <p
              className="text-center text-xs text-slate-500 opacity-0 animate-auth-fade-up"
              style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
            >
              {t('authLanding.cta')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthPage;