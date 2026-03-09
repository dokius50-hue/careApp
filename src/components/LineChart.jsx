import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const CurrencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const [{ value }] = payload;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow">
      <div className="font-medium">{label}</div>
      <div className="text-slate-700">€{(value / 100).toFixed(2)}</div>
    </div>
  );
};

const LineChart = ({ data }) => {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return <p className="text-xs text-slate-500">{t('common.noDataYet')}</p>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `€${(v / 100).toFixed(0)}`}
            width={40}
          />
          <Tooltip content={<CurrencyTooltip />} />
          <Line
            type="monotone"
            dataKey="amountCents"
            stroke="#0f172a"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;

