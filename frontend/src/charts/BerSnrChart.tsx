import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BatchPoint } from '../types';

interface Props {
  data: BatchPoint[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-3 text-xs shadow-xl backdrop-blur-md">
        <p className="font-semibold text-blue-400">SNR: {label} dB</p>
        <div className="mt-1 space-y-1">
          <p className="text-emerald-400">
            Simulated BER:{' '}
            <span className="font-mono font-medium">
              {p.rawSimBer === 0 ? '0 (No errors)' : p.rawSimBer.toExponential(4)}
            </span>
          </p>
          <p className="text-sky-300">
            Theoretical BER:{' '}
            <span className="font-mono font-medium">{p.rawTheoBer.toExponential(4)}</span>
          </p>
          <p className="text-slate-400">
            Bit Errors: {p.errors} / {p.total}
          </p>
          <p className="text-slate-400">Throughput: {p.throughput} kbps</p>
        </div>
      </div>
    );
  }
  return null;
};

export const BerSnrChart: React.FC<Props> = ({
  data,
  title = 'Bit Error Rate (BER) vs SNR',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
        No batch simulation data available. Run a simulation sweep to populate the curve.
      </div>
    );
  }

  // Format chart data with safe log scale (floor zero BER to 1e-6 for log rendering)
  const chartData = data.map((d) => ({
    snr: d.snr_db,
    simulatedBer: d.ber > 0 ? d.ber : 1e-6,
    theoreticalBer: d.theoretical_ber > 0 ? d.theoretical_ber : 1e-6,
    rawSimBer: d.ber,
    rawTheoBer: d.theoretical_ber,
    errors: d.bit_errors,
    total: d.total_bits,
    throughput: d.effective_throughput_kbps,
  }));

  const formatYAxis = (val: number) => {
    if (val >= 1) return '1.0';
    if (val <= 1e-6) return '0';
    return `10^${Math.round(Math.log10(val))}`;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400">
            Logarithmic BER comparison against exact theoretical benchmark
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Simulated
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Theoretical
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="snr"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Signal-to-Noise Ratio (SNR) [dB]', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              scale="log"
              domain={[1e-5, 0.5]}
              stroke="#64748b"
              fontSize={11}
              tickFormatter={formatYAxis}
              tickLine={false}
              label={{ value: 'Bit Error Rate (BER)', angle: -90, position: 'insideLeft', offset: 5, fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Line
              type="monotone"
              dataKey="simulatedBer"
              name="Simulated BER"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#10b981', stroke: '#064e3b', strokeWidth: 1 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="theoreticalBer"
              name="Theoretical BER"
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
