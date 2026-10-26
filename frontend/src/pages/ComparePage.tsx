import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { Experiment } from '../types';
import { Badge } from '../components/Badge';

export const ComparePage: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    api
      .listExperiments({ limit: 50 })
      .then((data) => {
        if (!ignore) {
          setExperiments(data);
          if (data.length >= 2) {
            setSelectedIds([data[0].id, data[1].id]);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (selectedIds.length < 2) return;
    let ignore = false;
    api
      .compareExperiments(selectedIds)
      .then((res) => {
        if (!ignore) setComparisonData(res.experiments);
      })
      .catch(console.error);

    return () => {
      ignore = true;
    };
  }, [selectedIds]);

  const displayedComparisonData = selectedIds.length >= 2 ? comparisonData : [];

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 4) {
        alert('You can compare a maximum of 4 experiments simultaneously.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-indigo-400" /> Compare Wireless Experiments
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Select between 2 and 4 saved experiments to perform side-by-side performance evaluation across channels, modulations, and mobility conditions.
        </p>
      </div>

      {/* Selection Drawer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
          Select Experiments to Compare ({selectedIds.length} selected)
        </h3>

        {isLoading ? (
          <p className="text-xs text-slate-400 py-4">Loading saved experiments...</p>
        ) : experiments.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            {experiments.map((exp) => {
              const isSelected = selectedIds.includes(exp.id);
              return (
                <div
                  key={exp.id}
                  onClick={() => toggleSelect(exp.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 shrink-0 text-indigo-400" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-slate-600" />
                    )}
                    <div className="truncate">
                      <p className="font-semibold text-slate-100 truncate">{exp.title}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Badge type="modulation" value={exp.configuration.modulation} />
                        <Badge type="channel" value={exp.configuration.channel} />
                        <span>{exp.configuration.snr_db} dB</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4">
            No experiments found. Run simulations and save them to enable side-by-side comparison.
          </p>
        )}
      </div>

      {/* Side-by-Side Comparison Table */}
      {displayedComparisonData.length >= 2 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-100">Performance Comparison Matrix</h3>
            <span className="text-xs text-slate-400 font-mono">
              Comparing {displayedComparisonData.length} experiments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  <th className="py-3 px-4 font-semibold text-slate-400 w-44">Parameter</th>
                  {displayedComparisonData.map((item, idx) => (
                    <th key={item.id} className="py-3 px-4 font-semibold text-slate-200">
                      <div className="flex flex-col">
                        <span className="text-indigo-400 font-mono text-[10px]">Trial #{idx + 1}</span>
                        <span className="font-bold text-white text-xs truncate max-w-[180px]">{item.title}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-400">Modulation Scheme</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4">
                      <Badge type="modulation" value={item.modulation} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-400">Channel Type</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4">
                      <Badge type="channel" value={item.channel} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-400">Nominal SNR (dB)</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4 font-bold text-blue-400">
                      {item.snr_db} dB
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-400">Effective SNR (dB)</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4 text-amber-400">
                      {item.effective_snr_db != null ? `${item.effective_snr_db.toFixed(1)} dB` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-emerald-950/15">
                  <td className="py-2.5 px-4 font-sans font-bold text-emerald-300">Empirical BER</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4 font-bold text-emerald-400">
                      {item.ber != null ? (item.ber === 0 ? '0 (Clean)' : item.ber.toExponential(3)) : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-400">Theoretical BER</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4 text-sky-400">
                      {item.theoretical_ber != null ? item.theoretical_ber.toExponential(3) : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-400">Throughput</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4 text-indigo-300 font-bold">
                      {item.effective_throughput_kbps != null ? `${item.effective_throughput_kbps} kbps` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-400">Distance & Loss</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4">
                      {item.distance_m ?? 50} m {item.path_loss_db != null ? `(-${item.path_loss_db.toFixed(1)} dB)` : ''}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-400">Rx Signal Power</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4 text-slate-200">
                      {item.received_power_dbm != null ? `${item.received_power_dbm.toFixed(1)} dBm` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-400">Mobility & Doppler</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4 text-cyan-400">
                      {item.speed_mps != null ? `${(item.speed_mps * 3.6).toFixed(0)} km/h` : '0 km/h'}{' '}
                      {item.doppler_shift_hz != null ? `(${item.doppler_shift_hz.toFixed(1)} Hz)` : ''}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-400">ML Predicted Quality</td>
                  {displayedComparisonData.map((item) => (
                    <td key={item.id} className="py-2.5 px-4">
                      <Badge type="quality" value={item.predicted_quality} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fairness & Methodology Note */}
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="text-slate-300 block mb-0.5">Academic Fairness Analysis:</strong>
              When comparing BPSK vs QPSK, remember that QPSK transmits 2 bits per symbol (doubling spectral efficiency)
              while BPSK transmits 1 bit per symbol. Under identical average symbol energy E_s, BPSK provides greater Euclidean
              distance per bit, while QPSK achieves double throughput over the same bandwidth.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-6 text-center text-xs text-slate-500">
          Please select at least 2 experiments above to display side-by-side matrix comparison.
        </div>
      )}
    </div>
  );
};
