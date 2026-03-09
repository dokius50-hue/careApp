import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrg } from '../context/OrgContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import ExportOverlay from '../components/ExportOverlay.jsx';
import { getLocalDateString } from '../lib/dates.js';
import { formatEuro, parseEuroToCents } from '../lib/money.js';

const tagsFromString = (s) =>
  (s || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

const IncomeExpensesPage = () => {
  const { t } = useTranslation();
  const { currentOrgId } = useOrg();
  const { user } = useAuth();
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const loadData = async () => {
    if (!currentOrgId) return;
    const [incomeRes, expenseRes] = await Promise.all([
      supabase
        .from('income_entries')
        .select('id, name, date, amount_cents')
        .eq('org_id', currentOrgId)
        .order('date', { ascending: false }),
      supabase
        .from('expense_entries')
        .select('id, name, date, amount_cents')
        .eq('org_id', currentOrgId)
        .order('date', { ascending: false })
    ]);
    setIncomeList(incomeRes.data ?? []);
    setExpenseList(expenseRes.data ?? []);
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
                <li key={row.id} className="flex flex-col text-xs" data-testid="income-entry">
                  <span className="font-medium">{row.name}</span>
                  <span className="text-slate-500">{row.date}</span>
                  <span className="font-medium text-emerald-700">{formatEuro(row.amount_cents)}</span>
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
                <li key={row.id} className="flex flex-col text-xs" data-testid="expense-entry">
                  <span className="font-medium">{row.name}</span>
                  <span className="text-slate-500">{row.date}</span>
                  <span className="font-medium text-rose-700">{formatEuro(row.amount_cents)}</span>
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

      {showExport && (
        <ExportOverlay onClose={() => setShowExport(false)} context="incomeExpenses" />
      )}
    </div>
  );
};

export default IncomeExpensesPage;
