import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext.jsx';
import { useOrg } from './context/OrgContext.jsx';
import BottomNav from './components/BottomNav.jsx';
import AuthPage from './pages/Auth.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import UpdatePasswordPage from './pages/UpdatePasswordPage.jsx';
import CreateOrganisationPage from './pages/CreateOrganisation.jsx';
import HomePage from './pages/Home.jsx';
import IncomeExpensesPage from './pages/IncomeExpenses.jsx';
import BankPage from './pages/Bank.jsx';
import VolunteersPage from './pages/Volunteers.jsx';
import SettingsPage from './pages/Settings.jsx';

const AppShell = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <main className="flex-1 max-w-md mx-auto w-full p-4 pb-24">{children}</main>
    <BottomNav />
  </div>
);

const App = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { user, loading: authLoading, justRegistered } = useAuth();
  const { orgs, currentOrgId, loading: orgLoading } = useOrg();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('app.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (justRegistered) {
    return <WelcomePage />;
  }

  if (pathname === '/update-password') {
    return <UpdatePasswordPage />;
  }

  if (!orgLoading && orgs.length === 0) {
    return <CreateOrganisationPage />;
  }

  if (!currentOrgId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('app.loading')}</p>
      </div>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">{t('app.title')}</h1>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/income-expenses" element={<IncomeExpensesPage />} />
        <Route path="/bank" element={<BankPage />} />
        <Route path="/volunteers" element={<VolunteersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
};

export default App;


