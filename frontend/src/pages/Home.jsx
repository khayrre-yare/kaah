import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { booksApi, borrowsApi, categoriesApi } from '../api/client';
import BookCard from '../components/BookCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { BookCardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=2400&q=90';

function defaultReturnDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function Stat({ value, label }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-slate-950/10 backdrop-blur">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-white/75">{label}</p>
    </div>
  );
}

export default function Home() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowBook, setBorrowBook] = useState(null);
  const [returnDate, setReturnDate] = useState(defaultReturnDate());
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [bookData, categoryData] = await Promise.all([
          booksApi.getAll(),
          categoriesApi.getAll(),
        ]);

        if (alive) {
          setBooks(bookData || []);
          setCategories(categoryData || []);
        }
      } catch {
        if (alive) {
          setBooks([]);
          setCategories([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const featuredBooks = useMemo(() => books.slice(0, 4), [books]);
  const available = books.reduce((sum, book) => sum + Number(book.quantity || 0), 0);

  const openBorrow = (book) => {
    if (!user) {
      showToast('Login first, then send a borrow request.', 'info');
      navigate('/login');
      return;
    }
    setBorrowBook(book);
    setReturnDate(defaultReturnDate());
  };

  const buyBook = (book) => {
    addItem(book);
    showToast(`${book.title} added to cart. Checkout will request admin approval.`, 'info');
  };

  const submitBorrow = async () => {
    if (!borrowBook) return;
    setSubmitting(true);
    try {
      const selected = new Date(`${returnDate}T12:00:00`);
      await borrowsApi.create({ bookId: borrowBook.id, returnDate: selected.toISOString() });
      showToast('Borrow request sent. Wait for admin approval.', 'info');
      setBorrowBook(null);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-slate-950">
        <img src={HERO_IMAGE_URL} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,.88),rgba(30,41,59,.58),rgba(79,70,229,.18)),radial-gradient(circle_at_70%_20%,rgba(147,51,234,.22),transparent_28rem)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl animate-fade-up">
            <Badge variant="dark" className="border-white/15 bg-white/10 text-white">
              <Sparkles size={13} />
              Welcome to Kaah Library
            </Badge>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Find your next favorite book.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Raadso buug, dir request amaah ama iibsi, kadib admin ayaa kuu fasaxaya.
              Wax walba si cad ayay uga muuqanayaan dashboard-kaaga.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/books" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5">
                Browse Catalog <ArrowRight size={18} />
              </Link>
              <Link to={user ? '/dashboard' : '/login'} className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15">
                My Books
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat value={books.length} label="Books" />
              <Stat value={categories.length} label="Genres" />
              <Stat value={available} label="Copies" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-700">New arrivals</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Pick a book from the front shelf
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Borrow sends an approval request. Buy adds the book to cart, then checkout sends an order approval request.
            </p>
          </div>

          <Link to="/books" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-indigo-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white">
            View all books
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <BookCardSkeleton key={item} />)}
          </div>
        ) : featuredBooks.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} onBorrow={openBorrow} onAddToCart={buyBook} showActions />
            ))}
          </div>
        ) : (
          <EmptyState icon={BookOpen} title="Books coming soon" description="Books will appear here as soon as they are available." />
        )}
      </section>

      <section id="about" className="border-y border-slate-200/80 bg-white/70 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-700">About Kaah Library</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              A modern library workflow for members and admins.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Kaah Library waxay isku xirtaa catalog-ka buugaagta, borrow requests, buy orders, admin approvals, iyo member dashboards. User-ku wuxuu arkaa buugaagtiisa, admin-kuna wuxuu si cad u maamulaa stock, members, iyo requests.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <BookOpen className="text-indigo-600" size={22} />
                <p className="mt-3 text-sm font-black text-slate-950">Live Catalog</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Books and categories from your backend.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <UsersRound className="text-purple-600" size={22} />
                <p className="mt-3 text-sm font-black text-slate-950">Member Flow</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Borrow, buy, track, and return books.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Sparkles className="text-blue-600" size={22} />
                <p className="mt-3 text-sm font-black text-slate-950">Admin Control</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Approve requests and manage users.</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
            <img
              src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=85"
              alt="Modern library shelves"
              className="h-80 w-full object-cover"
            />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div className="rounded-2xl bg-indigo-50 p-4">
                <p className="text-2xl font-black text-indigo-700">{books.length}</p>
                <p className="mt-1 text-xs font-bold text-indigo-500">Books</p>
              </div>
              <div className="rounded-2xl bg-purple-50 p-4">
                <p className="text-2xl font-black text-purple-700">{categories.length}</p>
                <p className="mt-1 text-xs font-bold text-purple-500">Genres</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-2xl font-black text-blue-700">{available}</p>
                <p className="mt-1 text-xs font-bold text-blue-500">Copies</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-700">Contact</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Need help from the library team?</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Wixii ku saabsan login, borrow approval, buy orders, ama book returns, library team-ka si fudud ayaad ula xiriiri kartaa.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <a href="mailto:info@kaahlibrary.com" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white">
              <Mail size={22} />
              <p className="mt-4 text-sm font-black">Email</p>
              <p className="mt-1 text-xs font-semibold opacity-75">info@kaahlibrary.com</p>
            </a>
            <a href="tel:+252610000000" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white">
              <Phone size={22} />
              <p className="mt-4 text-sm font-black">Phone</p>
              <p className="mt-1 text-xs font-semibold opacity-75">+252 61 000 0000</p>
            </a>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <MapPin size={22} className="text-indigo-600" />
              <p className="mt-4 text-sm font-black text-slate-950">Location</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Kaah Library Center</p>
            </div>
          </div>
        </div>
      </section>

      <Modal isOpen={Boolean(borrowBook)} onClose={() => setBorrowBook(null)} title="Request borrow approval" description={borrowBook?.title}>
        <div className="space-y-5">
          <Input label="Return date" type="date" min={new Date().toISOString().slice(0, 10)} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} leftIcon={<CalendarDays size={18} />} />
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-semibold leading-7 text-indigo-950">
            Admin approval ayaa loo diri doonaa. Buugga stock-kiisa lama jarayo ilaa la fasaxo.
          </div>
          <Button variant="accent" className="w-full" loading={submitting} onClick={submitBorrow}>Send request</Button>
        </div>
      </Modal>
    </>
  );
}
