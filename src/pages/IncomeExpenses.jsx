import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrg } from '../context/OrgContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import ExportOverlay from '../components/ExportOverlay.jsx';
import { formatDisplayDate, getLocalDateString } from '../lib/dates.js';
import { formatEuro, parseEuroToCents } from '../lib/money.js';

const tagsFromString = (s) =>
  (s || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

const tagsToString = (arr) => (Array.isArray(arr) ? arr.join(', ') : '');
const centsToEuroInput = (cents) => (cents != null ? (Number(cents) / 100).toFixed(2) : '');

const IncomeExpensesPage = () => {
  const { t } = useTranslation();
  const { currentOrgId } = useOrg();
  const { user } = useAuth();
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [bankBalanceCents, setBankBalanceCents] = useState(null);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const loadData = async () => {
    if (!currentOrgId) return;
    const [incomeRes, expenseRes, accountsRes] = await Promise.all([
      supabase
        .from('income_entries')
        .select('id, name, date, amount_cents, tags')
        .eq('org_id', currentOrgId)
        .order('date', { ascending: false }),
      supabase
        .from('expense_entries')
        .select('id, name, date, amount_cents, tags')
        .eq('org_id', currentOrgId)
        .order('date', { ascending: false }),
      supabase
        .from('bank_accounts')
        .select('id, opening_balance_cents')
        .eq('org_id', currentOrgId)
        .limit(1)
    ]);
    setIncomeList(incomeRes.data ?? []);
    setExpenseList(expenseRes.data ?? []);

    const active = accountsRes.data?.[0] ?? null;
    if (!active) {
      setBankBalanceCents(null);
      return;
    }
    const { data: txList } = await supabase
      .from('bank_transactions')
      .select('amount_cents, type')
      .eq('org_id', currentOrgId);
    const deposits = (txList ?? []).filter((tx) => tx.type === 'deposit').reduce((s, tx) => s + (tx.amount_cents || 0), 0);
    const withdrawals = (txList ?? []).filter((tx) => tx.type === 'withdrawal').reduce((s, tx) => s + (tx.amount_cents || 0), 0);
    setBankBalanceCents((active.opening_balance_cents || 0) + deposits - withdrawals);
  };

  useEffect(() => {
    void loadData();
  }, [currentOrgId]);

  const handleAddIncome = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const amountCents = parseEuroToCents(form.amount.value);
    const date = form.date.value || getLocalDateString();
    const tags = tagsFromString(form.tags.value);
    if (!name || amountCents <= 0 || !currentOrgId || !user?.id) return;
    await supabase.from('income_entries').insert({
      org_id: currentOrgId,
      created_by: user.id,
      name,
      amount_cents: amountCents,
      date,
      tags
    });
    setShowAddIncome(false);
    void loadData();
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const amountCents = parseEuroToCents(form.amount.value);
    const date = form.date.value || getLocalDateString();
    const tags = tagsFromString(form.tags.value);
    if (!name || amountCents <= 0 || !currentOrgId || !user?.id) return;
    await supabase.from('expense_entries').insert({
      org_id: currentOrgId,
      created_by: user.id,
      name,
      amount_cents: amountCents,
      date,
      tags
    });
    setShowAddExpense(false);
    void loadData();
  };

  const handleUpdateIncome = async (e) => {
    e.preventDefault();
    if (!editingEntry?.row?.id) return;
    const form = e.target;
    const name = form.name.value.trim();
    const amountCents = parseEuroToCents(form.amount.value);
    const date = form.date.value || getLocalDateString();
    const tags = tagsFromString(form.tags.value);
    if (!name || amountCents <= 0) return;
    await supabase.from('income_entries').update({ name, amount_cents: amountCents, date, tags }).eq('id', editingEntry.row.id);
    setEditingEntry(null);
    void loadData();
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!editingEntry?.row?.id) return;
    const form = e.target;
    const name = form.name.value.trim();
    const amountCents = parseEuroToCents(form.amount.value);
    const date = form.date.value || getLocalDateString();
    const tags = tagsFromString(form.tags.value);
    if (!name || amountCents <= 0) return;
    await supabase.from('expense_entries').update({ name, amount_cents: amountCents, date, tags }).eq('id', editingEntry.row.id);
    setEditingEntry(null);
    void loadData();
  };

  const handleDeleteIncome = async () => {
    if (!editingEntry?.row?.id) return;
    await supabase.from('income_entries').delete().eq('id', editingEntry.row.id);
    setEditingEntry(null);
    void loadData();
  };

  const handleDeleteExpense = async () => {
    if (!editingEntry?.row?.id) return;
    await supabase.from('expense_entries').delete().eq('id', editingEntry.row.id);
    setEditingEntry(null);
    void loadData();
  };

  const totalIncomeCents = incomeList.reduce((s, row) => s + (row.amount_cents || 0), 0);
  const totalExpenseCents = expenseList.reduce((s, row) => s + (row.amount_cents || 0), 0);
  const netCashCents = totalIncomeCents - totalExpenseCents;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300"
          onClick={() => setShowExport(true)}
          data-testid="income-expenses-export-btn"
        >
          {t('incomeExpenses.export')}
        </button>
      </div>

      <section className="rounded-xl bg-slate-900 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-300">{t('incomeExpenses.netCashPosition')}</p>
        <p className="mt-1 text-2xl font-semibold" data-testid="income-expenses-net-cash">{formatEuro(netCashCents)}</p>
        <p className="mt-2 text-sm text-slate-300">
          {t('incomeExpenses.bankAccountPosition')}: {bankBalanceCents == null ? t('bank.noBankAccount') : formatEuro(bankBalanceCents)}
        </p>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          onClick={() => setShowAddIncome(true)}
          data-testid="add-income-btn"
        >
          {t('incomeExpenses.addIncome')}
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700"
          onClick={() => setShowAddExpense(true)}
          data-testid="add-expense-btn"
        >
          {t('incomeExpenses.addExpense')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-slate-700">{t('incomeExpenses.recentIncome')}</h2>
          {incomeList.length === 0 ? (
            <p className="text-xs text-slate-500">{t('incomeExpenses.noEntries')}</p>
          ) : (
            <ul className="space-y-1 rounded-lg bg-white p-2 shadow-sm">
              {incomeList.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setEditingEntry({ type: 'income', row })}
                    className="flex w-full flex-col rounded-lg p-2 text-left text-xs transition-colors hover:bg-slate-50 active:bg-slate-100"
                    data-testid="income-entry"
                  >
                    <span className="font-medium">{row.name}</span>
                    <span className="text-slate-500">{formatDisplayDate(row.date)}</span>
                    <span className="font-medium text-emerald-700">{formatEuro(row.amount_cents)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-slate-700">{t('incomeExpenses.recentExpense')}</h2>
          {expenseList.length === 0 ? (
            <p className="text-xs text-slate-500">{t('incomeExpenses.noEntries')}</p>
          ) : (
            <ul className="space-y-1 rounded-lg bg-white p-2 shadow-sm">
              {expenseList.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setEditingEntry({ type: 'expense', row })}
                    className="flex w-full flex-col rounded-lg p-2 text-left text-xs transition-colors hover:bg-slate-50 active:bg-slate-100"
                    data-testid="expense-entry"
                  >
                    <span className="font-medium">{row.name}</span>
                    <span className="text-slate-500">{formatDisplayDate(row.date)}</span>
                    <span className="font-medium text-rose-700">{formatEuro(row.amount_cents)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {showAddIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddIncome(false)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">{t('incomeExpenses.addIncome')}</h3>
            <form onSubmit={handleAddIncome} className="space-y-3">
              <label className="block text-sm font-medium">
                {t('incomeExpenses.name')}
                <input type="text" name="name" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" required />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.amount')} (€)
                <input type="text" name="amount" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" placeholder="0.00" required />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.date')}
                <input type="date" name="date" defaultValue={getLocalDateString()} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.tags')}
                <input type="text" name="tags" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" placeholder="tag1, tag2" />
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={() => setShowAddIncome(false)}>
                  {t('incomeExpenses.cancel')}
                </button>
                <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                  {t('incomeExpenses.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddExpense(false)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">{t('incomeExpenses.addExpense')}</h3>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <label className="block text-sm font-medium">
                {t('incomeExpenses.name')}
                <input type="text" name="name" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" required />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.amount')} (€)
                <input type="text" name="amount" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" placeholder="0.00" required />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.date')}
                <input type="date" name="date" defaultValue={getLocalDateString()} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.tags')}
                <input type="text" name="tags" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" placeholder="tag1, tag2" />
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={() => setShowAddExpense(false)}>
                  {t('incomeExpenses.cancel')}
                </button>
                <button type="submit" className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700">
                  {t('incomeExpenses.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingEntry?.type === 'income' && editingEntry.row && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingEntry(null)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">{t('incomeExpenses.editIncome')}</h3>
            <form onSubmit={handleUpdateIncome} className="space-y-3">
              <label className="block text-sm font-medium">
                {t('incomeExpenses.name')}
                <input type="text" name="name" defaultValue={editingEntry.row.name} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" required />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.amount')} (€)
                <input type="text" name="amount" defaultValue={centsToEuroInput(editingEntry.row.amount_cents)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" placeholder="0.00" required />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.date')}
                <input type="date" name="date" defaultValue={editingEntry.row.date} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.tags')}
                <input type="text" name="tags" defaultValue={tagsToString(editingEntry.row.tags)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" placeholder="tag1, tag2" />
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  onClick={() => setEditingEntry(null)}
                >
                  {t('incomeExpenses.cancel')}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                  onClick={handleDeleteIncome}
                  data-testid="income-delete-entry-btn"
                >
                  {t('common.delete')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                >
                  {t('incomeExpenses.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingEntry?.type === 'expense' && editingEntry.row && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingEntry(null)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">{t('incomeExpenses.editExpense')}</h3>
            <form onSubmit={handleUpdateExpense} className="space-y-3">
              <label className="block text-sm font-medium">
                {t('incomeExpenses.name')}
                <input type="text" name="name" defaultValue={editingEntry.row.name} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" required />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.amount')} (€)
                <input type="text" name="amount" defaultValue={centsToEuroInput(editingEntry.row.amount_cents)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" placeholder="0.00" required />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.date')}
                <input type="date" name="date" defaultValue={editingEntry.row.date} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
              </label>
              <label className="block text-sm font-medium">
                {t('incomeExpenses.tags')}
                <input type="text" name="tags" defaultValue={tagsToString(editingEntry.row.tags)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" placeholder="tag1, tag2" />
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  onClick={() => setEditingEntry(null)}
                >
                  {t('incomeExpenses.cancel')}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                  onClick={handleDeleteExpense}
                  data-testid="expense-delete-entry-btn"
                >
                  {t('common.delete')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700"
                >
                  {t('incomeExpenses.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExport && (
        <ExportOverlay onClose={() => setShowExport(false)} context="incomeExpenses" />
      )}
    </div>
  );
};

export default IncomeExpensesPage;
