export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.13),transparent_32rem),radial-gradient(circle_at_top_right,rgba(147,51,234,0.09),transparent_26rem),linear-gradient(135deg,rgba(15,23,42,0.03),transparent)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-indigo-700">{eyebrow}</p>}
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
          {description && <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{description}</p>}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </section>
  );
}
