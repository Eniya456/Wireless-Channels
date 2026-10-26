import React from 'react';

interface Props {
  type: 'modulation' | 'channel' | 'quality' | 'status';
  value: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<Props> = ({ type, value, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const valUpper = (value || '').toUpperCase();

  let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';

  if (type === 'modulation') {
    if (valUpper === 'BPSK') {
      colorClass = 'bg-blue-950/70 text-blue-300 border-blue-800';
    } else if (valUpper === 'QPSK') {
      colorClass = 'bg-indigo-950/70 text-indigo-300 border-indigo-800';
    }
  } else if (type === 'channel') {
    if (valUpper === 'AWGN') {
      colorClass = 'bg-teal-950/70 text-teal-300 border-teal-800';
    } else if (valUpper === 'RAYLEIGH') {
      colorClass = 'bg-purple-950/70 text-purple-300 border-purple-800';
    }
  } else if (type === 'quality') {
    if (valUpper === 'GOOD') {
      colorClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
    } else if (valUpper === 'MODERATE') {
      colorClass = 'bg-amber-950/70 text-amber-300 border-amber-800';
    } else if (valUpper === 'POOR') {
      colorClass = 'bg-rose-950/70 text-rose-300 border-rose-800';
    }
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium font-mono ${sizeClasses} ${colorClass}`}
    >
      {value}
    </span>
  );
};
