import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

const WelcomePage = () => {
  const { t } = useTranslation();
  const { user, clearJustRegistered } = useAuth();

  const email = user?.email ?? '';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden font-auth">
      <div className="fixed inset-0 bg-gradient-to-br from-auth-teal via-auth-teal to-auth-violet animate-[auth-gradient-shift_8s_ease-in-out_infinite]" aria-hidden />
      <div className="fixed top-[-20%] right-[-10%] w-[80vmax] h-[80vmax] rounded-full bg-auth-violet/20 blur-3xl" aria-hidden />
      <div className="fixed bottom-[-30%] left-[-15%] w-[70vmax] h-[70vmax] rounded-full bg-auth-teal/25 blur-3xl" aria-hidden />

      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-10 z-10">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-2xl p-6 space-y-6 border border-white/40 shadow-xl text-center">
          <h1 className="text-2xl font-bold text-slate-900 font-auth">
            {t('welcome.title')}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t('welcome.forgotHintBefore')}
            <span className="font-semibold text-slate-900 break-all rounded px-1 py-0.5 bg-slate-100/80" style={{ fontFamily: 'ui-monospace, monospace' }}>
              {email}
            </span>
            {t('welcome.forgotHintAfter')}
          </p>
          <button
            type="button"
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-auth-teal to-auth-violet text-white text-sm font-semibold hover:brightness-110 transition-all shadow-md"
            onClick={clearJustRegistered}
          >
            {t('welcome.continue')}
          </button>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;
