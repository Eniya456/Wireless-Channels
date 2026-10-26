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

interface Props {
  currentDistance?: number;
  currentPower?: number;
}

const PathLossTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/95 p-2.5 text-xs text-slate-200">
        <p className="font-semibold text-blue-400">Distance: {label} m</p>
        <p className="text-emerald-400">Free Space (n = 2.0): {payload[0]?.value} dBm</p>
        <p className="text-sky-400">Urban (n = 3.0): {payload[1]?.value} dBm</p>
        <p className="text-purple-400">Dense Urban (n = 4.0): {payload[2]?.value} dBm</p>
      </div>
    );
  }
  return null;
};

export const PathLossChart: React.FC<Props> = ({
  currentDistance = 50,
  currentPower = -45,
}) => {
  // Generate distances from 5m to 500m
  const distances = [5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500];
  const d0 = 50;
  const pTx = 20.0; // 20 dBm (100 mW)
  const pl0 = 38.0;

  const data = distances.map((d) => {
    // PL(d) = PL(d0) + 10 * n * log10(d / d0)
    const relRatio = Math.max(d, 1.0) / d0;
    const logRatio = Math.log10(relRatio);

    const pl_n2 = pl0 + 10 * 2.0 * logRatio;
    const pl_n3 = pl0 + 10 * 3.0 * logRatio;
    const pl_n4 = pl0 + 10 * 4.0 * logRatio;

    return {
      distance: d,
      pRx_n2: Math.round((pTx - pl_n2) * 10) / 10,
      pRx_n3: Math.round((pTx - pl_n3) * 10) / 10,
      pRx_n4: Math.round((pTx - pl_n4) * 10) / 10,
    };
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-100">Received Power vs Distance</h3>
          <p className="text-xs text-slate-400">
            Log-Distance Path Loss Model: P_rx = P_tx - [PL(d_0) + 10·n·log10(d/d_0)]
          </p>
        </div>
        {currentDistance && currentPower && (
          <div className="rounded-md border border-blue-900/50 bg-blue-950/40 px-3 py-1 text-xs text-blue-300">
            Active: <span className="font-mono font-bold text-white">{currentDistance} m</span> →{' '}
            <span className="font-mono font-bold text-emerald-400">{currentPower} dBm</span>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="distance"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Distance (d) [meters]', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={[-90, 0]}
              label={{ value: 'Received Power (P_rx) [dBm]', angle: -90, position: 'insideLeft', offset: 5, fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip content={<PathLossTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Line
              type="monotone"
              dataKey="pRx_n2"
              name="Free Space (n=2.0)"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pRx_n3"
              name="Urban (n=3.0)"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pRx_n4"
              name="Dense Urban (n=4.0)"
              stroke="#a855f7"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
