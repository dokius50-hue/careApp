import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrg } from '../context/OrgContext.jsx';
import { supabase } from '../lib/supabase.js';
import ExportOverlay from '../components/ExportOverlay.jsx';
import { getLocalDateString } from '../lib/dates.js';
import { formatEuro, parseEuroToCents } from '../lib/money.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y || ''}`;
};

const BankPage = () => {
  const { t } = useTranslation();
  const { currentOrgId } = useOrg();
  const [bankAccount, setBankAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balanceCents, setBalanceCents] = useState(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const loadData = async () => {
    if (!currentOrgId) return;

    const { data: accounts } = await supabase
      .from('bank_accounts')
      .select('id, opening_balance_cents')
      .eq('org_id', currentOrgId)
      .limit(1);

    const active = accounts?.[0] ?? null;
    setBankAccount(active);

    if (!active) {
      setTransactions([]);
      setBalanceCents(null);
      return;
    }

    const { data: txList } = await supabase
      .from('bank_transactions')
      .select('id, amount_cents, note, date, type')
      .eq('org_id', currentOrgId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    setTransactions(txList ?? []);

    const deposits = (txList ?? []).filter((tx) => tx.type === 'deposit').reduce((s, tx) => s + (tx.amount_cents || 0), 0);
    const withdrawals = (txList ?? []).filter((tx) => tx.type === 'withdrawal').reduce((s, tx) => s + (tx.amount_cents || 0), 0);
    setBalanceCents((active.opening_balance_cents || 0) + deposits - withdrawals);
  };

  useEffect(() => {
    void loadData();
  }, [currentOrgId]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const amountCents = parseEuroToCents(form.amount.value);
    const note = form.note.value.trim() || null;
    const date = form.date.value || getLocalDateString();
    if (amountCents <= 0 || !bankAccount?.id) return;
    await supabase.from('bank_transactions').insert({
      org_id: currentOrgId,
      amount_cents: amountCents,
      note,
      date,
      type: 'deposit'
    });
    setShowDeposit(false);
    void loadData();
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const form = e.target;
    const amountCents = parseEuroToCents(form.amount.value);
    const note = form.note.value.trim() || null;
    const date = form.date.value || getLocalDateString();
    if (amountCents <= 0 || !bankAccount?.id) return;
    await supabase.from('bank_transactions').insert({
      org_id: currentOrgId,
      amount_cents: amountCents,
      note,
      date,
      type: 'withdrawal'
    });
    setShowWithdraw(false);
    void loadData();
  };

  const groupedByMonth = transactions.reduce((acc, tx) => {
    const key = formatMonthYear(tx.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300"
          onClick={() => setShowExport(true)}
          data-testid="bank-export-btn"
        >
          {t('bank.export')}
        </button>
      </div>

      <section className="rounded-xl bg-slate-900 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-300">{t('bank.currentBalance')}</p>
        {bankAccount == null ? (
          <p className="mt-1 text-sm" data-testid="bank-no-account">{t('bank.noBankAccount')}</p>
        ) : balanceCents != null ? (
          <p className="mt-1 text-2xl font-semibold" data-testid="bank-balance">{formatEuro(balanceCents)}</p>
        ) : (
          <p className="mt-1 text-sm">...</p>
        )}
      </section>

      {bankAccount && (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              onClick={() => setShowDeposit(true)}
              data-testid="bank-deposit-btn"
            >
              {t('bank.deposit')}
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700"
              onClick={() => setShowWithdraw(true)}
              data-testid="bank-withdraw-btn"
            >
              {t('bank.withdraw')}
            </button>
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-medium text-slate-700">{t('bank.transactions')}</h2>
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500">{t('bank.noTransactions')}</p>
            ) : (
              <ul className="space-y-4">
                {Object.entries(groupedByMonth).map(([monthLabel, list]) => (
                  <li key={monthLabel}>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{monthLabel}</p>
                    <ul className="mt-1 space-y-1 rounded-lg bg-white p-2 shadow-sm">
                      {list.map((tx) => (
                        <li
                          key={tx.id}
                          className="flex items-center justify-between text-sm"
                          data-testid={tx.type === 'deposit' ? 'bank-tx-deposit' : 'bank-tx-withdrawal'}
                        >
                          <span className="font-medium">{tx.type === 'deposit' ? '+' : '−'}</span>
                          <span className="flex-1 truncate px-2 text-slate-700">{tx.note || '—'}</span>
                          <span className="text-slate-500">{tx.date}</span>
                          <span className={tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.type === 'deposit' ? '+' : '−'}{formatEuro(tx.amount_cents)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeposit(false)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">{t('bank.deposit')}</h3>
            <form onSubmit={handleDeposit} className="space-y-3">
              <label className="block text-sm font-medium">
                {t('bank.amount')} (€)
                <input type="text" name="amount" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" placeholder="0.00" required />
              </label>
              <label className="block text-sm font-medium">
                {t('bank.note')}
                <input type="text" name="note" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
              </label>
              <label className="block text-sm font-medium">
                {t('bank.date')}
                <input type="date" name="date" defaultValue={getLocalDateString()} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={() => setShowDeposit(false)}>
                  {t('bank.cancel')}
                </button>
                <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                  {t('bank.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowWithdraw(false)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">{t('bank.withdraw')}</h3>
            <form onSubmit={handleWithdraw} className="space-y-3">
              <label className="block text-sm font-medium">
                {t('bank.amount')} (€)
                <input type="text" name="amount" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" placeholder="0.00" required />
              </label>
              <label className="block text-sm font-medium">
                {t('bank.note')}
                <input type="text" name="note" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
              </label>
              <label className="block text-sm font-medium">
                {t('bank.date')}
                <input type="date" name="date" defaultValue={getLocalDateString()} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={() => setShowWithdraw(false)}>
                  {t('bank.cancel')}
                </button>
                <button type="submit" className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700">
                  {t('bank.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExport && <ExportOverlay onClose={() => setShowExport(false)} context="bank" />}
    </div>
  );
};

export default BankPage;
