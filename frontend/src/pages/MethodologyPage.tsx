import React from 'react';
import {
  BookOpen,
  Radio,
  Layers,
  Cpu,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
          <BookOpen className="h-4 w-4" /> Academic Engineering Guide
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
          Theoretical Foundations and Mathematical Models
        </h2>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          Comprehensive documentation of digital signal processing algorithms, statistical channel models,
          equalization techniques, and machine learning pipelines implemented in this project.
        </p>
      </div>

      {/* Module 1: Wireless Mobile Communication */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Radio className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-bold text-slate-100">1. Digital Transmitter & Modulation</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs leading-relaxed text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h4 className="font-semibold text-white mb-2">BPSK Modulation (Binary Phase Shift Keying)</h4>
            <p>
              In BPSK, each bit modulates the phase of the carrier by 180°.
              We map binary bits <span className="font-mono text-slate-200">b ∈ &#123;0, 1&#125;</span> into complex symbols:
            </p>
            <div className="my-2 rounded bg-slate-950 p-2 font-mono text-blue-300">
              s = (1 - 2b) + 0j
            </div>
            <p className="text-slate-400">
              • Bit 0 → +1.0 + 0j<br />
              • Bit 1 → -1.0 + 0j<br />
              • Symbol Energy: E_s = |s|² = 1.0 (Bit Energy E_b = E_s = 1.0)
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h4 className="font-semibold text-white mb-2">QPSK Modulation with Gray Coding</h4>
            <p>
              QPSK transmits 2 bits per symbol (m = 2), doubling spectral efficiency. Bit pairs (b₀, b₁)
              are mapped using Gray coding so adjacent constellation points differ by only 1 bit:
            </p>
            <div className="my-2 rounded bg-slate-950 p-2 font-mono text-blue-300">
              s = [(1 - 2b₀) + j·(1 - 2b₁)] / √2
            </div>
            <p className="text-slate-400">
              • 00 → (+1 + 1j)/√2 &nbsp;&nbsp;&nbsp;&nbsp; 01 → (-1 + 1j)/√2<br />
              • 11 → (-1 - 1j)/√2 &nbsp;&nbsp;&nbsp;&nbsp; 10 → (+1 - 1j)/√2<br />
              • Symbol Energy: E_s = 1.0 &nbsp;&nbsp; Bit Energy: E_b = E_s / 2 = 0.5
            </p>
          </div>
        </div>
      </section>

      {/* Module 2: Wireless Propagation Channels */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Layers className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-bold text-slate-100">2. Channel Models & Propagation Effects</h3>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          {/* AWGN */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h4 className="font-semibold text-white mb-1">A. Additive White Gaussian Noise (AWGN)</h4>
            <p className="text-slate-400">
              AWGN models thermal noise present at the receiver antenna. Complex noise samples{' '}
              <span className="font-mono text-slate-200">w = w_I + j·w_Q</span> have zero mean and variance{' '}
              <span className="font-mono text-slate-200">σ² = N₀ / 2</span> per dimension:
            </p>
            <div className="my-2 rounded bg-slate-950 p-2 font-mono text-purple-300">
              σ = √( 1 / (2 · SNR_linear) ), &nbsp; where SNR_linear = 10^(SNR_dB / 10)
            </div>
            <p className="text-slate-400">
              Theoretical Bit Error Rate for BPSK in AWGN:
            </p>
            <div className="my-2 rounded bg-slate-950 p-2 font-mono text-emerald-400">
              P_b = Q( √(2·E_b/N₀) ) = 0.5 · erfc( √(SNR_linear) )
            </div>
          </div>

          {/* Rayleigh Fading */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h4 className="font-semibold text-white mb-1">B. Multipath Rayleigh Flat-Fading</h4>
            <p className="text-slate-400">
              When no dominant Line-of-Sight (NLOS) exists, multiple scattered paths interfere constructively and destructively.
              The complex channel coefficient <span className="font-mono text-slate-200">h = h_I + j·h_Q</span> is circularly symmetric complex Gaussian:
            </p>
            <div className="my-2 rounded bg-slate-950 p-2 font-mono text-purple-300">
              h_I, h_Q ~ N(0, 0.5) ⟹ E[|h|²] = 1.0 (Unit Average Gain)
            </div>
            <p className="text-slate-400">
              The envelope <span className="font-mono text-slate-200">r = |h|</span> follows a Rayleigh distribution:
            </p>
            <div className="my-2 rounded bg-slate-950 p-2 font-mono text-purple-300">
              p(r) = 2r · exp(-r²), &nbsp; for r ≥ 0
            </div>
            <p className="text-slate-400">
              Theoretical BER with perfect CSI and MMSE/ZF equalization:
            </p>
            <div className="my-2 rounded bg-slate-950 p-2 font-mono text-emerald-400">
              P_b = 0.5 · [ 1 - √( γ_b / (1 + γ_b) ) ], &nbsp; where γ_b = SNR_linear / (bits_per_symbol)
            </div>
          </div>

          {/* Path Loss & Doppler */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <h4 className="font-semibold text-white mb-1">C. Log-Distance Path Loss</h4>
              <p className="text-slate-400">
                Models large-scale signal decay over distance:
              </p>
              <div className="my-2 rounded bg-slate-950 p-2 font-mono text-blue-300">
                PL(d)[dB] = PL(d₀) + 10·n·log₁₀(d / d₀)
              </div>
              <p className="text-slate-400">
                Received power: <span className="font-mono text-slate-200">P_rx = P_tx - PL(d)</span>.<br />
                Effective SNR decreases by <span className="font-mono text-slate-200">10·n·log₁₀(d / d₀)</span> dB relative to reference distance d₀.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <h4 className="font-semibold text-white mb-1">D. Receiver Mobility & Doppler Spread</h4>
              <p className="text-slate-400">
                Maximum Doppler shift caused by mobile velocity v:
              </p>
              <div className="my-2 rounded bg-slate-950 p-2 font-mono text-cyan-300">
                f_D = (v · f_c) / c
              </div>
              <p className="text-slate-400">
                Coherence time: <span className="font-mono text-slate-200">T_c ≈ 0.423 / f_D</span>.<br />
                Temporal channel correlation follows Jakes Bessel function:{' '}
                <span className="font-mono text-slate-200">ρ = J₀(2π·f_D·T_s)</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Module 3: Receiver Detection & Equalization */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-slate-100">3. Receiver Detection & Performance Metrics</h3>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs leading-relaxed text-slate-300 space-y-3">
          <div>
            <h4 className="font-semibold text-white">Equalization Algorithms</h4>
            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <span className="font-semibold text-blue-300">Zero-Forcing (ZF) Detector:</span>
                <p className="mt-1 font-mono text-slate-400">x̂_ZF = y / h = (h* / |h|²) · y</p>
                <p className="mt-1 text-slate-500 text-[11px]">
                  Limitations: Deep fades (|h| → 0) cause severe noise amplification since noise term becomes w/h.
                </p>
              </div>
              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <span className="font-semibold text-emerald-300">MMSE Equalizer:</span>
                <p className="mt-1 font-mono text-slate-400">x̂_MMSE = [ h* / (|h|² + 1/SNR) ] · y</p>
                <p className="mt-1 text-slate-500 text-[11px]">
                  Optimally balances inverted channel distortion against noise variance to maximize SINR.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white">Throughput & Reliability Metrics</h4>
            <ul className="mt-1.5 space-y-1 text-slate-400">
              <li>• <strong className="text-slate-300">Empirical Bit Error Rate:</strong> BER = (Erroneous Bits) / (Total Transmitted Bits).</li>
              <li>• <strong className="text-slate-300">Effective Throughput (Goodput):</strong> R_eff = R_raw · (1 - BER), where R_raw = Symbol_Rate · bits_per_symbol.</li>
              <li>• <strong className="text-slate-300">Packet Success Rate (PSR):</strong> PSR = (1 - BER)^L, where L is frame length (default 1024 bits).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Module 4: Machine Learning & Cloud */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Cpu className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-100">4. Machine Learning & Cloud Storage Architecture</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs leading-relaxed text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h4 className="font-semibold text-white mb-2">Machine Learning Pipeline</h4>
            <p className="text-slate-400">
              • <strong className="text-slate-300">Ensemble Algorithm:</strong> Random Forest Classifier (100 estimators, max depth 12) & Regressor.<br />
              • <strong className="text-slate-300">Dataset Generation:</strong> 1,000 synthetic simulation points sampled systematically across SNR, distance, speed, and channels.<br />
              • <strong className="text-slate-300">Validation Split:</strong> 75% train / 25% test stratified split to prevent data leakage.<br />
              • <strong className="text-slate-300">Persistence:</strong> Joblib serialized models and JSON held-out evaluation reports.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h4 className="font-semibold text-white mb-2">Cloud Computing & Storage</h4>
            <p className="text-slate-400">
              • <strong className="text-slate-300">Local Mode:</strong> Thread-safe JSON file persistence for 100% offline university lab execution without cloud keys.<br />
              • <strong className="text-slate-300">Cloud Mode:</strong> Google Cloud Firestore integration via Firebase Admin SDK for multi-device historical synchronization.<br />
              • <strong className="text-slate-300">REST API:</strong> FastAPI endpoints with Pydantic v2 schemas and CSV export streams.
            </p>
          </div>
        </div>
      </section>

      {/* References & Textbooks */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg text-xs">
        <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
          <Bookmark className="h-4 w-4 text-amber-400" /> Academic Textbooks & Literature References
        </h4>
        <ol className="space-y-1.5 text-slate-400 list-decimal list-inside leading-relaxed">
          <li>
            <strong className="text-slate-200">John G. Proakis & Masoud Salehi</strong> (2008).{' '}
            <em>Digital Communications</em>, 5th Edition. McGraw-Hill.
          </li>
          <li>
            <strong className="text-slate-200">Theodore S. Rappaport</strong> (2002).{' '}
            <em>Wireless Communications: Principles and Practice</em>, 2nd Edition. Prentice Hall.
          </li>
          <li>
            <strong className="text-slate-200">Andrea Goldsmith</strong> (2005).{' '}
            <em>Wireless Communications</em>. Cambridge University Press.
          </li>
          <li>
            <strong className="text-slate-200">David Tse & Pramod Viswanath</strong> (2005).{' '}
            <em>Fundamentals of Wireless Communication</em>. Cambridge University Press.
          </li>
        </ol>
      </section>
    </div>
  );
};
