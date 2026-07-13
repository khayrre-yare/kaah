const variants = {
  info: 'border-blue-200 bg-blue-50 text-blue-950',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  error: 'border-red-200 bg-red-50 text-red-950',
};

export default function Alert({ icon: Icon, title, children, variant = 'info', action }) {
  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-sm ${variants[variant] || variants.info}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          {Icon && <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/70"><Icon size={22} /></span>}
          <div>
            {title && <h3 className="font-black tracking-tight">{title}</h3>}
            {children && <div className="mt-1 text-sm font-semibold leading-6 opacity-80">{children}</div>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
