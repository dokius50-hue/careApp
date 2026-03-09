import { supabase } from './supabase.js';
import { getDateNDaysAgo, getNinetyDaysAgo } from './dates.js';

export const getRevenueChartData = async (orgId) => {
  const since = getDateNDaysAgo(120);

  const { data, error } = await supabase
    .from('income_entries')
    .select('date, amount_cents')
    .eq('org_id', orgId)
    .gte('date', since)
    .order('date', { ascending: true });

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error('Error loading income_entries for chart', error);
    return [];
  }

  const byDate = new Map();
  for (const row of data) {
    if (!row.date || row.amount_cents == null) continue;
    const prev = byDate.get(row.date) ?? 0;
    byDate.set(row.date, prev + row.amount_cents);
  }

  const points = Array.from(byDate.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, amountCents]) => ({ date, amountCents }));

  return points.slice(-20);
};

export const getTopVolunteersLast90Days = async (orgId) => {
  const since = getNinetyDaysAgo();

  const { data, error } = await supabase
    .from('volunteer_hours')
    .select('hours, date, volunteer_id, volunteers ( id, name )')
    .eq('org_id', orgId)
    .gte('date', since);

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error('Error loading volunteer_hours', error);
    return [];
  }

  const totals = new Map();

  for (const row of data) {
    if (!row.volunteer_id || row.hours == null) continue;
    const name = row.volunteers?.name ?? 'Unknown';
    const prev = totals.get(row.volunteer_id) ?? { name, hours: 0 };
    totals.set(row.volunteer_id, { name, hours: prev.hours + Number(row.hours) });
  }

  return Array.from(totals.values())
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);
};

/** Last 5 complete Monday-based weeks: returns [{ weekLabel, hours }] */
export const getVolunteerHoursPerWeekChartData = async (orgId) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysSinceMonday);
  lastMonday.setHours(0, 0, 0, 0);

  const weekLabels = [];
  const weekStarts = [];
  for (let i = 5; i >= 1; i--) {
    const start = new Date(lastMonday);
    start.setDate(lastMonday.getDate() - 7 * i);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    weekStarts.push({ start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) });
    weekLabels.push(`W ${start.getDate()}/${start.getMonth() + 1}`);
  }

  const since = weekStarts[0].start;

  const { data, error } = await supabase
    .from('volunteer_hours')
    .select('date, hours')
    .eq('org_id', orgId)
    .gte('date', since);

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error('Error loading volunteer_hours for weekly chart', error);
    return weekLabels.map((weekLabel) => ({ weekLabel, hours: 0 }));
  }

  const byWeekIndex = weekStarts.map(() => 0);
  for (const row of data) {
    if (!row.date || row.hours == null) continue;
    const idx = weekStarts.findIndex(
      (w) => row.date >= w.start && row.date < w.end
    );
    if (idx >= 0) byWeekIndex[idx] += Number(row.hours);
  }

  return weekLabels.map((weekLabel, i) => ({ weekLabel, hours: byWeekIndex[i] }));
};

