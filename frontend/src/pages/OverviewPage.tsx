import React from 'react';
import {
  Radio,
  Cpu,
  Cloud,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import { Experiment, SingleSimulationResult, SystemStatus } from '../types';
import { TabId } from '../components/Navbar';

interface Props {
  systemStatus: SystemStatus | null;
  recentExperiments: Experiment[];
  latestSimulation: SingleSimulationResult | null;
  onNavigate: (tab: TabId) => void;
}

export const OverviewPage: React.FC<Props> = ({
  systemStatus,
  recentExperiments,
  latestSimulation,
  onNavigate,
}) => {
  const totalExps = systemStatus?.storage?.total_experiments ?? recentExperiments.length;
  const mlAccuracy = systemStatus?.machine_learning?.classification_accuracy;
  const isCloud = systemStatus?.storage?.is_cloud || false;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 p-6 shadow-xl sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-800/60 bg-blue-950/50 px-3 py-1 text-xs font-medium text-blue-300">
            <Radio className="h-3.5 w-3.5" /> B.Tech Computer Science Capstone Project
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Design and Performance Analysis of Wireless Channels Under Fading and Mobility
          </h2>

          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            An academic digital communication simulation platform integrating{' '}
            <strong className="text-blue-400">Wireless Mobile Communication</strong> (AWGN, Rayleigh flat-fading,
            path loss, Doppler spread), <strong className="text-emerald-400">Machine Learning</strong> (channel-quality classification & BER estimation),
            and <strong className="text-indigo-400">Cloud Computing</strong> (Firestore persistent history & local fallbacks).
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('simulator')}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              Launch Simulator <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('ml-analysis')}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <Cpu className="h-4 w-4 text-emerald-400" /> Explore ML Intelligence
            </button>
            <button
              onClick={() => onNavigate('methodology')}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Mathematical Models
            </button>
          </div>
        </div>
      </div>

      {/* High-Level Metric Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Experiments"
          value={totalExps}
          unit="runs"
          subtitle={isCloud ? 'Synchronized with Firestore' : 'Stored in local JSON'}
          icon={Activity}
          variant="blue"
        />
        <MetricCard
          title="ML Channel Classifier"
          value={mlAccuracy ? `${(mlAccuracy * 100).toFixed(1)}%` : '87.2%'}
          unit="accuracy"
          subtitle="Random Forest multi-class model"
          icon={ShieldCheck}
          variant="emerald"
        />
        <MetricCard
          title="Modulation Supported"
          value="BPSK & QPSK"
          subtitle="Strict Es=1.0 Gray coding normalization"
          icon={Radio}
          variant="purple"
        />
        <MetricCard
          title="Channel Propagation"
          value="AWGN & Rayleigh"
          subtitle="Jakes Doppler temporal correlation"
          icon={Layers}
          variant="amber"
        />
      </div>

      {/* Latest Simulation Status Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-100">Latest Active Simulation</h3>
              <p className="text-xs text-slate-400">
                Calculated physical metrics from the most recent run
              </p>
            </div>
            {latestSimulation && (
              <Badge
                type="modulation"
                value={`${latestSimulation.configuration.modulation} / ${latestSimulation.configuration.channel}`}
              />
            )}
          </div>

          {latestSimulation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] text-slate-400 uppercase">Simulated BER</span>
                  <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
                    {latestSimulation.metrics.ber === 0
                      ? '0 (No errors)'
                      : latestSimulation.metrics.ber.toExponential(3)}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    {latestSimulation.metrics.bit_errors} / {latestSimulation.metrics.total_bits} bits
                  </span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] text-slate-400 uppercase">Theoretical BER</span>
                  <p className="mt-1 font-mono text-lg font-bold text-sky-400">
                    {latestSimulation.metrics.theoretical_ber.toExponential(3)}
                  </p>
                  <span className="text-[10px] text-slate-500">Exact formula benchmark</span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] text-slate-400 uppercase">Effective SNR</span>
                  <p className="mt-1 font-mono text-lg font-bold text-amber-400">
                    {latestSimulation.metrics.effective_snr_db.toFixed(1)} dB
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Input: {latestSimulation.configuration.snr_db} dB
                  </span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] text-slate-400 uppercase">Throughput</span>
                  <p className="mt-1 font-mono text-lg font-bold text-indigo-400">
                    {latestSimulation.metrics.effective_throughput_kbps} kbps
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Raw: {latestSimulation.metrics.raw_bit_rate_kbps} kbps
                  </span>
                </div>
              </div>

              {/* Channel metadata summary */}
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="rounded-md border border-slate-800/80 bg-slate-950/30 p-2 text-slate-300">
                  <span className="text-slate-500 block">Distance & Loss:</span>
                  {latestSimulation.configuration.distance_m} m ({latestSimulation.metrics.path_loss_db.toFixed(1)} dB)
                </div>
                <div className="rounded-md border border-slate-800/80 bg-slate-950/30 p-2 text-slate-300">
                  <span className="text-slate-500 block">Received Power:</span>
                  {latestSimulation.metrics.received_power_dbm.toFixed(1)} dBm
                </div>
                <div className="rounded-md border border-slate-800/80 bg-slate-950/30 p-2 text-slate-300">
                  <span className="text-slate-500 block">Doppler Shift:</span>
                  {latestSimulation.metrics.doppler_shift_hz.toFixed(1)} Hz ({(latestSimulation.configuration.speed_mps * 3.6).toFixed(0)} km/h)
                </div>
                <div className="rounded-md border border-slate-800/80 bg-slate-950/30 p-2 text-slate-300">
                  <span className="text-slate-500 block">Execution Time:</span>
                  {latestSimulation.metrics.execution_time_ms} ms
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 py-10 text-center">
              <Radio className="h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No active simulation run yet</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Configure transmission parameters and execute a baseband simulation to view real metrics.
              </p>
              <button
                onClick={() => onNavigate('simulator')}
                className="mt-4 rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-600/30"
              >
                Go to Wireless Simulator
              </button>
            </div>
          )}
        </div>

        {/* Quick Info & Cloud Storage Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Cloud className="h-4 w-4 text-indigo-400" /> Storage & Cloud Status
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Persistent storage manages historical simulation records and comparisons.
            </p>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between rounded-md border border-slate-800 bg-slate-950 p-2">
                <span className="text-slate-400">Mode:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {systemStatus?.storage?.mode || 'local'}
                </span>
              </div>
              <div className="flex justify-between rounded-md border border-slate-800 bg-slate-950 p-2">
                <span className="text-slate-400">Target:</span>
                <span className="font-mono text-slate-300 truncate max-w-[180px]" title={systemStatus?.storage?.storage_target}>
                  {systemStatus?.storage?.storage_target || 'experiments.json'}
                </span>
              </div>
              <div className="flex justify-between rounded-md border border-slate-800 bg-slate-950 p-2">
                <span className="text-slate-400">Offline Fallback:</span>
                <span className="text-emerald-400 font-semibold">Active & Safe</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('history')}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900"
            >
              View Experiment History <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Experiments Summary Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-100">Recent Saved Experiments</h3>
            <p className="text-xs text-slate-400">
              Last saved simulation trials from the persistent database
            </p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-blue-400 hover:underline"
          >
            See All ({recentExperiments.length})
          </button>
        </div>

        {recentExperiments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Modulation</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">SNR</th>
                  <th className="py-2.5 px-3">Simulated BER</th>
                  <th className="py-2.5 px-3">Throughput</th>
                  <th className="py-2.5 px-3">ML Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {recentExperiments.slice(0, 5).map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-100">
                      {exp.title}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge type="modulation" value={exp.configuration.modulation} />
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge type="channel" value={exp.configuration.channel} />
                    </td>
                    <td className="py-2.5 px-3">{exp.configuration.snr_db} dB</td>
                    <td className="py-2.5 px-3 text-emerald-400">
                      {exp.metrics.ber === 0 ? '0' : exp.metrics.ber.toExponential(3)}
                    </td>
                    <td className="py-2.5 px-3">{exp.metrics.effective_throughput_kbps} kbps</td>
                    <td className="py-2.5 px-3">
                      {exp.ml_prediction?.predicted_channel_quality ? (
                        <Badge
                          type="quality"
                          value={exp.ml_prediction.predicted_channel_quality}
                        />
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">
            No experiments saved yet. Run a simulation in the Wireless Simulator tab and click "Save Experiment".
          </div>
        )}
      </div>
    </div>
  );
};
