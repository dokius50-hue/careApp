import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { useOrg } from '../context/OrgContext.jsx';
import { supabase } from '../lib/supabase.js';
import { formatEuro } from '../lib/money.js';
import { getLocalDateString } from '../lib/dates.js';

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
  incomeExpenses: ['incomeEntries', 'expenseEntries'],
  bank: ['bankTransactions'],
  volunteers: ['volunteerHoursSummary', 'hoursByVolunteer']
};

const PrintReport = ({ orgName, dateFrom, dateTo, generatedAt, reportData, labels }) => {
  const l = labels || {};
  return (
    <div className="bg-white p-6 text-black" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'sans-serif' }}>
      <header className="border-b pb-2 mb-4">
        <h1 className="text-lg font-bold">{orgName}</h1>
        <p className="text-sm text-slate-600">{l.reportSubtitle?.replace('{{from}}', dateFrom).replace('{{to}}', dateTo) ?? `Export Report — ${dateFrom} to ${dateTo}`}</p>
        <p className="text-xs text-slate-500">{l.generated ?? 'Generated'}: {generatedAt}</p>
      </header>
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
                  <td className="py-1">{row.date}</td>
                  <td className="py-1 text-right">{formatEuro(row.amount_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <td className="py-1">{row.date}</td>
                  <td className="py-1 text-right">{formatEuro(row.amount_cents)}</td>
                </tr>
              ))}
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
                  <td className="py-1">{row.date}</td>
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
  const [generating, setGenerating] = useState(false);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => setReportData(null)
  });

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchReportData = useCallback(async () => {
    if (!currentOrgId) return null;
    const orgName = orgs.find((o) => o.id === currentOrgId)?.name || 'Organisation';

    const data = {};

    if (sections.incomeEntries) {
      const { data: rows } = await supabase
        .from('income_entries')
        .select('id, name, date, amount_cents')
        .eq('org_id', currentOrgId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false });
      data.incomeEntries = rows ?? [];
    }
    if (sections.expenseEntries) {
      const { data: rows } = await supabase
        .from('expense_entries')
        .select('id, name, date, amount_cents')
        .eq('org_id', currentOrgId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false });
      data.expenseEntries = rows ?? [];
    }
    if (sections.bankTransactions) {
      const { data: rows } = await supabase
        .from('bank_transactions')
        .select('id, date, note, amount_cents, type')
        .eq('org_id', currentOrgId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false });
      data.bankTransactions = rows ?? [];
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
        data.hoursByVolunteer = Object.entries(byVolunteer).map(([name, hours]) => ({ name, hours }));
      }
    }

    return { orgName, dateFrom, dateTo, generatedAt: getLocalDateString() + ' ' + new Date().toTimeString().slice(0, 5), reportData: data };
  }, [currentOrgId, orgs, dateFrom, dateTo, sections]);

  const onGeneratePdf = async () => {
    setGenerating(true);
    try {
      const payload = await fetchReportData();
      if (payload) {
        const labels = {
          incomeEntries: t('exportOverlay.sections.incomeEntries'),
          expenseEntries: t('exportOverlay.sections.expenseEntries'),
          bankTransactions: t('exportOverlay.sections.bankTransactions'),
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

        <div className="space-y-2 mb-4">
          {sectionKeys.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={sections[key] !== false}
                onChange={() => toggleSection(key)}
                data-testid={`export-section-${key}`}
              />
              {t(`exportOverlay.sections.${key}`)}
            </label>
          ))}
        </div>

        <button
          type="button"
          className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          onClick={onGeneratePdf}
          disabled={generating}
          data-testid="export-generate-pdf-btn"
        >
          {t('exportOverlay.generatePdf')}
        </button>

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
