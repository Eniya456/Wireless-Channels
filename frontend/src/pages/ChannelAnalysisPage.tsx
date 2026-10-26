import React, { useState } from 'react';
import {
  Activity,
  Wind,
  TrendingDown,
  Info,
} from 'lucide-react';
import { PathLossChart } from '../charts/PathLossChart';
import { DopplerChart } from '../charts/DopplerChart';

export const ChannelAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'propagation' | 'mobility' | 'comparison'>('propagation');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
        <h2 className="text-xl font-bold tracking-tight text-white">Wireless Channel Propagation Analysis</h2>
        <p className="mt-1 text-xs text-slate-400">
          Theoretical foundations and physical modeling of noise, multipath fading, distance attenuation, and Doppler mobility.
        </p>

        {/* Sub-nav */}
        <div className="mt-4 flex gap-2 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setActiveTab('propagation')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'propagation'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Path Loss & Attenuation
          </button>
          <button
            onClick={() => setActiveTab('mobility')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'mobility'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Mobility & Doppler Spread
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'comparison'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            AWGN vs Rayleigh Comparison
          </button>
        </div>
      </div>

      {activeTab === 'propagation' && (
        <div className="space-y-6">
          <PathLossChart currentDistance={50} currentPower={-45} />

          {/* Theoretical notes */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
              <h4 className="flex items-center gap-2 font-semibold text-slate-100">
                <Info className="h-4 w-4 text-blue-400" /> Log-Distance Path Loss Model
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                In practical propagation environments, signal attenuation increases logarithmically with distance:
              </p>
              <div className="my-3 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-blue-300">
                PL(d)[dB] = PL(d₀) + 10 · n · log₁₀(d / d₀)
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>• <strong className="text-slate-300">d₀:</strong> Reference close-in distance (e.g., 1 m or 50 m).</li>
                <li>• <strong className="text-slate-300">n = 2.0:</strong> Free-space propagation (Friis transmission equation).</li>
                <li>• <strong className="text-slate-300">n = 2.7 to 3.5:</strong> Urban macrocell and microcell environments.</li>
                <li>• <strong className="text-slate-300">n = 4.0 to 6.0:</strong> Dense urban buildings and obstructed line-of-sight.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
              <h4 className="flex items-center gap-2 font-semibold text-slate-100">
                <TrendingDown className="h-4 w-4 text-emerald-400" /> Impact on Effective SNR
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Received signal power directly determines the effective Signal-to-Noise Ratio at the receiver detector:
              </p>
              <div className="my-3 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-emerald-300">
                SNR_eff[dB] = SNR_tx[dB] - 10 · n · log₁₀(d / d₀)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                As the receiver moves away from the base station, signal power drops while thermal noise floor remains constant.
                Doubling distance in an urban channel (n=3) reduces received SNR by <span className="font-mono text-white">9.03 dB</span>,
                causing an exponential spike in bit error rate unless adaptive modulation and coding (AMC) is applied.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mobility' && (
        <div className="space-y-6">
          <DopplerChart currentSpeedMps={15} currentDopplerHz={120} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
              <h4 className="flex items-center gap-2 font-semibold text-slate-100">
                <Wind className="h-4 w-4 text-cyan-400" /> Doppler Shift & Carrier Frequency
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Relative motion between transmitter and receiver causes apparent shifts in received signal frequency:
              </p>
              <div className="my-3 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-cyan-300">
                f_D = (v · f_c) / c
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Where <span className="font-mono text-slate-200">v</span> is vehicle velocity in m/s,{' '}
                <span className="font-mono text-slate-200">f_c</span> is carrier frequency, and{' '}
                <span className="font-mono text-slate-200">c = 3×10⁸ m/s</span>. High speed train scenarios (300 km/h) at 3.5 GHz
                produce Doppler shifts exceeding 970 Hz, requiring robust frequency synchronization.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
              <h4 className="flex items-center gap-2 font-semibold text-slate-100">
                <Activity className="h-4 w-4 text-purple-400" /> Coherence Time & Fast vs Slow Fading
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Coherence time represents the time interval over which channel impulse response remains correlated:
              </p>
              <div className="my-3 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-purple-300">
                T_c ≈ 0.423 / f_D  (Clarke-Jakes Model)
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>• <strong className="text-slate-300">Slow Fading:</strong> Symbol duration T_s &lt;&lt; T_c. Channel coefficients remain constant across multiple transmitted symbols.</li>
                <li>• <strong className="text-slate-300">Fast Fading:</strong> Symbol duration T_s &gt; T_c. Channel changes rapidly within a single symbol, causing amplitude distortion and phase jitter.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
          <h3 className="font-semibold text-slate-100">Theoretical Channel Characteristics Comparison</h3>
          <p className="mt-1 text-xs text-slate-400">
            Contrasting additive noise versus multipath Rayleigh flat-fading
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Characteristic</th>
                  <th className="py-3 px-4">AWGN Channel</th>
                  <th className="py-3 px-4">Rayleigh Fading Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-200">Physical Origin</td>
                  <td className="py-3 px-4">Thermal agitation of electrons in receiver front-end (Johnson noise).</td>
                  <td className="py-3 px-4">Destructive/constructive interference of multiple reflected wave paths.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-200">Channel Coefficient (h)</td>
                  <td className="py-3 px-4 font-mono text-slate-400">h = 1.0 (Constant unity gain)</td>
                  <td className="py-3 px-4 font-mono text-purple-400">h ~ CN(0, 1), |h| has Rayleigh distribution</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-200">BER Asymptotic Decay</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">Exponential: Q(√(2·SNR)) ~ exp(-SNR)</td>
                  <td className="py-3 px-4 font-mono text-amber-400">Inverse Linear: O(1 / SNR)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-200">SNR Penalty for 10⁻³ BER</td>
                  <td className="py-3 px-4">~6.8 dB (BPSK)</td>
                  <td className="py-3 px-4">~24.0 dB (Requires 17+ dB more transmit power without diversity)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-200">Equalizer Requirement</td>
                  <td className="py-3 px-4">None needed; simple threshold detection is optimal.</td>
                  <td className="py-3 px-4">Channel estimation and Zero-Forcing or MMSE equalization required.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-200">Deep Fade Resilience</td>
                  <td className="py-3 px-4">High; signal amplitude never drops to zero.</td>
                  <td className="py-3 px-4">Susceptible to deep fades where |h|→0, causing burst bit errors.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
