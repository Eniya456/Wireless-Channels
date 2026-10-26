import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Send,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { MLEvaluation, MLPrediction } from '../types';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import { ConfusionMatrixChart } from '../charts/ConfusionMatrixChart';

export const MLAnalysisPage: React.FC = () => {
  const [evaluation, setEvaluation] = useState<MLEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interactive prediction form state
  const [predForm, setPredForm] = useState({
    snr_db: 15,
    modulation: 'BPSK',
    channel_type: 'AWGN',
    distance_m: 50,
    speed_mps: 0,
    path_loss_exponent: 3.0,
  });
  const [predResult, setPredResult] = useState<MLPrediction | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    api
      .getMLEvaluation()
      .then((data) => {
        if (!ignore) {
          setEvaluation(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setErrorMsg(err.message || 'Failed to load ML evaluation report.');
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    try {
      const res = await api.predictML(predForm);
      setPredResult(res);
    } catch (err: any) {
      alert(`Inference failed: ${err.message}`);
    } finally {
      setIsPredicting(false);
    }
  };

  const clf = evaluation?.classification;
  const reg = evaluation?.regression;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-0.5 text-xs text-emerald-400">
              <Cpu className="h-3.5 w-3.5" /> Supporting Machine Learning Intelligence
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
              Wireless Channel Quality Assessment & BER Regression
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Supervised pattern recognition trained directly on physical baseband simulation datasets
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-mono text-slate-300">
              Model Version: {evaluation?.version || '1.0.0'}
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-800 bg-rose-950/70 p-3 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <span>Loading trained machine learning models and metrics...</span>
        </div>
      )}

      {/* Evaluation Performance Metrics */}
      {evaluation && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            title="Classification Accuracy"
            value={`${((clf?.accuracy || 0) * 100).toFixed(1)}%`}
            subtitle="Held-out test set"
            variant="emerald"
          />
          <MetricCard
            title="Weighted F1-Score"
            value={(clf?.f1_score || 0).toFixed(4)}
            subtitle={`Precision: ${(clf?.precision || 0).toFixed(3)}`}
            variant="blue"
          />
          <MetricCard
            title="Regression MAE"
            value={(reg?.mae || 0).toFixed(6)}
            subtitle="Mean Absolute Error on BER"
            variant="amber"
          />
          <MetricCard
            title="Regression R²"
            value={(reg?.r2_score || 0).toFixed(4)}
            subtitle={`RMSE: ${(reg?.rmse || 0).toFixed(4)}`}
            variant="purple"
          />
        </div>
      )}

      {/* Main Grid: Confusion Matrix & Feature Importances */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Confusion Matrix (Left) */}
        <div className="lg:col-span-7">
          {clf && clf.confusion_matrix ? (
            <ConfusionMatrixChart
              matrix={clf.confusion_matrix}
              classes={evaluation?.classes || ['Good', 'Moderate', 'Poor']}
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
              Loading model evaluation report...
            </div>
          )}
        </div>

        {/* Feature Importance Rankings (Right) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur lg:col-span-5">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-100">Relative Feature Importances</h3>
            <p className="text-xs text-slate-400">
              Gini impurity reduction across Random Forest decision trees
            </p>
          </div>

          {clf?.feature_importances ? (
            <div className="space-y-3">
              {Object.entries(clf.feature_importances)
                .sort(([, a], [, b]) => b - a)
                .map(([feat, imp]) => {
                  const pct = Math.round(imp * 100);
                  const labels: Record<string, string> = {
                    effective_snr_db: 'Effective SNR (dB)',
                    distance_m: 'Distance (m)',
                    received_power_dbm: 'Received Power (dBm)',
                    path_loss_exponent: 'Path Loss Exponent',
                    doppler_shift_hz: 'Doppler Shift (Hz)',
                    speed_mps: 'Mobility Speed (m/s)',
                    is_rayleigh: 'Rayleigh Fading Flag',
                    is_qpsk: 'QPSK Modulation Flag',
                  };

                  return (
                    <div key={feat} className="text-xs">
                      <div className="mb-1 flex justify-between">
                        <span className="font-medium text-slate-300">
                          {labels[feat] || feat}
                        </span>
                        <span className="font-mono text-slate-400">{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No feature importances available.
            </div>
          )}

          {/* Classification Criteria Explanation */}
          <div className="mt-6 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 text-xs">
            <span className="font-semibold text-slate-300 block mb-1">
              Channel Quality Target Thresholds:
            </span>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>• <strong className="text-emerald-400">Good:</strong> BER &lt; 0.001 (Minimal error rate; VoIP/HD Video optimal)</li>
              <li>• <strong className="text-amber-400">Moderate:</strong> 0.001 ≤ BER ≤ 0.05 (Usable link; FEC/ARQ handles loss)</li>
              <li>• <strong className="text-rose-400">Poor:</strong> BER &gt; 0.05 (Severe corruption; connection degraded)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Online ML Inference Sandbox */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" /> Interactive ML Prediction Form
          </h3>
          <p className="text-xs text-slate-400">
            Submit candidate wireless parameters to evaluate online model classification and BER inference in real time.
          </p>
        </div>

        <form onSubmit={handlePredict} className="grid grid-cols-1 gap-4 md:grid-cols-6 text-xs">
          <div>
            <label className="text-slate-300 font-medium">Nominal SNR (dB)</label>
            <input
              type="number"
              step="0.5"
              value={predForm.snr_db}
              onChange={(e) => setPredForm({ ...predForm, snr_db: parseFloat(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium">Modulation</label>
            <select
              value={predForm.modulation}
              onChange={(e) => setPredForm({ ...predForm, modulation: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-200"
            >
              <option value="BPSK">BPSK</option>
              <option value="QPSK">QPSK</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium">Channel Type</label>
            <select
              value={predForm.channel_type}
              onChange={(e) => setPredForm({ ...predForm, channel_type: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-200"
            >
              <option value="AWGN">AWGN</option>
              <option value="RAYLEIGH">Rayleigh Fading</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium">Distance (m)</label>
            <input
              type="number"
              value={predForm.distance_m}
              onChange={(e) => setPredForm({ ...predForm, distance_m: parseFloat(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium">Speed (m/s)</label>
            <input
              type="number"
              value={predForm.speed_mps}
              onChange={(e) => setPredForm({ ...predForm, speed_mps: parseFloat(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-200"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isPredicting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPredicting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Predict Quality
            </button>
          </div>
        </form>

        {/* Prediction Results Banner */}
        {predResult && (
          <div className="mt-5 rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Predicted Quality:</span>
                    <Badge type="quality" value={predResult.predicted_channel_quality} size="md" />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-300">{predResult.quality_criteria}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Confidence</span>
                  <span className="font-bold text-white">
                    {((predResult.confidence_scores[predResult.predicted_channel_quality] || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Predicted BER</span>
                  <span className="font-bold text-emerald-400">{predResult.predicted_ber.toExponential(3)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Effective SNR</span>
                  <span className="font-bold text-amber-400">{predResult.derived_features.effective_snr_db} dB</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Doppler</span>
                  <span className="font-bold text-cyan-400">{predResult.derived_features.doppler_shift_hz} Hz</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model Disclaimer */}
      {evaluation?.disclaimer && (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-300 block mb-0.5">Scientific Validation Statement:</strong>
          {evaluation.disclaimer}
        </div>
      )}
    </div>
  );
};
