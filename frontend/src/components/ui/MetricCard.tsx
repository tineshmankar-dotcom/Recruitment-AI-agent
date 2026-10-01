import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = 'indigo',
}: MetricCardProps) {
  const schemeStyles = {
    indigo: 'from-indigo-500/10 to-blue-500/5 text-indigo-600 border-indigo-100 dark:border-indigo-900/40 dark:text-indigo-400',
    emerald: 'from-emerald-500/10 to-teal-500/5 text-emerald-600 border-emerald-100 dark:border-emerald-900/40 dark:text-emerald-400',
    amber: 'from-amber-500/10 to-orange-500/5 text-amber-600 border-amber-100 dark:border-amber-900/40 dark:text-amber-400',
    purple: 'from-purple-500/10 to-violet-500/5 text-purple-600 border-purple-100 dark:border-purple-900/40 dark:text-purple-400',
    rose: 'from-rose-500/10 to-red-500/5 text-rose-600 border-rose-100 dark:border-rose-900/40 dark:text-rose-400',
    slate: 'from-slate-500/10 to-zinc-500/5 text-slate-600 border-slate-100 dark:border-slate-800 dark:text-slate-400',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${schemeStyles[colorScheme]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
