import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

export default function EmptyState({ icon: Icon = BookOpen, title, description, actionLabel, onAction, actionTo }) {
  const content = (
    <>
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-indigo-50 text-indigo-700">
        <Icon size={30} />
      </span>
      <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-7 text-slate-500">{description}</p>}
    </>
  );

  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
      {content}
      {actionLabel && onAction && <Button variant="accent" className="mt-6" onClick={onAction}>{actionLabel}</Button>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
