import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrg } from '../context/OrgContext.jsx';
import { supabase } from '../lib/supabase.js';
import ExportOverlay from '../components/ExportOverlay.jsx';
import FormModal, { formModalClasses as fm } from '../components/FormModal.jsx';
import { formatDisplayDate, formatDateDMonYYYY, formatDisplayMonthYear, getLocalDateString, parseDisplayDateToIso } from '../lib/dates.js';
import { formatEuro, parseEuroToCents } from '../lib/money.js';

const BankPage = () => {
  const { t } = useTranslation();
  const { currentOrgId } = useOrg();
  const [bankAccount, setBankAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balanceCents, setBalanceCents] = useState(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

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
    const date = parseDisplayDateToIso(form.date.value);
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
    const date = parseDisplayDateToIso(form.date.value);
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

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!editingTx?.id) return;
    const form = e.target;
    const amountCents = parseEuroToCents(form.amount.value);
    const note = form.note.value.trim() || null;
    const date = parseDisplayDateToIso(form.date.value);
    if (amountCents <= 0) return;
    await supabase.from('bank_transactions').update({ amount_cents: amountCents, note, date }).eq('id', editingTx.id);
    setEditingTx(null);
    void loadData();
  };

  const handleDeleteTransaction = async () => {
    if (!editingTx?.id) return;
    await supabase.from('bank_transactions').delete().eq('id', editingTx.id);
    setEditingTx(null);
    void loadData();
  };

  const centsToEuroInput = (cents) => (cents != null ? (Number(cents) / 100).toFixed(2) : '');

  const groupedByMonth = transactions.reduce((acc, tx) => {
    const key = formatDisplayMonthYear(tx.date);
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
                        <li key={tx.id}>
                          <button
                            type="button"
                            onClick={() => setEditingTx(tx)}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
                            data-testid={tx.type === 'deposit' ? 'bank-tx-deposit' : 'bank-tx-withdrawal'}
                          >
                            <span className="font-medium">{tx.type === 'deposit' ? '+' : '−'}</span>
                            <span className="flex-1 truncate px-2 text-slate-700">{tx.note || '—'}</span>
                            <span className="text-slate-500">{formatDisplayDate(tx.date)}</span>
                            <span className={tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}>
                              {tx.type === 'deposit' ? '+' : '−'}{formatEuro(tx.amount_cents)}
                            </span>
                          </button>
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
        <FormModal open onClose={() => setShowDeposit(false)} title={t('bank.deposit')}>
          <form onSubmit={handleDeposit} className="space-y-3">
            <label className={fm.label}>
              {t('bank.amount')}
              <div className="relative mt-1">
                <span className={fm.amountEuroPrefix} aria-hidden>€</span>
                <input type="text" name="amount" className={fm.inputWithEuroPrefix} placeholder="0.00" required />
              </div>
            </label>
            <label className={fm.label}>
              {t('bank.note')}
              <input type="text" name="note" className={`mt-1 ${fm.input}`} />
            </label>
            <label className={fm.label}>
              {t('bank.date')}
              <input type="text" name="date" defaultValue={formatDateDMonYYYY(getLocalDateString())} className={`mt-1 ${fm.input}`} placeholder="e.g. 10 Mar 2025" />
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" className={fm.btnSecondary} onClick={() => setShowDeposit(false)}>
                {t('bank.cancel')}
              </button>
              <button type="submit" className={fm.btnPrimaryEmerald}>
                {t('bank.save')}
              </button>
            </div>
          </form>
        </FormModal>
      )}

      {showWithdraw && (
        <FormModal open onClose={() => setShowWithdraw(false)} title={t('bank.withdraw')}>
          <form onSubmit={handleWithdraw} className="space-y-3">
            <label className={fm.label}>
              {t('bank.amount')}
              <div className="relative mt-1">
                <span className={fm.amountEuroPrefix} aria-hidden>€</span>
                <input type="text" name="amount" className={fm.inputWithEuroPrefix} placeholder="0.00" required />
              </div>
            </label>
            <label className={fm.label}>
              {t('bank.note')}
              <input type="text" name="note" className={`mt-1 ${fm.input}`} />
            </label>
            <label className={fm.label}>
              {t('bank.date')}
              <input type="text" name="date" defaultValue={formatDateDMonYYYY(getLocalDateString())} className={`mt-1 ${fm.input}`} placeholder="e.g. 10 Mar 2025" />
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" className={fm.btnSecondary} onClick={() => setShowWithdraw(false)}>
                {t('bank.cancel')}
              </button>
              <button type="submit" className={fm.btnPrimaryRose}>
                {t('bank.save')}
              </button>
            </div>
          </form>
        </FormModal>
      )}

      {editingTx && (
        <FormModal open onClose={() => setEditingTx(null)} title={t('bank.editTransaction')}>
          <form onSubmit={handleUpdateTransaction} className="space-y-3">
            <p className="text-xs text-slate-500">
              {editingTx.type === 'deposit' ? t('bank.deposit') : t('bank.withdraw')}
            </p>
            <label className={fm.label}>
              {t('bank.amount')}
              <div className="relative mt-1">
                <span className={fm.amountEuroPrefix} aria-hidden>€</span>
                <input type="text" name="amount" defaultValue={centsToEuroInput(editingTx.amount_cents)} className={fm.inputWithEuroPrefix} placeholder="0.00" required />
              </div>
            </label>
            <label className={fm.label}>
              {t('bank.note')}
              <input type="text" name="note" defaultValue={editingTx.note ?? ''} className={`mt-1 ${fm.input}`} />
            </label>
            <label className={fm.label}>
              {t('bank.date')}
              <input type="text" name="date" defaultValue={formatDateDMonYYYY(editingTx.date)} className={`mt-1 ${fm.input}`} placeholder="e.g. 10 Mar 2025" />
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" className={fm.btnSecondary} onClick={() => setEditingTx(null)}>
                {t('bank.cancel')}
              </button>
              <button
                type="button"
                className={fm.btnDanger}
                onClick={handleDeleteTransaction}
                data-testid="bank-delete-transaction-btn"
              >
                {t('common.delete')}
              </button>
              <button type="submit" className={fm.btnPrimarySlate}>
                {t('bank.save')}
              </button>
            </div>
          </form>
        </FormModal>
      )}

      {showExport && <ExportOverlay onClose={() => setShowExport(false)} context="bank" />}
    </div>
  );
};

export default BankPage;
