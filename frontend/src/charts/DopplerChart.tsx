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
  currentSpeedMps?: number;
  currentDopplerHz?: number;
}

const DopplerTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/95 p-2.5 text-xs text-slate-200">
        <p className="font-semibold text-blue-400">Speed: {label} km/h ({(Number(label) / 3.6).toFixed(1)} m/s)</p>
        <p className="text-emerald-400">GSM / Sub-1GHz (900 MHz): {payload[0]?.value} Hz</p>
        <p className="text-sky-400">Wi-Fi / ISM (2.4 GHz): {payload[1]?.value} Hz</p>
        <p className="text-indigo-400">5G Mid-Band (3.5 GHz): {payload[2]?.value} Hz</p>
      </div>
    );
  }
  return null;
};

export const DopplerChart: React.FC<Props> = ({
  currentSpeedMps = 0,
  currentDopplerHz = 0,
}) => {
  const speedsKmh = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200];
  const c = 299_792_458; // m/s

  const data = speedsKmh.map((kmh) => {
    const v_mps = kmh / 3.6;
    const fd_900m = (v_mps * 900e6) / c;
    const fd_2400m = (v_mps * 2.4e9) / c;
    const fd_3500m = (v_mps * 3.5e9) / c;

    return {
      speed_kmh: kmh,
      speed_mps: Math.round(v_mps * 10) / 10,
      fd_900m: Math.round(fd_900m * 10) / 10,
      fd_2400m: Math.round(fd_2400m * 10) / 10,
      fd_3500m: Math.round(fd_3500m * 10) / 10,
    };
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-100">Doppler Shift vs Receiver Mobility</h3>
          <p className="text-xs text-slate-400">
            Maximum Doppler Shift: f_D = (v · f_c) / c
          </p>
        </div>
        {currentDopplerHz > 0 && (
          <div className="rounded-md border border-cyan-900/50 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-300">
            Current: <span className="font-mono font-bold text-white">{(currentSpeedMps * 3.6).toFixed(0)} km/h</span> →{' '}
            <span className="font-mono font-bold text-emerald-400">{currentDopplerHz.toFixed(1)} Hz</span>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="speed_kmh"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Receiver Speed (v) [km/h]', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Doppler Shift (f_D) [Hz]', angle: -90, position: 'insideLeft', offset: 5, fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip content={<DopplerTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Line
              type="monotone"
              dataKey="fd_900m"
              name="900 MHz (Cellular)"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="fd_2400m"
              name="2.4 GHz (ISM / Wi-Fi)"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="fd_3500m"
              name="3.5 GHz (5G C-Band)"
              stroke="#818cf8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
