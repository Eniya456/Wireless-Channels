import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate';
}

export const MetricCard: React.FC<Props> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  variant = 'blue',
}) => {
  const variantStyles = {
    blue: 'border-blue-900/40 bg-slate-900/80 text-blue-400',
    emerald: 'border-emerald-900/40 bg-slate-900/80 text-emerald-400',
    amber: 'border-amber-900/40 bg-slate-900/80 text-amber-400',
    purple: 'border-purple-900/40 bg-slate-900/80 text-purple-400',
    slate: 'border-slate-800 bg-slate-900/80 text-slate-400',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 shadow-md backdrop-blur transition-all duration-200 hover:border-slate-700 ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          {title}
        </span>
        {Icon && <Icon className="h-4 w-4 opacity-75" />}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-bold tracking-tight text-slate-100">
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>

      {subtitle && (
        <p className="mt-1 truncate text-xs text-slate-400" title={subtitle}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
