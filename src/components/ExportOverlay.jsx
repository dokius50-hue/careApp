import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { useOrg } from '../context/OrgContext.jsx';
import { supabase } from '../lib/supabase.js';
import { formatEuro } from '../lib/money.js';
import { formatDisplayDate, formatDisplayDateTime, getLocalDateString } from '../lib/dates.js';

const firstDayOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return getLocalDateString(d);
};

const lastDayOfMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return getLocalDateString(d);
};

const SECTION_KEYS = {
  incomeExpenses: ['incomeSummary', 'expenseSummary', 'incomeEntries', 'expenseEntries'],
  bank: ['bankSummary', 'bankTransactions'],
  volunteers: ['volunteerHoursSummary', 'hoursByVolunteer'],
  home: ['incomeSummary', 'expenseSummary', 'incomeEntries', 'expenseEntries', 'bankSummary', 'bankTransactions', 'volunteerHoursSummary', 'hoursByVolunteer']
};

const PrintReport = ({ orgName, dateFrom, dateTo, generatedAt, reportData, labels }) => {
  const l = labels || {};
  const fromLabel = formatDisplayDate(dateFrom);
  const toLabel = formatDisplayDate(dateTo);
  return (
    <div className="bg-white p-6 text-black" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'sans-serif' }}>
      <header className="border-b pb-2 mb-4">
        <h1 className="text-lg font-bold">{orgName}</h1>
        <p className="text-sm text-slate-600">{l.reportSubtitle?.replace('{{from}}', fromLabel).replace('{{to}}', toLabel) ?? `Export Report — ${fromLabel} to ${toLabel}`}</p>
        <p className="text-xs text-slate-500">{l.generated ?? 'Generated'}: {formatDisplayDateTime(generatedAt)}</p>
      </header>
      {reportData?.incomeSummary && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2">{l.incomeSummary ?? 'Income summary'}</h2>
          <p className="text-xs">
            {l.incomeSummaryTotal ?? 'Total income in period'}:{' '}
            {formatEuro(reportData.incomeSummary.totalIncomeCents ?? 0)}
          </p>
        </section>
      )}
      {reportData?.incomeEntries?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2">{l.incomeEntries ?? 'Income entries'}</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">{l.name ?? 'Name'}</th>
                <th className="text-left py-1">{l.date ?? 'Date'}</th>
                <th className="text-right py-1">{l.amount ?? 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.incomeEntries.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="py-1">{row.name}</td>
                  <td className="py-1">{formatDisplayDate(row.date)}</td>
                  <td className="py-1 text-right">{formatEuro(row.amount_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {reportData?.expenseSummary && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2">{l.expenseSummary ?? 'Expense summary'}</h2>
          <p className="text-xs">
            {l.expenseSummaryTotal ?? 'Total expenses in period'}:{' '}
            {formatEuro(reportData.expenseSummary.totalExpenseCents ?? 0)}
          </p>
        </section>
      )}
      {reportData?.expenseEntries?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2">{l.expenseEntries ?? 'Expense entries'}</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">{l.name ?? 'Name'}</th>
                <th className="text-left py-1">{l.date ?? 'Date'}</th>
                <th className="text-right py-1">{l.amount ?? 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.expenseEntries.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="py-1">{row.name}</td>
                  <td className="py-1">{formatDisplayDate(row.date)}</td>
                  <td className="py-1 text-right">{formatEuro(row.amount_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {reportData?.bankSummary && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2">{l.bankSummary ?? 'Bank summary'}</h2>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b">
                <td className="py-1 pr-4 text-left">{l.bankSummaryStart ?? 'Balance at start of period'}</td>
                <td className="py-1 text-right">{formatEuro(reportData.bankSummary.startBalanceCents ?? 0)}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-left">{l.bankSummaryEnd ?? 'Balance at end of period'}</td>
                <td className="py-1 text-right">{formatEuro(reportData.bankSummary.endBalanceCents ?? 0)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}
      {reportData?.bankTransactions?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2">{l.bankTransactions ?? 'Bank transactions'}</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">{l.date ?? 'Date'}</th>
                <th className="text-left py-1">{l.note ?? 'Note'}</th>
                <th className="text-right py-1">{l.type ?? 'Type'}</th>
                <th className="text-right py-1">{l.amount ?? 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.bankTransactions.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="py-1">{formatDisplayDate(row.date)}</td>
                  <td className="py-1">{row.note || '—'}</td>
                  <td className="py-1 text-right">{row.type}</td>
                  <td className="py-1 text-right">{row.type === 'deposit' ? '+' : '−'}{formatEuro(row.amount_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {reportData?.volunteerHoursSummary && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2">{l.volunteerHoursSummary ?? 'Volunteer hours summary'}</h2>
          <p className="text-xs">{l.totalHoursInRange ?? `Total hours in range: ${reportData.volunteerHoursSummary.totalHours.toFixed(1)} h`}</p>
        </section>
      )}
      {reportData?.hoursByVolunteer?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2">{l.hoursByVolunteer ?? 'Hours by volunteer'}</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">{l.volunteer ?? 'Volunteer'}</th>
                <th className="text-right py-1">{l.hours ?? 'Hours'}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.hoursByVolunteer.map((row) => (
                <tr key={row.name} className="border-b">
                  <td className="py-1">{row.name}</td>
                  <td className="py-1 text-right">{row.hours.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

const ExportOverlay = ({ onClose, context }) => {
  const { t } = useTranslation();
  const { currentOrgId, orgs } = useOrg();
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(lastDayOfMonth());
  const [sections, setSections] = useState(() => {
    const keys = SECTION_KEYS[context] || [];
    return keys.reduce((acc, k) => ({ ...acc, [k]: true }), {});
  });
  const [reportData, setReportData] = useState(null);
  const [sectionModes, setSectionModes] = useState(() => {
    const keys = SECTION_KEYS[context] || [];
    return keys.reduce((acc, k) => {
      if (k === 'incomeEntries' || k === 'expenseEntries' || k === 'bankTransactions' || k === 'hoursByVolunteer') {
        return { ...acc, [k]: 'entries' };
      }
      return acc;
    }, {});
  });
  const [generating, setGenerating] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => setReportData(null)
  });

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSectionMode = (key, mode) => {
    setSectionModes((prev) => ({ ...prev, [key]: mode }));
  };

  const fetchReportData = useCallback(async () => {
    if (!currentOrgId) return null;
    const orgName = orgs.find((o) => o.id === currentOrgId)?.name || 'Organisation';

    const data = {};

    if (sections.incomeSummary || sections.incomeEntries) {
      const { data: rows } = await supabase
        .from('income_entries')
        .select('id, name, date, amount_cents')
        .eq('org_id', currentOrgId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false });
      const list = rows ?? [];
      if (sections.incomeSummary) {
        const totalIncomeCents = list.reduce((s, r) => s + (r.amount_cents || 0), 0);
        data.incomeSummary = { totalIncomeCents };
      }
      const mode = sectionModes.incomeEntries || 'entries';
      if (mode === 'month') {
        const byMonth = new Map();
        for (const row of list) {
          if (!row.date || row.amount_cents == null) continue;
          const key = row.date.slice(0, 7); // YYYY-MM
          const prev = byMonth.get(key) ?? 0;
          byMonth.set(key, prev + row.amount_cents);
        }
        data.incomeEntries = Array.from(byMonth.entries()).map(([month, amount_cents]) => ({
          id: month,
          name: month,
          date: month,
          amount_cents
        }));
      } else if (mode === 'item') {
        const byName = new Map();
        for (const row of list) {
          if (!row.name || row.amount_cents == null) continue;
          const prev = byName.get(row.name) ?? 0;
          byName.set(row.name, prev + row.amount_cents);
        }
        data.incomeEntries = Array.from(byName.entries()).map(([name, amount_cents]) => ({
          id: name,
          name,
          date: '',
          amount_cents
        }));
      } else {
        data.incomeEntries = list;
      }
    }
    if (sections.expenseSummary || sections.expenseEntries) {
      const { data: rows } = await supabase
        .from('expense_entries')
        .select('id, name, date, amount_cents')
        .eq('org_id', currentOrgId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false });
      const list = rows ?? [];
      if (sections.expenseSummary) {
        const totalExpenseCents = list.reduce((s, r) => s + (r.amount_cents || 0), 0);
        data.expenseSummary = { totalExpenseCents };
      }
      const mode = sectionModes.expenseEntries || 'entries';
      if (mode === 'month') {
        const byMonth = new Map();
        for (const row of list) {
          if (!row.date || row.amount_cents == null) continue;
          const key = row.date.slice(0, 7); // YYYY-MM
          const prev = byMonth.get(key) ?? 0;
          byMonth.set(key, prev + row.amount_cents);
        }
        data.expenseEntries = Array.from(byMonth.entries()).map(([month, amount_cents]) => ({
          id: month,
          name: month,
          date: month,
          amount_cents
        }));
      } else if (mode === 'item') {
        const byName = new Map();
        for (const row of list) {
          if (!row.name || row.amount_cents == null) continue;
          const prev = byName.get(row.name) ?? 0;
          byName.set(row.name, prev + row.amount_cents);
        }
        data.expenseEntries = Array.from(byName.entries()).map(([name, amount_cents]) => ({
          id: name,
          name,
          date: '',
          amount_cents
        }));
      } else {
        data.expenseEntries = list;
      }
    }
    if (sections.bankSummary || sections.bankTransactions) {
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('id, opening_balance_cents')
        .eq('org_id', currentOrgId)
        .limit(1);
      const active = accounts?.[0] ?? null;
      if (active) {
        const { data: allTx } = await supabase
          .from('bank_transactions')
          .select('date, amount_cents, type')
          .eq('org_id', currentOrgId)
          .lte('date', dateTo);
        const txList = allTx ?? [];
        const beforeRange = txList.filter((tx) => tx.date < dateFrom);
        const inRange = txList.filter((tx) => tx.date >= dateFrom && tx.date <= dateTo);
        const sum = (rows) =>
          rows.reduce(
            (acc, tx) =>
              tx.type === 'deposit'
                ? acc + (tx.amount_cents || 0)
                : acc - (tx.amount_cents || 0),
            0
          );
        const deltaBefore = sum(beforeRange);
        const deltaInRange = sum(inRange);
        const startBalanceCents = (active.opening_balance_cents || 0) + deltaBefore;
        const endBalanceCents = startBalanceCents + deltaInRange;
        if (sections.bankSummary) {
          data.bankSummary = { startBalanceCents, endBalanceCents };
        }
      }
    }
    if (sections.bankTransactions) {
      const { data: rows } = await supabase
        .from('bank_transactions')
        .select('id, date, note, amount_cents, type')
        .eq('org_id', currentOrgId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false });
      const list = rows ?? [];
      const mode = sectionModes.bankTransactions || 'entries';
      if (mode === 'month') {
        const byMonth = new Map();
        for (const row of list) {
          if (!row.date || row.amount_cents == null) continue;
          const key = row.date.slice(0, 7); // YYYY-MM
          const prev = byMonth.get(key) ?? 0;
          byMonth.set(key, prev + row.amount_cents);
        }
        data.bankTransactions = Array.from(byMonth.entries()).map(([month, amount_cents]) => ({
          id: month,
          date: month,
          note: month,
          amount_cents,
          type: ''
        }));
      } else if (mode === 'item') {
        const byNote = new Map();
        for (const row of list) {
          if (row.amount_cents == null) continue;
          const key = row.note || '';
          const prev = byNote.get(key) ?? 0;
          byNote.set(key, prev + row.amount_cents);
        }
        data.bankTransactions = Array.from(byNote.entries()).map(([note, amount_cents]) => ({
          id: note || 'note-blank',
          date: '',
          note: note || '—',
          amount_cents,
          type: ''
        }));
      } else {
        data.bankTransactions = list;
      }
    }
    if (sections.volunteerHoursSummary || sections.hoursByVolunteer) {
      const { data: rows } = await supabase
        .from('volunteer_hours')
        .select('hours, volunteer_id, volunteers ( name )')
        .eq('org_id', currentOrgId)
        .gte('date', dateFrom)
        .lte('date', dateTo);
      const list = rows ?? [];
      const totalHours = list.reduce((s, r) => s + Number(r.hours || 0), 0);
      const byVolunteer = {};
      list.forEach((r) => {
        const name = r.volunteers?.name ?? 'Unknown';
        byVolunteer[name] = (byVolunteer[name] || 0) + Number(r.hours || 0);
      });
      if (sections.volunteerHoursSummary) {
        data.volunteerHoursSummary = { totalHours };
      }
      if (sections.hoursByVolunteer) {
        const mode = sectionModes.hoursByVolunteer || 'entries';
        if (mode === 'month') {
          const byMonth = new Map();
          for (const r of list) {
            if (!r.date || r.hours == null) continue;
            const key = r.date.slice(0, 7); // YYYY-MM
            const prev = byMonth.get(key) ?? 0;
            byMonth.set(key, prev + Number(r.hours || 0));
          }
          data.hoursByVolunteer = Array.from(byMonth.entries()).map(([month, hours]) => ({
            name: month,
            hours
          }));
        } else {
          data.hoursByVolunteer = Object.entries(byVolunteer).map(([name, hours]) => ({ name, hours }));
        }
      }
    }

    return { orgName, dateFrom, dateTo, generatedAt: getLocalDateString() + ' ' + new Date().toTimeString().slice(0, 5), reportData: data };
  }, [currentOrgId, orgs, dateFrom, dateTo, sections, sectionModes]);

  const onGeneratePdf = async () => {
    setGenerating(true);
    try {
      const payload = await fetchReportData();
      if (payload) {
        const labels = {
          incomeEntries: t('exportOverlay.sections.incomeEntries'),
          expenseEntries: t('exportOverlay.sections.expenseEntries'),
          incomeSummary: t('exportOverlay.sections.incomeSummary'),
          expenseSummary: t('exportOverlay.sections.expenseSummary'),
          bankTransactions: t('exportOverlay.sections.bankTransactions'),
          bankSummary: t('exportOverlay.sections.bankSummary'),
          volunteerHoursSummary: t('exportOverlay.sections.volunteerHoursSummary'),
          hoursByVolunteer: t('exportOverlay.sections.hoursByVolunteer'),
          name: t('exportPdf.name'),
          date: t('exportPdf.date'),
          amount: t('exportPdf.amount'),
          note: t('exportPdf.note'),
          type: t('exportPdf.type'),
          volunteer: t('exportPdf.volunteer'),
          hours: t('exportPdf.hours'),
          generated: t('exportPdf.generated'),
          reportSubtitle: t('exportPdf.reportSubtitle', { from: dateFrom, to: dateTo }),
          totalHoursInRange: payload.reportData?.volunteerHoursSummary
            ? t('exportPdf.totalHoursInRange', { hours: payload.reportData.volunteerHoursSummary.totalHours.toFixed(1) })
            : t('exportPdf.totalHoursInRange', { hours: '0' })
        };
        setReportData({ ...payload, labels });
        setTimeout(() => {
          handlePrint();
        }, 300);
      }
    } finally {
      setGenerating(false);
    }
  };

  const onSendEmail = async () => {
    setSendStatus(null);
    if (!email.trim()) {
      setSendStatus(t('exportOverlay.emailMissing') || 'Email is required');
      return;
    }
    setSending(true);
    try {
      const payload = await fetchReportData();
      if (!payload) {
        setSendStatus(t('exportOverlay.emailNoData') || 'Could not build report data');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined;
      const { error } = await supabase.functions.invoke('send-report-email', {
        body: { to: email.trim(), payload },
        ...(headers && { headers })
      });
      if (error) {
        setSendStatus(error.message || 'Could not send email');
      } else {
        setSendStatus('sent');
      }
    } catch (e) {
      setSendStatus(e?.message || 'Could not send email');
    } finally {
      setSending(false);
    }
  };

  const sectionKeys = SECTION_KEYS[context] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" aria-hidden onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg max-h-[85vh] overflow-y-auto"
        role="dialog"
        aria-label={t('exportOverlay.title')}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('exportOverlay.title')}</h2>
          <button
            type="button"
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
            onClick={onClose}
            aria-label={t('exportOverlay.close')}
          >
            {t('exportOverlay.close')}
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex gap-2 items-center">
            <label className="text-sm">{t('exportOverlay.dateFrom')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              data-testid="export-date-from"
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm">{t('exportOverlay.dateTo')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              data-testid="export-date-to"
            />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {sectionKeys.map((key) => (
            <div key={key} className="flex items-center justify-between gap-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sections[key] !== false}
                  onChange={() => toggleSection(key)}
                  data-testid={`export-section-${key}`}
                />
                {t(`exportOverlay.sections.${key}`)}
              </label>
              {(key === 'incomeEntries' || key === 'expenseEntries' || key === 'bankTransactions' || key === 'hoursByVolunteer') && sections[key] !== false && (
                <select
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                  value={sectionModes[key] || 'entries'}
                  onChange={(e) => updateSectionMode(key, e.target.value)}
                >
                  <option value="entries">{t('exportOverlay.mode.entries')}</option>
                  <option value="month">{t('exportOverlay.mode.month')}</option>
                  <option value="item">
                    {key === 'hoursByVolunteer'
                      ? t('exportOverlay.mode.byVolunteer')
                      : t('exportOverlay.mode.item')}
                  </option>
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              onClick={onGeneratePdf}
              disabled={generating}
              data-testid="export-generate-pdf-btn"
            >
              {t('exportOverlay.generatePdf')}
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('exportOverlay.emailPlaceholder')}
                className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
              />
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                onClick={onSendEmail}
                disabled={sending}
              >
                {t('exportOverlay.sendEmail')}
              </button>
            </div>
            {sendStatus === 'sent' && (
              <p className="text-xs text-emerald-600">{t('exportOverlay.emailSent')}</p>
            )}
            {sendStatus && sendStatus !== 'sent' && (
              <p className="text-xs text-rose-600">{sendStatus}</p>
            )}
          </div>
        </div>

        <div className="fixed -left-[9999px] top-0 w-[210mm]" aria-hidden>
          <div ref={printRef}>
            {reportData && (
              <PrintReport
                orgName={reportData.orgName}
                dateFrom={reportData.dateFrom}
                dateTo={reportData.dateTo}
                generatedAt={reportData.generatedAt}
                reportData={reportData.reportData}
                labels={reportData.labels}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportOverlay;
