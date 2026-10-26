import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ConstellationPoint } from '../types';

interface Props {
  samples: ConstellationPoint[];
  modulation?: string;
  snr_db?: number;
}

const ConstellationTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded border border-slate-700 bg-slate-950/95 p-2 text-xs text-slate-200">
        <p className="font-semibold text-blue-400">{d.type} Symbol</p>
        <p>I: {d.x.toFixed(3)}</p>
        <p>Q: {d.y.toFixed(3)}</p>
      </div>
    );
  }
  return null;
};

export const ConstellationChart: React.FC<Props> = ({
  samples,
  modulation = 'BPSK',
  snr_db = 10,
}) => {
  if (!samples || samples.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
        Run a single simulation to render I/Q constellation diagram.
      </div>
    );
  }

  // Sample points for received noisy/equalized symbols
  const rxPoints = samples.map((s, idx) => ({
    x: s.rx_i,
    y: s.rx_q,
    id: idx,
    type: 'Received',
  }));

  // Ideal transmitted constellation symbols
  const idealPoints = Array.from(
    new Set(samples.map((s) => `${s.tx_i},${s.tx_q}`))
  ).map((str) => {
    const [x, y] = str.split(',').map(Number);
    return { x, y, type: 'Ideal' };
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-100">I/Q Constellation Diagram</h3>
          <p className="text-xs text-slate-400">
            {modulation} | In-Phase (I) vs Quadrature (Q) at SNR {snr_db} dB
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 opacity-80" />
            Rx (Equalized)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-amber-500/40" />
            Tx (Ideal)
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              type="number"
              dataKey="x"
              name="In-Phase (I)"
              domain={[-2.2, 2.2]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'In-Phase (I)', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Quadrature (Q)"
              domain={[-2.2, 2.2]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Quadrature (Q)', angle: -90, position: 'insideLeft', offset: 5, fill: '#94a3b8', fontSize: 11 }}
            />
            <ReferenceLine x={0} stroke="#334155" strokeWidth={1.5} />
            <ReferenceLine y={0} stroke="#334155" strokeWidth={1.5} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={<ConstellationTooltip />}
            />
            {/* Received symbols cloud */}
            <Scatter name="Received" data={rxPoints} fill="#3b82f6" opacity={0.65} />
            {/* Ideal constellation markers */}
            <Scatter name="Ideal" data={idealPoints} fill="#f59e0b" shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
