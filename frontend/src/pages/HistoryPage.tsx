import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Trash2,
  Eye,
  Search,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { Experiment } from '../types';
import { Badge } from '../components/Badge';

export const HistoryPage: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modFilter, setModFilter] = useState<string>('ALL');
  const [chanFilter, setChanFilter] = useState<string>('ALL');

  // Selected experiment for inspection modal
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.listExperiments({ limit: 100 });
      setExperiments(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch experiment history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    api
      .listExperiments({ limit: 100 })
      .then((data) => {
        if (!ignore) {
          setExperiments(data || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setErrorMsg(err.message || 'Failed to fetch experiment history.');
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experiment record?')) return;
    try {
      await api.deleteExperiment(id);
      setExperiments((prev) => prev.filter((e) => e.id !== id));
      if (selectedExp?.id === id) setSelectedExp(null);
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  // Filtered experiments
  const filtered = experiments.filter((exp) => {
    const mod = exp.configuration?.modulation || '';
    const chan = exp.configuration?.channel || '';
    const modMatch = modFilter === 'ALL' || mod === modFilter;
    const chanMatch = chanFilter === 'ALL' || chan === chanFilter;
    const searchMatch =
      !searchQuery ||
      (exp.title && exp.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.id && exp.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.description && exp.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return modMatch && chanMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <History className="h-5 w-5 text-blue-400" /> Persistent Experiment History
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Audit trail of physical simulations and machine learning channel classifications ({experiments.length} runs saved)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              title="Refresh Experiments"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <a
              href={api.getExportCsvUrl()}
              download
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-900"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Export CSV Spreadsheet
            </a>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-800/80 pt-4 sm:grid-cols-4 text-xs">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search experiments by title, ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Modulation Filter */}
          <div>
            <select
              value={modFilter}
              onChange={(e) => setModFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Modulations</option>
              <option value="BPSK">BPSK</option>
              <option value="QPSK">QPSK</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div>
            <select
              value={chanFilter}
              onChange={(e) => setChanFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Channels</option>
              <option value="AWGN">AWGN Channel</option>
              <option value="RAYLEIGH">Rayleigh Fading</option>
            </select>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between rounded-lg border border-rose-800 bg-rose-950/70 p-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={loadData}
            className="rounded bg-rose-900/60 px-2.5 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Experiments Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Mod / Chan</th>
                <th className="py-3 px-4">SNR (dB)</th>
                <th className="py-3 px-4">Distance / Speed</th>
                <th className="py-3 px-4">Simulated BER</th>
                <th className="py-3 px-4">Throughput</th>
                <th className="py-3 px-4">ML Quality</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {filtered.length > 0 ? (
                filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-sans text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(exp.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-100 max-w-[200px] truncate" title={exp.title}>
                      {exp.title}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-1.5">
                      <Badge type="modulation" value={exp.configuration?.modulation || 'BPSK'} />
                      <Badge type="channel" value={exp.configuration?.channel || 'AWGN'} />
                    </td>
                    <td className="py-3 px-4">
                      {exp.configuration?.snr_db ?? 'N/A'} dB{' '}
                      {exp.metrics?.effective_snr_db != null && (
                        <span className="text-[10px] text-slate-500">
                          ({exp.metrics.effective_snr_db.toFixed(1)} eff)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {exp.configuration?.distance_m ?? 50} m / {((exp.configuration?.speed_mps ?? 0) * 3.6).toFixed(0)} km/h
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      {exp.metrics?.ber != null
                        ? exp.metrics.ber === 0
                          ? '0'
                          : exp.metrics.ber.toExponential(3)
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {exp.metrics?.effective_throughput_kbps != null
                        ? `${exp.metrics.effective_throughput_kbps} kbps`
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {exp.ml_prediction?.predicted_channel_quality ? (
                        <Badge type="quality" value={exp.ml_prediction.predicted_channel_quality} />
                      ) : (
                        <span className="text-slate-500 text-[10px]">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedExp(exp)}
                          title="View Details"
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          title="Delete Record"
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-500 font-sans">
                    {isLoading ? 'Loading experiments...' : 'No experiments found matching your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Experiment Inspection Modal */}
      {selectedExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-semibold text-white">{selectedExp.title}</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedExp.id}</p>
              </div>
              <button
                onClick={() => setSelectedExp(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Configuration Section */}
              <div>
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                  Simulation Parameters
                </h4>
                <div className="grid grid-cols-2 gap-2 font-mono sm:grid-cols-4">
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Modulation</span>
                    <span className="text-slate-200">{selectedExp.configuration?.modulation || 'BPSK'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Channel</span>
                    <span className="text-slate-200">{selectedExp.configuration?.channel || 'AWGN'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">SNR</span>
                    <span className="text-blue-400">{selectedExp.configuration?.snr_db ?? 'N/A'} dB</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Bits</span>
                    <span className="text-slate-200">{selectedExp.configuration?.num_bits?.toLocaleString() ?? selectedExp.metrics?.total_bits?.toLocaleString() ?? 'N/A'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Distance</span>
                    <span className="text-slate-200">{selectedExp.configuration?.distance_m ?? 50} m</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Speed</span>
                    <span className="text-slate-200">{((selectedExp.configuration?.speed_mps ?? 0) * 3.6).toFixed(0)} km/h</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Path Loss Exponent</span>
                    <span className="text-slate-200">{selectedExp.configuration?.path_loss_exponent ?? '3.0'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Carrier Freq</span>
                    <span className="text-slate-200">{selectedExp.configuration?.carrier_frequency_hz != null ? `${(selectedExp.configuration.carrier_frequency_hz / 1e9).toFixed(1)} GHz` : '2.4 GHz'}</span>
                  </div>
                </div>
              </div>

              {/* Metrics Section */}
              <div>
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 gap-2 font-mono sm:grid-cols-4">
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Simulated BER</span>
                    <span className="text-emerald-400 font-bold">{selectedExp.metrics?.ber != null ? (selectedExp.metrics.ber === 0 ? '0' : selectedExp.metrics.ber.toExponential(4)) : 'N/A'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Theoretical BER</span>
                    <span className="text-sky-400">{selectedExp.metrics?.theoretical_ber != null ? selectedExp.metrics.theoretical_ber.toExponential(4) : 'N/A'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Bit Errors</span>
                    <span className="text-slate-200">{selectedExp.metrics?.bit_errors ?? 0} / {selectedExp.metrics?.total_bits ?? 'N/A'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Throughput</span>
                    <span className="text-indigo-400 font-bold">{selectedExp.metrics?.effective_throughput_kbps != null ? `${selectedExp.metrics.effective_throughput_kbps} kbps` : 'N/A'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Path Loss</span>
                    <span className="text-slate-200">{selectedExp.metrics?.path_loss_db != null ? `${selectedExp.metrics.path_loss_db.toFixed(1)} dB` : 'N/A'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Rx Power</span>
                    <span className="text-slate-200">{selectedExp.metrics?.received_power_dbm != null ? `${selectedExp.metrics.received_power_dbm.toFixed(1)} dBm` : 'N/A'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Doppler Shift</span>
                    <span className="text-cyan-400">{selectedExp.metrics?.doppler_shift_hz != null ? `${selectedExp.metrics.doppler_shift_hz.toFixed(1)} Hz` : '0.0 Hz'}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950 p-2">
                    <span className="text-[10px] text-slate-500 block">Compute Time</span>
                    <span className="text-slate-200">{selectedExp.metrics?.execution_time_ms != null ? `${selectedExp.metrics.execution_time_ms} ms` : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Supporting ML Assessment */}
              {selectedExp.ml_prediction && (
                <div>
                  <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                    ML Assessment Details
                  </h4>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Class:</span>
                      <Badge type="quality" value={selectedExp.ml_prediction.predicted_channel_quality} />
                    </div>
                    <p className="text-slate-400">{selectedExp.ml_prediction.quality_criteria}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedExp(null)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
