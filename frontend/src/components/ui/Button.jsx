const variants = {
  primary: 'bg-slate-950 text-white shadow-lg shadow-slate-950/20 hover:-translate-y-0.5 hover:bg-slate-800',
  accent: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30',
  secondary: 'border border-slate-200 bg-white text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white',
  ghost: 'text-slate-600 hover:bg-indigo-600 hover:text-white',
  subtle: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white',
  danger: 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:-translate-y-0.5 hover:bg-red-700',
};

const sizes = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
};

export default function Button({ children, className = '', variant = 'primary', size = 'md', loading = false, disabled = false, type = 'button', ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-2xl font-black tracking-tight transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
