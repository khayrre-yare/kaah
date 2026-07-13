export default function Input({ label, error, className = '', leftIcon, helper, ...props }) {
  return (
    <label className="block space-y-2">
      {label && <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>}
      <span className="relative block">
        {leftIcon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</span>}
        <input
          className={`h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${leftIcon ? 'pl-11' : ''} ${className}`}
          {...props}
        />
      </span>
      {helper && !error && <span className="text-xs font-semibold text-slate-500">{helper}</span>}
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}
