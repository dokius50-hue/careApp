import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const HoursTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const [{ value }] = payload;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow">
      <div className="font-medium">{label}</div>
      <div className="text-slate-700">{Number(value).toFixed(1)} h</div>
    </div>
  );
};

const HoursBarChart = ({ data }) => {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return <p className="text-xs text-slate-500">{t('common.noDataYet')}</p>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <XAxis dataKey="weekLabel" tick={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `${v}h`}
            width={28}
          />
          <Tooltip content={<HoursTooltip />} />
          <Bar dataKey="hours" fill="#0f172a" isAnimationActive={false} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HoursBarChart;
