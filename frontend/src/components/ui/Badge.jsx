const variants = {
  default: 'border-slate-200 bg-slate-100 text-slate-700',
  accent: 'border-blue-200 bg-blue-50 text-blue-700',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  purple: 'border-purple-200 bg-purple-50 text-purple-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  dark: 'border-slate-800 bg-slate-950 text-white',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
