import React, { useState } from 'react';
import {
  Play,
  Layers,
  Save,
  Download,
  RotateCcw,
  Cpu,
  Radio,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import {
  SimulationConfig,
  SingleSimulationResult,
  BatchSimulationResult,
  MLPrediction,
} from '../types';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import { ConstellationChart } from '../charts/ConstellationChart';
import { BerSnrChart } from '../charts/BerSnrChart';

interface Props {
  onSimulationComplete: (result: SingleSimulationResult) => void;
  onSaveExperiment: () => void;
}

export const SimulatorPage: React.FC<Props> = ({
  onSimulationComplete,
  onSaveExperiment,
}) => {
  // Simulator configuration state
  const [config, setConfig] = useState<SimulationConfig>({
    modulation: 'BPSK',
    channel: 'AWGN',
    snr_db: 10,
    num_bits: 100_000,
    distance_m: 50,
    reference_distance_m: 50,
    path_loss_exponent: 3.0,
    speed_mps: 0,
    carrier_frequency_hz: 2.4e9,
    symbol_rate_sps: 100_000,
    equalizer: 'MMSE',
    random_seed: 42,
    max_constellation_points: 200,
  });

  // Batch configuration
  const [batchSnrStart, setBatchSnrStart] = useState<number>(0);
  const [batchSnrEnd, setBatchSnrEnd] = useState<number>(20);
  const [batchSnrStep, setBatchSnrStep] = useState<number>(2.5);
  const [batchBits, setBatchBits] = useState<number>(50_000);

  // Results state
  const [singleResult, setSingleResult] = useState<SingleSimulationResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchSimulationResult | null>(null);
  const [mlPrediction, setMlPrediction] = useState<MLPrediction | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBatchLoading, setIsBatchLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Speed in km/h for student-friendly UI
  const speedKmh = Math.round(config.speed_mps * 3.6);

  const handleSpeedKmhChange = (kmh: number) => {
    setConfig({ ...config, speed_mps: Math.max(0, kmh) / 3.6 });
  };

  const runSingle = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSaveSuccessMsg(null);
    try {
      const res = await api.runSingleSimulation(config);
      setSingleResult(res);
      onSimulationComplete(res);

      // Trigger supporting ML prediction using simulated features
      try {
        const pred = await api.predictML({
          snr_db: config.snr_db,
          modulation: config.modulation,
          channel_type: config.channel,
          distance_m: config.distance_m,
          speed_mps: config.speed_mps,
          path_loss_exponent: config.path_loss_exponent,
          effective_snr_db: res.metrics.effective_snr_db,
          path_loss_db: res.metrics.path_loss_db,
          received_power_dbm: res.metrics.received_power_dbm,
          doppler_shift_hz: res.metrics.doppler_shift_hz,
        });
        setMlPrediction(pred);
      } catch (mlErr) {
        console.warn('ML Prediction error:', mlErr);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation run failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const runBatch = async () => {
    setIsBatchLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.runBatchSimulation({
        modulation: config.modulation,
        channel: config.channel,
        snr_start: batchSnrStart,
        snr_end: batchSnrEnd,
        snr_step: batchSnrStep,
        num_bits_per_snr: batchBits,
        distance_m: config.distance_m,
        speed_mps: config.speed_mps,
        path_loss_exponent: config.path_loss_exponent,
        carrier_frequency_hz: config.carrier_frequency_hz,
        equalizer: config.equalizer,
        random_seed: config.random_seed,
      });
      setBatchResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Batch sweep failed.');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleSave = async () => {
    if (!singleResult) return;
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      await api.saveExperiment({
        title: `${config.modulation} over ${config.channel} at ${config.snr_db} dB`,
        description: `Distance: ${config.distance_m}m, Speed: ${(config.speed_mps * 3.6).toFixed(0)} km/h, PLE: ${config.path_loss_exponent}`,
        configuration: singleResult.configuration,
        metrics: singleResult.metrics,
        ml_prediction: mlPrediction || undefined,
        tags: [config.modulation, config.channel, `${config.snr_db}dB`],
      });
      setSaveSuccessMsg('Experiment successfully saved to persistent database!');
      onSaveExperiment();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save experiment.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-800 bg-rose-950/70 p-3 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}
      {saveSuccessMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/70 p-3 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Control Panel (Left) & Results (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Simulation Controls */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-semibold text-slate-100">Transmitter & Channel Controls</h3>
                <p className="text-xs text-slate-400">Configure physical wireless parameters</p>
              </div>
              <button
                onClick={() =>
                  setConfig({
                    modulation: 'BPSK',
                    channel: 'AWGN',
                    snr_db: 10,
                    num_bits: 100_000,
                    distance_m: 50,
                    reference_distance_m: 50,
                    path_loss_exponent: 3.0,
                    speed_mps: 0,
                    carrier_frequency_hz: 2.4e9,
                    symbol_rate_sps: 100_000,
                    equalizer: 'MMSE',
                    random_seed: 42,
                    max_constellation_points: 200,
                  })
                }
                title="Reset defaults"
                className="rounded-md border border-slate-700 bg-slate-950 p-1.5 text-slate-400 hover:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Modulation Scheme */}
              <div>
                <label className="block font-medium text-slate-300">Modulation Scheme</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(['BPSK', 'QPSK'] as const).map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setConfig({ ...config, modulation: mod })}
                      className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition ${
                        config.modulation === mod
                          ? 'border-blue-500 bg-blue-600/20 text-white font-bold ring-1 ring-blue-500'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {mod} ({mod === 'BPSK' ? '1 bit/sym' : '2 bits/sym'})
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel Model */}
              <div>
                <label className="block font-medium text-slate-300">Channel Propagation Model</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(['AWGN', 'RAYLEIGH'] as const).map((chan) => (
                    <button
                      key={chan}
                      type="button"
                      onClick={() => setConfig({ ...config, channel: chan })}
                      className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition ${
                        config.channel === chan
                          ? 'border-purple-500 bg-purple-600/20 text-white font-bold ring-1 ring-purple-500'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {chan === 'AWGN' ? 'AWGN (White Noise)' : 'Rayleigh (Multipath)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* SNR Input with Slider */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-300">Nominal SNR (dB)</label>
                  <span className="font-mono font-bold text-blue-400">{config.snr_db} dB</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="30"
                  step="0.5"
                  value={config.snr_db}
                  onChange={(e) => setConfig({ ...config, snr_db: parseFloat(e.target.value) })}
                  className="mt-1 w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>-5 dB (Severe noise)</span>
                  <span>10 dB (Standard)</span>
                  <span>30 dB (Pristine)</span>
                </div>
              </div>

              {/* Distance Slider */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-300">Receiver Distance</label>
                  <span className="font-mono font-bold text-emerald-400">{config.distance_m} m</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={config.distance_m}
                  onChange={(e) => setConfig({ ...config, distance_m: parseFloat(e.target.value) })}
                  className="mt-1 w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>5 m</span>
                  <span>Reference (50 m)</span>
                  <span>300 m (Cell Edge)</span>
                </div>
              </div>

              {/* Speed / Mobility Slider */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-300">Receiver Mobility</label>
                  <span className="font-mono font-bold text-amber-400">
                    {speedKmh} km/h ({(config.speed_mps).toFixed(1)} m/s)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="160"
                  step="5"
                  value={speedKmh}
                  onChange={(e) => handleSpeedKmhChange(parseFloat(e.target.value))}
                  className="mt-1 w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Stationary (0)</span>
                  <span>Urban Walk (5)</span>
                  <span>Vehicular (120 km/h)</span>
                </div>
              </div>

              {/* Number of bits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-300">Bit Sequence Length</label>
                  <select
                    value={config.num_bits}
                    onChange={(e) => setConfig({ ...config, num_bits: parseInt(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value={10000}>10,000 bits (Quick)</option>
                    <option value={50000}>50,000 bits</option>
                    <option value={100000}>100,000 bits (Standard)</option>
                    <option value={200000}>200,000 bits (Accurate)</option>
                    <option value={500000}>500,000 bits (High Precision)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-300">Path Loss Exponent (n)</label>
                  <select
                    value={config.path_loss_exponent}
                    onChange={(e) =>
                      setConfig({ ...config, path_loss_exponent: parseFloat(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value={2.0}>2.0 (Free Space)</option>
                    <option value={2.5}>2.5 (Suburban)</option>
                    <option value={3.0}>3.0 (Urban Macrocell)</option>
                    <option value={3.5}>3.5 (Dense Urban)</option>
                    <option value={4.0}>4.0 (Obstructed In-Building)</option>
                  </select>
                </div>
              </div>

              {/* Receiver Equalizer & Random Seed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-300">Equalizer Detector</label>
                  <select
                    value={config.equalizer}
                    onChange={(e) => setConfig({ ...config, equalizer: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="MMSE">MMSE Equalizer</option>
                    <option value="ZERO_FORCING">Zero-Forcing (ZF)</option>
                    <option value="NONE">None (Raw Demod)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-300">Random Seed</label>
                  <input
                    type="number"
                    value={config.random_seed ?? ''}
                    placeholder="Random"
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        random_seed: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={runSingle}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Simulating Baseband Transmission...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> Run Point Simulation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Batch Sweep Panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="mb-3">
              <h3 className="font-semibold text-slate-100">Batch SNR Sweep Experiment</h3>
              <p className="text-xs text-slate-400">
                Run automated parameter scan to generate empirical BER vs SNR curve
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div>
                <label className="text-[11px] text-slate-400">Start (dB)</label>
                <input
                  type="number"
                  value={batchSnrStart}
                  onChange={(e) => setBatchSnrStart(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">End (dB)</label>
                <input
                  type="number"
                  value={batchSnrEnd}
                  onChange={(e) => setBatchSnrEnd(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Step (dB)</label>
                <input
                  type="number"
                  value={batchSnrStep}
                  step="0.5"
                  onChange={(e) => setBatchSnrStep(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Bits/SNR</label>
                <input
                  type="number"
                  value={batchBits}
                  step="10000"
                  onChange={(e) => setBatchBits(parseInt(e.target.value, 10) || 50000)}
                  className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-1.5 text-slate-200"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={runBatch}
              disabled={isBatchLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-700/60 bg-indigo-950/40 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/40 disabled:opacity-50"
            >
              {isBatchLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sweeping SNR Range...
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5 text-indigo-400" /> Run Batch SNR Curve
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Calculated Results, Visualizations & ML Assessment */}
        <div className="space-y-6 lg:col-span-7">
          {singleResult ? (
            <div className="space-y-6">
              {/* Top Result Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Simulation Completed</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {singleResult.configuration.num_bits.toLocaleString()} bits transmitted |{' '}
                      {singleResult.metrics.execution_time_ms} ms computation time
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" /> {isSaving ? 'Saving...' : 'Save Run'}
                  </button>
                  <a
                    href={api.getExportCsvUrl()}
                    download
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    <Download className="h-3.5 w-3.5" /> CSV
                  </a>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard
                  title="Bit Error Rate (BER)"
                  value={
                    singleResult.metrics.ber === 0
                      ? '0.00'
                      : singleResult.metrics.ber.toExponential(3)
                  }
                  subtitle={`${singleResult.metrics.bit_errors} bit errors`}
                  variant="emerald"
                />
                <MetricCard
                  title="Theoretical BER"
                  value={singleResult.metrics.theoretical_ber.toExponential(3)}
                  subtitle="Benchmark limit"
                  variant="blue"
                />
                <MetricCard
                  title="Effective SNR"
                  value={`${singleResult.metrics.effective_snr_db.toFixed(1)}`}
                  unit="dB"
                  subtitle={`Loss: -${singleResult.metrics.path_loss_db.toFixed(1)} dB`}
                  variant="amber"
                />
                <MetricCard
                  title="Goodput"
                  value={singleResult.metrics.effective_throughput_kbps}
                  unit="kbps"
                  subtitle={`Frame PSR: ${(singleResult.metrics.packet_success_rate * 100).toFixed(1)}%`}
                  variant="purple"
                />
              </div>

              {/* Supporting Machine Learning Assessment Card */}
              {mlPrediction && (
                <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-indigo-950/30 p-4 shadow-lg backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-emerald-400" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        ML Channel Quality Assessment
                      </h4>
                    </div>
                    <Badge type="quality" value={mlPrediction.predicted_channel_quality} />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                    <div className="rounded-md border border-slate-800 bg-slate-950/60 p-2.5">
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Model Confidence
                      </span>
                      <p className="mt-0.5 font-mono font-bold text-white">
                        {(
                          (mlPrediction.confidence_scores[
                            mlPrediction.predicted_channel_quality
                          ] || 0) * 100
                        ).toFixed(1)}
                        %
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Random Forest Classifier v{mlPrediction.model_version}
                      </span>
                    </div>

                    <div className="rounded-md border border-slate-800 bg-slate-950/60 p-2.5">
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Predicted BER vs Real
                      </span>
                      <p className="mt-0.5 font-mono font-bold text-emerald-400">
                        {mlPrediction.predicted_ber.toExponential(3)}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Simulated: {singleResult.metrics.ber === 0 ? '0' : singleResult.metrics.ber.toExponential(3)}
                      </span>
                    </div>

                    <div className="rounded-md border border-slate-800 bg-slate-950/60 p-2.5">
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Operational Quality Criteria
                      </span>
                      <p className="mt-0.5 text-slate-300 line-clamp-2">
                        {mlPrediction.quality_criteria}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Constellation Diagram */}
              <ConstellationChart
                samples={singleResult.constellation_samples}
                modulation={singleResult.configuration.modulation}
                snr_db={singleResult.configuration.snr_db}
              />
            </div>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center text-slate-400">
              <Radio className="h-12 w-12 text-slate-600 mb-3" />
              <h4 className="text-base font-semibold text-slate-200">Simulation Not Started</h4>
              <p className="mt-1 max-w-md text-xs text-slate-400">
                Click <strong>"Run Point Simulation"</strong> in the left control panel to generate
                pseudo-random bits, modulate to complex symbols, pass through AWGN or Rayleigh
                fading channel, and compute real bit error metrics.
              </p>
            </div>
          )}

          {/* Batch BER vs SNR Curve */}
          {batchResult && (
            <div className="mt-6">
              <BerSnrChart
                data={batchResult.points}
                title={`Simulated vs Theoretical BER Curve (${config.modulation} in ${config.channel})`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
