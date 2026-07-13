import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, LibraryBig, ShoppingBag } from 'lucide-react';
import { booksApi, borrowsApi } from '../api/client';
import { getBookCover } from '../utils/bookCovers';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function defaultReturnDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export default function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [returnDate, setReturnDate] = useState(defaultReturnDate());
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    async function loadBook() {
      setLoading(true);
      try {
        const data = await booksApi.getById(id);
        if (alive) setBook(data);
      } catch (error) {
        if (alive) {
          setBook(null);
          showToast(error.message, 'error');
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadBook();
    return () => {
      alive = false;
    };
  }, [id, showToast]);

  const inStock = Number(book?.quantity || 0) > 0;
  const cover = getBookCover(book?.id);

  const openBorrow = () => {
    if (!user) {
      showToast('Login first before borrowing a book.', 'info');
      navigate('/login');
      return;
    }
    setReturnDate(defaultReturnDate());
    setBorrowOpen(true);
  };

  const submitBorrow = async () => {
    setSubmitting(true);
    try {
      const selected = new Date(`${returnDate}T12:00:00`);
      await borrowsApi.create({ bookId: book.id, returnDate: selected.toISOString() });
      showToast('Borrow request sent. Please wait for admin approval.', 'info');
      setBorrowOpen(false);
      const fresh = await booksApi.getById(id);
      setBook(fresh);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const addToCart = () => {
    addItem(book);
    showToast(`${book.title} added to cart.`);
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-36" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <Skeleton className="h-[520px]" />
          <div>
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="mt-5 h-5 w-1/2" />
            <Skeleton className="mt-8 h-36" />
          </div>
        </div>
      </section>
    );
  }

  if (!book) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState icon={BookOpen} title="Book not found" description="The selected book could not be loaded from the catalog." />
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/books" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white">
          <ArrowLeft size={17} /> Back to books
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <Card className="relative isolate overflow-hidden p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.16),transparent_28rem)]" />
            <div className="relative flex min-h-[430px] items-center justify-center">
              <div className={`relative h-80 w-52 rounded-r-2xl rounded-l-md bg-gradient-to-br ${cover.bg} p-6 shadow-2xl`}>
                <div className="absolute inset-y-0 left-0 w-5 rounded-l-md" style={{ backgroundColor: cover.spine }} />
                <div className="relative flex h-full flex-col justify-between pl-5 text-white">
                  <Badge className="self-start border-white/20 bg-white/10 text-white">{book.categoryName || 'Book'}</Badge>
                  <div>
                    <BookOpen className="mb-4 opacity-75" size={34} />
                    <h1 className="text-xl font-black leading-tight">{book.title}</h1>
                    <p className="mt-3 text-sm font-semibold text-white/70">{book.author}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <div>
              <Badge variant={inStock ? 'success' : 'danger'}>{inStock ? `${book.quantity} available` : 'Out of stock'}</Badge>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{book.title}</h1>
              <p className="mt-3 text-lg font-bold text-slate-500">by {book.author}</p>
            </div>

            <Card className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Price</p>
                  <p className="mt-2 text-2xl font-black text-indigo-700">{money(book.price)}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Category</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{book.categoryName || 'Book'}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Book ID</p>
                  <p className="mt-2 text-lg font-black text-slate-950">#{book.id}</p>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" size="lg" disabled={!inStock} onClick={openBorrow}><LibraryBig size={18} /> Borrow</Button>
              <Button variant="accent" size="lg" disabled={!inStock} onClick={addToCart}><ShoppingBag size={18} /> Add to cart</Button>
            </div>
          </div>
        </div>
      </section>

      <Modal isOpen={borrowOpen} onClose={() => setBorrowOpen(false)} title="Borrow book" description={book.title}>
        <div className="space-y-5">
          <Input label="Return date" type="date" min={new Date().toISOString().slice(0, 10)} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} leftIcon={<CalendarDays size={18} />} />
          <Button variant="accent" className="w-full" loading={submitting} onClick={submitBorrow}>Request approval</Button>
        </div>
      </Modal>
    </>
  );
}
