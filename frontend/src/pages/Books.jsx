import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, LibraryBig, Plus, SlidersHorizontal } from 'lucide-react';
import { booksApi, borrowsApi, categoriesApi } from '../api/client';
import BookCard from '../components/BookCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import SearchBar from '../components/ui/SearchBar';
import Select from '../components/ui/Select';
import { BookCardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export default function Books() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [stock, setStock] = useState('all');
  const [page, setPage] = useState(1);
  const [borrowBook, setBorrowBook] = useState(null);
  const [returnDate, setReturnDate] = useState(tomorrowDate());
  const [submitting, setSubmitting] = useState(false);
  const { user, isAdmin } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadBooks = async () => {
    setLoading(true);
    try {
      const [bookData, categoryData] = await Promise.all([booksApi.getAll(), categoriesApi.getAll()]);
      setBooks(bookData || []);
      setCategories(categoryData || []);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBooks(); }, []);
  useEffect(() => { setPage(1); }, [query, category, stock]);

  const filteredBooks = useMemo(() => {
    const text = query.trim().toLowerCase();
    return books.filter((book) => {
      const matchesText = !text || [book.title, book.author, book.categoryName].some((value) => value?.toLowerCase().includes(text));
      const matchesCategory = category === 'all' || String(book.categoryId) === String(category);
      const matchesStock = stock === 'all' || (stock === 'available' ? Number(book.quantity) > 0 : Number(book.quantity) <= 0);
      return matchesText && matchesCategory && matchesStock;
    });
  }, [books, query, category, stock]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  const visibleBooks = filteredBooks.slice((page - 1) * pageSize, page * pageSize);

  const openBorrow = (book) => {
    if (!user) {
      showToast('Login first before borrowing a book.', 'info');
      navigate('/login');
      return;
    }
    setBorrowBook(book);
    setReturnDate(tomorrowDate());
  };

  const addToCart = (book) => {
    addItem(book);
    showToast(`${book.title} added to cart.`);
  };

  const submitBorrow = async () => {
    if (!borrowBook) return;
    setSubmitting(true);
    try {
      const selected = new Date(`${returnDate}T12:00:00`);
      await borrowsApi.create({ bookId: borrowBook.id, returnDate: selected.toISOString() });
      showToast('Borrow request sent. Please wait for admin approval.', 'info');
      setBorrowBook(null);
      await loadBooks();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Library Catalog"
        title="Explore books"
        description="Search, filter, borrow, or purchase books from your live library catalog."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Badge variant="accent">{filteredBooks.length} books visible</Badge>
          {isAdmin && (
            <Link to="/admin" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5">
              <Plus size={17} /> Add Book
            </Link>
          )}
        </div>
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_180px]">
          <SearchBar aria-label="Search books" placeholder="Search title, author, category..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <Select aria-label="Stock filter" value={stock} onChange={(event) => setStock(event.target.value)}>
            <option value="all">All stock</option>
            <option value="available">Available</option>
            <option value="out">Out of stock</option>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <BookCardSkeleton key={item} />)}
          </div>
        ) : filteredBooks.length ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleBooks.map((book) => <BookCard key={book.id} book={book} onBorrow={openBorrow} onAddToCart={addToCart} />)}
            </div>
            <div className="mt-8">
              <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState icon={LibraryBig} title="No matching books" description="Change the search or filter. Admin users can add books from the Admin Panel." />
        )}
      </section>

      <Modal isOpen={Boolean(borrowBook)} onClose={() => setBorrowBook(null)} title="Borrow book" description={borrowBook?.title}>
        <div className="space-y-5">
          <Input label="Return date" type="date" min={new Date().toISOString().slice(0, 10)} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} leftIcon={<CalendarDays size={18} />} />
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-semibold leading-7 text-indigo-950">
            Confirm the expected return date before submitting this borrow request.
          </div>
          <Button variant="accent" className="w-full" loading={submitting} onClick={submitBorrow}>Request approval</Button>
        </div>
      </Modal>
    </>
  );
}
