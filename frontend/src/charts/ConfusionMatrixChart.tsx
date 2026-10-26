import React from 'react';

interface Props {
  matrix: number[][];
  classes: string[];
}

export const ConfusionMatrixChart: React.FC<Props> = ({
  matrix = [
    [129, 4, 0],
    [16, 23, 6],
    [4, 2, 66],
  ],
  classes = ['Good', 'Moderate', 'Poor'],
}) => {
  // Compute totals
  const total = matrix.flat().reduce((a, b) => a + b, 0);

  // Maximum cell value for color intensity
  const maxVal = Math.max(...matrix.flat(), 1);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-100">Confusion Matrix (Held-Out Test Set)</h3>
        <p className="text-xs text-slate-400">
          Evaluates multi-class prediction accuracy across ground-truth channel conditions (N = {total})
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="flex flex-col items-center">
            <span className="mb-2 text-xs font-semibold tracking-wider text-blue-400 uppercase">
              Predicted Class
            </span>

            <div className="flex items-center">
              <span className="-rotate-90 mr-2 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                Actual Class
              </span>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                {/* Header Row */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium text-slate-400">
                  <div className="w-20" />
                  {classes.map((cls) => (
                    <div key={cls} className="w-24 py-1 font-semibold text-slate-300">
                      {cls}
                    </div>
                  ))}
                </div>

                {/* Matrix Rows */}
                {matrix.map((row, i) => (
                  <div key={classes[i]} className="grid grid-cols-4 items-center gap-2 py-1 text-center text-xs">
                    <div className="w-20 pr-2 text-right font-semibold text-slate-300">
                      {classes[i]}
                    </div>
                    {row.map((val, j) => {
                      const isDiagonal = i === j;
                      const intensity = Math.min(1, Math.max(0.15, val / maxVal));
                      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';

                      return (
                        <div
                          key={`${i}-${j}`}
                          style={{
                            backgroundColor: isDiagonal
                              ? `rgba(16, 185, 129, ${intensity * 0.85})`
                              : val > 0
                              ? `rgba(239, 68, 68, ${intensity * 0.75})`
                              : 'rgba(30, 41, 59, 0.4)',
                          }}
                          className={`flex h-14 w-24 flex-col items-center justify-center rounded-md border font-mono transition-transform hover:scale-105 ${
                            isDiagonal
                              ? 'border-emerald-500/50 text-white font-bold'
                              : val > 0
                              ? 'border-rose-500/40 text-rose-200'
                              : 'border-slate-800 text-slate-500'
                          }`}
                        >
                          <span className="text-sm">{val}</span>
                          <span className="text-[10px] opacity-80">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-500/80" /> Correct Predictions (True Positives)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-500/70" /> Classification Errors
          </span>
        </div>
        <span>Total Test Samples: <strong className="text-slate-200">{total}</strong></span>
      </div>
    </div>
  );
};
