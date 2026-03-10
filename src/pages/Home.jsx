import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext.jsx';
import CreateOrgModal from '../components/CreateOrgModal.jsx';
import ExportOverlay from '../components/ExportOverlay.jsx';
import { formatDisplayDate, getLocalDateString } from '../lib/dates.js';
import { supabase } from '../lib/supabase.js';
import { formatEuro } from '../lib/money.js';

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orgs, currentOrgId, setCurrentOrgId, refetchOrgs } = useOrg();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [metrics, setMetrics] = useState({
    bankBalanceCents: null,
    totalIncomeCents: null,
    totalExpenseCents: null,
    totalVolunteerHours: null,
    loading: true
  });

  const currentOrg = orgs.find((o) => o.id === currentOrgId);

  useEffect(() => {
    if (!currentOrgId) {
      setMetrics((m) => ({ ...m, loading: false }));
      return;
    }
    let cancelled = false;
    (async () => {
      const [incomeRes, expenseRes, accountsRes, hoursRes] = await Promise.all([
        supabase.from('income_entries').select('amount_cents').eq('org_id', currentOrgId),
        supabase.from('expense_entries').select('amount_cents').eq('org_id', currentOrgId),
        supabase.from('bank_accounts').select('id, opening_balance_cents').eq('org_id', currentOrgId).limit(1),
        supabase.from('volunteer_hours').select('hours').eq('org_id', currentOrgId)
      ]);
      if (cancelled) return;

      const totalIncomeCents = (incomeRes.data ?? []).reduce((s, r) => s + (r.amount_cents || 0), 0);
      const totalExpenseCents = (expenseRes.data ?? []).reduce((s, r) => s + (r.amount_cents || 0), 0);
      const totalVolunteerHours = (hoursRes.data ?? []).reduce((s, r) => s + (Number(r.hours) || 0), 0);

      let bankBalanceCents = null;
      const active = accountsRes.data?.[0] ?? null;
      if (active) {
        const { data: txList } = await supabase
          .from('bank_transactions')
          .select('amount_cents, type')
          .eq('org_id', currentOrgId);
        const deposits = (txList ?? []).filter((tx) => tx.type === 'deposit').reduce((s, tx) => s + (tx.amount_cents || 0), 0);
        const withdrawals = (txList ?? []).filter((tx) => tx.type === 'withdrawal').reduce((s, tx) => s + (tx.amount_cents || 0), 0);
        bankBalanceCents = (active.opening_balance_cents || 0) + deposits - withdrawals;
      }

      setMetrics({
        bankBalanceCents,
        totalIncomeCents,
        totalExpenseCents,
        totalVolunteerHours,
        loading: false
      });
    })();
    return () => { cancelled = true; };
  }, [currentOrgId]);

  const netCashCents = metrics.totalIncomeCents != null && metrics.totalExpenseCents != null
    ? metrics.totalIncomeCents - metrics.totalExpenseCents
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('home.currentOrg')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {orgs.length > 1 ? (
            <select
              value={currentOrgId || ''}
              onChange={(e) => setCurrentOrgId(e.target.value || null)}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-medium text-slate-800"
              aria-label={t('settings.switchOrg')}
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-lg font-semibold text-slate-800">{currentOrg?.name ?? '—'}</span>
          )}
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => setShowCreateOrg(true)}
          >
            {t('home.createNewOrg')}
          </button>
        </div>
      </section>

      <section className="rounded-xl bg-slate-900 p-4 text-white">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('home.dashboard')}</p>
          <button
            type="button"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
            onClick={() => setShowExport(true)}
          >
            {t('home.generateReport')}
          </button>
        </div>
        {metrics.loading ? (
          <p className="text-sm text-slate-400">{t('home.loading')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              className="rounded-lg bg-slate-800/80 p-3 text-left"
              onClick={() => navigate('/')}
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">{t('home.today')}</p>
              <p className="mt-1 text-lg font-semibold sm:text-xl" data-testid="home-today">{formatDisplayDate(getLocalDateString())}</p>
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-800/80 p-3 text-left"
              onClick={() => navigate('/bank')}
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">{t('bank.currentBalance')}</p>
              <p className="mt-1 text-lg font-semibold sm:text-xl" data-testid="home-bank-balance">
                {metrics.bankBalanceCents == null ? '—' : formatEuro(metrics.bankBalanceCents)}
              </p>
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-800/80 p-3 text-left"
              onClick={() => navigate('/income-expenses')}
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">{t('incomeExpenses.netCashPosition')}</p>
              <p className="mt-1 text-lg font-semibold sm:text-xl" data-testid="home-net-cash">
                {netCashCents == null ? '—' : formatEuro(netCashCents)}
              </p>
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-800/80 p-3 text-left"
              onClick={() => navigate('/volunteers')}
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">{t('volunteers.totalHoursLogged')}</p>
              <p className="mt-1 text-lg font-semibold sm:text-xl" data-testid="home-volunteer-hours">
                {metrics.totalVolunteerHours != null ? `${Math.round(metrics.totalVolunteerHours)} h` : '—'}
              </p>
            </button>
          </div>
        )}
      </section>

      {showCreateOrg && (
        <CreateOrgModal
          onClose={() => setShowCreateOrg(false)}
          onSuccess={async (newOrgId) => {
            await refetchOrgs();
            if (newOrgId) setCurrentOrgId(newOrgId);
          }}
        />
      )}
      {showExport && (
        <ExportOverlay
          onClose={() => setShowExport(false)}
          context="home"
        />
      )}
    </div>
  );
};

export default HomePage;

