import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, description, children, size = 'md' }) {
  if (!isOpen) return null;

  const maxWidth = size === 'xl' ? 'max-w-5xl' : size === 'lg' ? 'max-w-3xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} aria-label="Close modal" />
      <section className={`relative max-h-[92vh] w-full ${maxWidth} animate-scale-in overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl`}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
            {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
          </div>
          <button onClick={onClose} className="focus-ring rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[72vh] overflow-y-auto p-6">{children}</div>
      </section>
    </div>
  );
}
