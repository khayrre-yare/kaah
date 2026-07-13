export default function Card({ children, className = '', as: Component = 'div' }) {
  return (
    <Component className={`rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm transition ${className}`}>
      {children}
    </Component>
  );
}

export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div>
        <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
