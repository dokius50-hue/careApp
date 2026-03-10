import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrg } from '../context/OrgContext.jsx';
import { supabase } from '../lib/supabase.js';
import ExportOverlay from '../components/ExportOverlay.jsx';
import FormModal, { formModalClasses as fm } from '../components/FormModal.jsx';
import { formatDisplayDate, formatDateDMonYYYY, getLocalDateString, parseDisplayDateToIso } from '../lib/dates.js';

const VolunteersPage = () => {
  const { t } = useTranslation();
  const { currentOrgId } = useOrg();
  const [volunteers, setVolunteers] = useState([]);
  const [hoursList, setHoursList] = useState([]);
  const [showAddHours, setShowAddHours] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [newVolunteerName, setNewVolunteerName] = useState('');
  const [editingHours, setEditingHours] = useState(null);

  const loadData = async () => {
    if (!currentOrgId) return;

    const [volRes, hoursRes] = await Promise.all([
      supabase
        .from('volunteers')
        .select('id, name')
        .eq('org_id', currentOrgId)
        .order('name'),
      supabase
        .from('volunteer_hours')
        .select('id, volunteer_id, date, hours, volunteers ( id, name )')
        .eq('org_id', currentOrgId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
    ]);

    setVolunteers(volRes.data ?? []);
    setHoursList(hoursRes.data ?? []);
  };

  useEffect(() => {
    void loadData();
  }, [currentOrgId]);

  const handleAddHours = async (e) => {
    e.preventDefault();
    const form = e.target;
    const volunteerId = form.volunteer_id.value;
    const date = parseDisplayDateToIso(form.date.value);
    const hours = parseFloat(form.hours.value);
    if (!volunteerId || !currentOrgId || Number.isNaN(hours) || hours <= 0) return;
    await supabase.from('volunteer_hours').insert({
      org_id: currentOrgId,
      volunteer_id: volunteerId,
      date,
      hours
    });
    setShowAddHours(false);
    void loadData();
  };

  const handleUpdateHours = async (e) => {
    e.preventDefault();
    if (!editingHours?.id) return;
    const form = e.target;
    const volunteerId = form.volunteer_id.value;
    const date = parseDisplayDateToIso(form.date.value);
    const hours = parseFloat(form.hours.value);
    if (!volunteerId || Number.isNaN(hours) || hours <= 0) return;
    await supabase.from('volunteer_hours').update({ volunteer_id: volunteerId, date, hours }).eq('id', editingHours.id);
    setEditingHours(null);
    void loadData();
  };

  const handleDeleteHours = async () => {
    if (!editingHours?.id) return;
    await supabase.from('volunteer_hours').delete().eq('id', editingHours.id);
    setEditingHours(null);
    void loadData();
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    const name = newVolunteerName.trim();
    if (!name || !currentOrgId) return;
    await supabase.from('volunteers').insert({ org_id: currentOrgId, name });
    setNewVolunteerName('');
    void loadData();
  };

  const handleMarkInactive = async (volunteerId) => {
    await supabase.from('volunteers').update({ deleted_at: new Date().toISOString() }).eq('id', volunteerId);
    void loadData();
  };

  const groupedByDate = hoursList.reduce((acc, row) => {
    const d = row.date || '';
    if (!acc[d]) acc[d] = [];
    acc[d].push(row);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => (b > a ? 1 : -1));
  const totalHours = hoursList.reduce((s, row) => s + (Number(row.hours) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300"
          onClick={() => setShowExport(true)}
          data-testid="volunteers-export-btn"
        >
          {t('volunteers.export')}
        </button>
      </div>

      <section className="rounded-xl bg-slate-900 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-300">{t('volunteers.totalHoursLogged')}</p>
        <p className="mt-1 text-2xl font-semibold" data-testid="volunteers-total-hours">{Math.round(totalHours)} h</p>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => setShowAddHours(true)}
          data-testid="volunteers-add-hours-btn"
        >
          {t('volunteers.addHours')}
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => setShowManage(true)}
          data-testid="volunteers-manage-btn"
        >
          {t('volunteers.manageVolunteers')}
        </button>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-slate-700">{t('volunteers.hoursHistory')}</h2>
        {sortedDates.length === 0 ? (
          <p className="text-xs text-slate-500">{t('volunteers.noHours')}</p>
        ) : (
          <ul className="space-y-4">
            {sortedDates.map((date) => (
              <li key={date}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{formatDisplayDate(date)}</p>
                <ul className="mt-1 space-y-1 rounded-lg bg-white p-2 shadow-sm">
                  {(groupedByDate[date] || []).map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => setEditingHours(row)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
                        data-testid="volunteer-hours-entry"
                      >
                        <span className="font-medium">{row.volunteers?.name ?? '—'}</span>
                        <span className="text-slate-600">{Number(row.hours).toFixed(1)} h</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showAddHours && (
        <FormModal open onClose={() => setShowAddHours(false)} title={t('volunteers.addHours')}>
          <form onSubmit={handleAddHours} className="space-y-3">
            <label className={fm.label}>
              {t('volunteers.volunteer')}
              <select name="volunteer_id" className={`mt-1 ${fm.select}`} required data-testid="add-hours-volunteer-select">
                <option value="">—</option>
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </label>
            <label className={fm.label}>
              {t('volunteers.date')}
              <input type="text" name="date" defaultValue={formatDateDMonYYYY(getLocalDateString())} className={`mt-1 ${fm.input}`} placeholder="e.g. 10 Mar 2025" />
            </label>
            <label className={fm.label}>
              {t('volunteers.hours')}
              <input type="number" name="hours" step="any" min="0" placeholder="0.0" className={`mt-1 ${fm.input}`} required />
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" className={fm.btnSecondary} onClick={() => setShowAddHours(false)}>
                {t('volunteers.cancel')}
              </button>
              <button type="submit" className={fm.btnPrimarySlate}>
                {t('volunteers.save')}
              </button>
            </div>
          </form>
        </FormModal>
      )}

      {showManage && (
        <FormModal open onClose={() => setShowManage(false)} title={t('volunteers.manageVolunteers')}>
          <form onSubmit={handleAddVolunteer} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newVolunteerName}
              onChange={(e) => setNewVolunteerName(e.target.value)}
              placeholder={t('volunteers.name')}
              className={`flex-1 ${fm.input}`}
              data-testid="manage-volunteer-name-input"
            />
            <button type="submit" className={fm.btnPrimarySlate} data-testid="manage-volunteer-add-btn">
              {t('volunteers.addNew')}
            </button>
          </form>
          {volunteers.length === 0 ? (
            <p className="text-xs text-slate-500">{t('volunteers.noVolunteers')}</p>
          ) : (
            <ul className="space-y-2">
              {volunteers.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span>{v.name}</span>
                  <button
                    type="button"
                    className="text-xs text-rose-600 hover:underline"
                    onClick={() => handleMarkInactive(v.id)}
                    data-testid="volunteer-mark-inactive"
                  >
                    {t('volunteers.markInactive')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <button type="button" className={`w-full ${fm.btnSecondary}`} onClick={() => setShowManage(false)}>
              {t('volunteers.cancel')}
            </button>
          </div>
        </FormModal>
      )}

      {editingHours && (
        <FormModal open onClose={() => setEditingHours(null)} title={t('volunteers.editHours')}>
          <form onSubmit={handleUpdateHours} className="space-y-3">
            <label className={fm.label}>
              {t('volunteers.volunteer')}
              <select name="volunteer_id" defaultValue={editingHours.volunteer_id} className={`mt-1 ${fm.select}`} required data-testid="edit-hours-volunteer-select">
                <option value="">—</option>
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </label>
            <label className={fm.label}>
              {t('volunteers.date')}
              <input type="text" name="date" defaultValue={formatDateDMonYYYY(editingHours.date)} className={`mt-1 ${fm.input}`} placeholder="e.g. 10 Mar 2025" />
            </label>
            <label className={fm.label}>
              {t('volunteers.hours')}
              <input type="number" name="hours" step="any" min="0" defaultValue={Number(editingHours.hours)} placeholder="0.0" className={`mt-1 ${fm.input}`} required />
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" className={fm.btnSecondary} onClick={() => setEditingHours(null)}>
                {t('volunteers.cancel')}
              </button>
              <button
                type="button"
                className={fm.btnDanger}
                onClick={handleDeleteHours}
                data-testid="volunteers-delete-hours-btn"
              >
                {t('common.delete')}
              </button>
              <button type="submit" className={fm.btnPrimarySlate}>
                {t('volunteers.save')}
              </button>
            </div>
          </form>
        </FormModal>
      )}

      {showExport && <ExportOverlay onClose={() => setShowExport(false)} context="volunteers" />}
    </div>
  );
};

export default VolunteersPage;
