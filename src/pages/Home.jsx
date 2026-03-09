import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrg } from '../context/OrgContext.jsx';
import LineChart from '../components/LineChart.jsx';
import CreateOrgModal from '../components/CreateOrgModal.jsx';
import { getRevenueChartData, getTopVolunteersLast90Days } from '../lib/chartData.js';
import { getLocalDateString } from '../lib/dates.js';

const HomePage = () => {
  const { t } = useTranslation();
  const { orgs, currentOrgId, setCurrentOrgId, refetchOrgs } = useOrg();
  const [chartData, setChartData] = useState([]);
  const [topVolunteers, setTopVolunteers] = useState([]);
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  const currentOrg = orgs.find((o) => o.id === currentOrgId);

  useEffect(() => {
    if (!currentOrgId) return;

    const load = async () => {
      const [revenue, top] = await Promise.all([
        getRevenueChartData(currentOrgId),
        getTopVolunteersLast90Days(currentOrgId)
      ]);
      setChartData(revenue);
      setTopVolunteers(top);
    };

    void load();
  }, [currentOrgId]);

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

      <section className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">{t('home.today')}</p>
        <p className="text-3xl font-semibold">{getLocalDateString()}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-slate-700">{t('home.revenueChart')}</h2>
        <LineChart data={chartData} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-slate-700">{t('home.topVolunteers')}</h2>
        {topVolunteers.length === 0 ? (
          <p className="text-xs text-slate-500">{t('home.noVolunteerHours')}</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl bg-white shadow-sm">
            {topVolunteers.map((v) => (
              <li key={v.name} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{v.name}</span>
                <span className="font-medium">{v.hours.toFixed(1)} h</span>
              </li>
            ))}
          </ul>
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
    </div>
  );
};

export default HomePage;

