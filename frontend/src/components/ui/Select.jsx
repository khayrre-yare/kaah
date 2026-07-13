import { ChevronDown } from 'lucide-react';

export default function Select({ label, error, className = '', children, ...props }) {
  return (
    <label className="block space-y-2">
      {label && <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>}
      <span className="relative block">
        <select
          className={`h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-11 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      </span>
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}
