import React from 'react';

export function PageHeader({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{title}</h1>
        {description && <p className="text-slate-500 mt-1.5 text-sm sm:text-base font-medium">{description}</p>}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
        {description && <p className="text-slate-500 mt-1 text-sm font-medium">{description}</p>}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}

export function Card({ children, className = '', noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/75 shadow-sm overflow-hidden transition-all ${noPadding ? '' : 'p-5 sm:p-6'} ${className}`}>
      {children}
    </div>
  );
}

export function Toolbar({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  tone = 'emerald',
}: {
  icon: React.ReactNode,
  label: string,
  value: React.ReactNode,
  tone?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate',
}) {
  const toneStyles = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <Card className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${toneStyles[tone]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </Card>
  );
}

export function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'success'|'warning'|'danger'|'info'|'default', className?: string }) {
  const styles = {
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-rose-100 text-rose-800 border-rose-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
