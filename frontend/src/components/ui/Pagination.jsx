import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex flex-col items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm sm:flex-row" aria-label="Pagination">
      <p className="text-sm font-bold text-slate-500">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-2">
        <button className="focus-ring grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 7).map((item) => (
          <button key={item} className={`focus-ring grid h-10 min-w-10 place-items-center rounded-2xl px-3 text-sm font-black transition ${item === page ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white' : 'border border-slate-200 text-slate-600 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white'}`} onClick={() => onPageChange(item)}>
            {item}
          </button>
        ))}
        <button className="focus-ring grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}
