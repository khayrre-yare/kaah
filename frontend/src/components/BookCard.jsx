import { BookOpen, LibraryBig, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { getBookCover } from '../utils/bookCovers';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function BookCard({ book, onBorrow, onAddToCart, showActions = true }) {
  const cover = getBookCover(book?.id);
  const inStock = Number(book?.quantity || 0) > 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-950/10">
      <div className="relative isolate flex min-h-64 items-center justify-center overflow-hidden bg-slate-100 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.18),transparent_30rem),linear-gradient(135deg,rgba(255,255,255,.75),rgba(238,242,255,.65))]" />
        <div className={`relative h-48 w-32 rounded-r-xl rounded-l-sm bg-gradient-to-br ${cover.bg} p-4 shadow-2xl transition duration-500 group-hover:-rotate-2 group-hover:scale-105`}>
          <div className="absolute inset-y-0 left-0 w-3 rounded-l-sm" style={{ backgroundColor: cover.spine }} />
          <div className="absolute inset-y-3 right-1 w-1 rounded-full bg-white/25" />
          <div className="relative flex h-full flex-col justify-between pl-3 text-white">
            <Badge className={`self-start border-white/20 bg-white/10 text-white ${cover.accent}`}>{book?.categoryName || 'Book'}</Badge>
            <div>
              <BookOpen className="mb-3 opacity-70" size={26} />
              <h3 className="line-clamp-3 text-sm font-black leading-tight">{book?.title || 'Untitled'}</h3>
              <p className="mt-2 line-clamp-1 text-[11px] font-semibold text-white/70">{book?.author || 'Unknown author'}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 h-5 w-32 rounded-full bg-slate-950/15 blur-lg" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to={`/books/${book?.id}`} className="line-clamp-1 text-base font-black tracking-tight text-slate-950 transition hover:text-indigo-700">{book?.title}</Link>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-500">{book?.author}</p>
          </div>
          <p className="shrink-0 text-lg font-black text-indigo-700">{money(book?.price)}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge variant={inStock ? 'success' : 'danger'}>{inStock ? `${book.quantity} in stock` : 'Out of stock'}</Badge>
          <span className="text-xs font-bold text-slate-400">#{book?.id}</span>
        </div>

        {showActions && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" disabled={!inStock} onClick={() => onBorrow?.(book)}><LibraryBig size={15} /> Borrow</Button>
            <Button variant="accent" size="sm" disabled={!inStock} onClick={() => onAddToCart?.(book)}>
              <ShoppingBag size={15} /> Buy
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
