import { useEffect, useMemo, useState } from 'react';
import { Activity, BookOpen, BookPlus, Boxes, CheckCircle2, CircleAlert, FolderOpen, Pencil, Plus, RefreshCw, ShoppingBag, Trash2, UserRoundCheck, UsersRound, WalletCards } from 'lucide-react';
import { booksApi, borrowsApi, categoriesApi, ordersApi, usersApi } from '../api/client';
import DashboardShell from '../components/layout/DashboardShell';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

const emptyBook = { title: '', author: '', price: '', quantity: '', categoryId: '' };

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

function AdminMetric({ icon: Icon, label, value, detail, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    purple: 'bg-purple-50 text-purple-700 ring-purple-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  };

  return (
    <Card className="p-5 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10">
      <div className="flex items-start justify-between gap-4">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 ${tones[tone] || tones.indigo}`}>
          <Icon size={22} />
        </span>
        <Badge variant="default">Live</Badge>
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-black text-slate-700">{label}</p>
      {detail && <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{detail}</p>}
    </Card>
  );
}

function ApprovalItem({ kind, title, user, meta, detail, approveLoading, rejectLoading, onApprove, onReject }) {
  const isBorrow = kind === 'Borrow';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Badge variant={isBorrow ? 'warning' : 'indigo'}>{kind} request</Badge>
          <h3 className="mt-3 line-clamp-1 font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{user}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{meta}</p>
          {detail && <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{detail}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="accent" loading={approveLoading} onClick={onApprove}>Approve</Button>
          <Button size="sm" variant="danger" loading={rejectLoading} onClick={onReject}>Reject</Button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyBook);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookData, categoryData, userData, borrowData, orderData] = await Promise.all([
        booksApi.getAll(),
        categoriesApi.getAll(),
        usersApi.getAll(),
        borrowsApi.getAll(),
        ordersApi.getAll(),
      ]);
      setBooks(bookData || []);
      setCategories(categoryData || []);
      setUsers(userData || []);
      setBorrows(borrowData || []);
      setOrders(orderData || []);
      return { books: bookData || [], categories: categoryData || [] };
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const firstCategoryId = categories[0]?.id || '';
  const hasCategories = categories.length > 0;

  const stats = useMemo(() => ({
    stock: books.reduce((sum, book) => sum + Number(book.quantity || 0), 0),
    value: books.reduce((sum, book) => sum + Number(book.price || 0) * Number(book.quantity || 0), 0),
    outOfStock: books.filter((book) => Number(book.quantity || 0) <= 0).length,
    borrowed: borrows.length,
    activeBorrows: borrows.filter((borrow) => borrow.status === 'Approved' || borrow.status === 'Active').length,
    boughtCopies: orders.filter((order) => order.status === 'Approved').reduce((sum, order) => sum + (order.details || []).reduce((detailSum, item) => detailSum + Number(item.quantity || 0), 0), 0),
  }), [books, borrows, orders]);

  const pendingBorrows = useMemo(() => borrows.filter((borrow) => borrow.status === 'Pending'), [borrows]);
  const pendingOrders = useMemo(() => orders.filter((order) => order.status === 'Pending'), [orders]);
  const approvalsTotal = pendingBorrows.length + pendingOrders.length;
  const lowStock = books.filter((book) => Number(book.quantity || 0) > 0 && Number(book.quantity || 0) <= 2).length;
  const approvedOrders = orders.filter((order) => order.status === 'Approved');
  const approvedRevenue = approvedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const adminMetrics = [
    { icon: UsersRound, label: 'Registered users', value: users.length, detail: 'All accounts currently visible to admin.', tone: 'indigo' },
    { icon: BookOpen, label: 'Catalog books', value: books.length, detail: `${categories.length} categories connected.`, tone: 'blue' },
    { icon: Boxes, label: 'Available copies', value: stats.stock, detail: `${lowStock} low stock · ${stats.outOfStock} out of stock.`, tone: 'amber' },
    { icon: UserRoundCheck, label: 'Borrowed now', value: stats.activeBorrows, detail: 'Books currently approved and in use.', tone: 'purple' },
    { icon: ShoppingBag, label: 'Bought copies', value: stats.boughtCopies, detail: `${approvedOrders.length} approved orders.`, tone: 'emerald' },
    { icon: WalletCards, label: 'Revenue approved', value: money(approvedRevenue), detail: `Inventory value ${money(stats.value)}.`, tone: 'slate' },
  ];

  const memberRows = useMemo(() => users.map((user) => {
    const userId = user.id || user.Id;
    const userBorrows = borrows.filter((borrow) => String(borrow.userId) === String(userId));
    const userOrders = orders.filter((order) => String(order.userId) === String(userId));
    const activeBooks = userBorrows.filter((borrow) => borrow.status === 'Approved' || borrow.status === 'Active');
    const pendingBooks = userBorrows.filter((borrow) => borrow.status === 'Pending');
    const boughtBooks = userOrders.filter((order) => order.status === 'Approved').flatMap((order) => (order.details || []).map((item) => ({
      ...item,
      orderId: order.id,
      orderDate: order.orderDate,
    })));
    const pendingOrders = userOrders.filter((order) => order.status === 'Pending');

    return {
      ...user,
      userBorrows,
      activeBooks,
      pendingBooks,
      pendingOrders,
      returnedCount: userBorrows.filter((borrow) => borrow.status === 'Returned').length,
      boughtBooks,
      boughtCopies: boughtBooks.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      totalSpent: userOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    };
  }), [users, borrows, orders]);

  const openCreate = (type) => {
    setModal({ type, mode: 'create' });
    setForm(type === 'book' ? { ...emptyBook, categoryId: firstCategoryId } : { name: '' });
  };

  const handleAddBook = () => {
    if (!hasCategories) {
      setTab('categories');
      setModal({ type: 'category', mode: 'create', thenBook: true });
      setForm({ name: '' });
      showToast('Create a category first, then add the book.', 'info');
      return;
    }
    openCreate('book');
  };

  const openEdit = (type, item) => {
    setModal({ type, mode: 'edit', id: item.id });
    setForm(type === 'book'
      ? {
        title: item.title || '',
        author: item.author || '',
        price: item.price || '',
        quantity: item.quantity || '',
        categoryId: item.categoryId || firstCategoryId,
      }
      : { name: item.name || '' });
  };

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (modal.type === 'book') {
        if (!hasCategories || !form.categoryId) throw new Error('Create a category first before adding books.');
        if (!normalizeText(form.title) || !normalizeText(form.author)) throw new Error('Title and author are required.');
        if (Number(form.price) < 0 || Number(form.quantity) < 0) throw new Error('Price and quantity cannot be negative.');

        if (modal.mode === 'create') await booksApi.create(form);
        else await booksApi.update(modal.id, form);
      } else {
        if (!normalizeText(form.name)) throw new Error('Category name is required.');
        if (modal.mode === 'create') await categoriesApi.create(form);
        else await categoriesApi.update(modal.id, form);
      }

      showToast(modal.mode === 'create' ? 'Created successfully.' : 'Updated successfully.');
      const shouldOpenBook = modal.type === 'category' && modal.thenBook;
      setModal(null);
      const fresh = await loadData();
      if (shouldOpenBook) {
        const nextCategoryId = fresh?.categories?.[0]?.id || '';
        setTab('books');
        setTimeout(() => {
          setModal({ type: 'book', mode: 'create' });
          setForm({ ...emptyBook, categoryId: nextCategoryId });
        }, 250);
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = (type, id) => setPendingDelete({ type, id });

  const decideApproval = async (type, id, decision) => {
    setApprovalAction(`${type}-${id}-${decision}`);
    try {
      if (type === 'borrow') {
        if (decision === 'approve') await borrowsApi.approve(id);
        else await borrowsApi.reject(id);
      } else if (decision === 'approve') await ordersApi.approve(id);
      else await ordersApi.reject(id);

      showToast(decision === 'approve' ? 'Request approved successfully.' : 'Request rejected successfully.');
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setApprovalAction(null);
    }
  };

  const confirmRemove = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.type === 'book') await booksApi.delete(pendingDelete.id);
      else if (pendingDelete.type === 'category') await categoriesApi.delete(pendingDelete.id);
      else await usersApi.delete(pendingDelete.id);
      showToast('Deleted successfully.');
      setPendingDelete(null);
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const modalTitle = modal?.type === 'book'
    ? (modal?.mode === 'create' ? 'Add new book' : 'Edit book')
    : (modal?.mode === 'create' ? 'Add category' : 'Edit category');

  return (
    <DashboardShell title="Admin Panel">
      <PageHeader
        eyebrow="Admin command center"
        title="Library operations dashboard"
        description="Approve requests, monitor inventory, track members, and keep the library workflow organized from one place."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => openCreate('category')}><Plus size={18} /> Add Category</Button>
          <Button variant="accent" onClick={handleAddBook}><BookPlus size={18} /> Add Book</Button>
        </div>
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
          <Card className="overflow-hidden border-indigo-200 shadow-xl shadow-indigo-950/10">
            <div className="relative overflow-hidden bg-slate-950 p-6 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,.42),transparent_26rem),radial-gradient(circle_at_80%_10%,rgba(147,51,234,.32),transparent_22rem)]" />
              <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div>
                  <Badge className="border-white/15 bg-white/10 text-white">
                    <Activity size={13} /> Live operations
                  </Badge>
                  <h2 className="mt-5 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">Admin dashboard</h2>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
                    Requests, stock, members, borrowed books, and sales are organized here so approval decisions are clear.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-2xl font-black">{approvalsTotal}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/65">Pending</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-2xl font-black">{stats.activeBorrows}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/65">Borrowed</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-2xl font-black">{stats.stock}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/65">Copies</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 bg-white p-4 sm:grid-cols-3">
              <button onClick={() => setTab('books')} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white">
                <BookOpen size={20} />
                <span><span className="block text-sm font-black">Inventory</span><span className="block text-xs font-semibold opacity-75">Books and stock</span></span>
              </button>
              <button onClick={() => setTab('members')} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white">
                <UsersRound size={20} />
                <span><span className="block text-sm font-black">Members</span><span className="block text-xs font-semibold opacity-75">Activity and books</span></span>
              </button>
              <button onClick={loadData} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white">
                <RefreshCw size={20} />
                <span><span className="block text-sm font-black">Refresh</span><span className="block text-xs font-semibold opacity-75">Sync latest data</span></span>
              </button>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-xl shadow-slate-950/5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-black text-slate-950">Approval queue</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Borrow and buy requests waiting for admin action.</p>
              </div>
              <Badge variant={approvalsTotal ? 'warning' : 'success'}>{approvalsTotal} pending</Badge>
            </div>
            <div className="max-h-[29rem] space-y-3 overflow-y-auto p-4">
              {loading ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-28" />) : approvalsTotal ? (
                <>
                  {pendingBorrows.map((borrow) => (
                    <ApprovalItem
                      key={`borrow-${borrow.id}`}
                      kind="Borrow"
                      title={borrow.bookTitle || `Book #${borrow.bookId}`}
                      user={`User: ${borrow.userName || `#${borrow.userId}`}`}
                      meta={`Return: ${formatDate(borrow.returnDate)}`}
                      approveLoading={approvalAction === `borrow-${borrow.id}-approve`}
                      rejectLoading={approvalAction === `borrow-${borrow.id}-reject`}
                      onApprove={() => decideApproval('borrow', borrow.id, 'approve')}
                      onReject={() => decideApproval('borrow', borrow.id, 'reject')}
                    />
                  ))}
                  {pendingOrders.map((order) => (
                    <ApprovalItem
                      key={`order-${order.id}`}
                      kind="Order"
                      title={`Order #${order.id}`}
                      user={`User: ${order.userName || `#${order.userId}`}`}
                      meta={`${order.details?.length || 0} items · ${money(order.total)}`}
                      detail={order.details?.map((item) => `${item.bookTitle} x${item.quantity}`).join(', ')}
                      approveLoading={approvalAction === `order-${order.id}-approve`}
                      rejectLoading={approvalAction === `order-${order.id}-reject`}
                      onApprove={() => decideApproval('order', order.id, 'approve')}
                      onReject={() => decideApproval('order', order.id, 'reject')}
                    />
                  ))}
                </>
              ) : (
                <EmptyState icon={CheckCircle2} title="Queue is clear" description="No borrow or purchase requests are waiting right now." />
              )}
            </div>
          </Card>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {adminMetrics.map((item) => <AdminMetric key={item.label} {...item} />)}
        </div>

        {!hasCategories && !loading && (
          <div className="mb-8">
            <Alert
              icon={CircleAlert}
              title="Create a category first"
              variant="warning"
              action={<Button variant="primary" onClick={() => openCreate('category')}><Plus size={17} /> Create Category</Button>}
            >
              A book cannot be saved until a category is available.
            </Alert>
          </div>
        )}

        <div className="mb-6 flex flex-col justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1">
            <button onClick={() => setTab('books')} className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${tab === 'books' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:text-white' : 'text-slate-500 hover:bg-indigo-600 hover:text-white'}`}><BookOpen size={17} /> Books</button>
            <button onClick={() => setTab('categories')} className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${tab === 'categories' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:text-white' : 'text-slate-500 hover:bg-indigo-600 hover:text-white'}`}><FolderOpen size={17} /> Categories</button>
            <button onClick={() => setTab('members')} className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${tab === 'members' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:text-white' : 'text-slate-500 hover:bg-indigo-600 hover:text-white'}`}><UsersRound size={17} /> Members</button>
          </div>
          <Button variant="ghost" onClick={loadData}><RefreshCw size={17} /> Refresh</Button>
        </div>

        {tab === 'books' ? (
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
              <h2 className="text-lg font-black text-slate-950">Books inventory</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Add, edit, and delete records saved in Neon through your backend.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-white text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  <tr><th className="px-6 py-4">Book</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? <tr><td colSpan="5" className="px-6 py-8"><Skeleton className="h-16" /></td></tr> : books.length ? books.map((book) => (
                    <tr key={book.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4"><p className="font-black text-slate-950">{book.title}</p><p className="text-sm font-semibold text-slate-500">{book.author}</p></td>
                      <td className="px-6 py-4"><Badge variant="accent">{book.categoryName || 'No category'}</Badge></td>
                      <td className="px-6 py-4 font-black text-blue-700">{money(book.price)}</td>
                      <td className="px-6 py-4"><Badge variant={book.quantity > 0 ? 'success' : 'danger'}>{book.quantity}</Badge></td>
                      <td className="px-6 py-4"><div className="flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => openEdit('book', book)}><Pencil size={15} /></Button><Button variant="danger" size="sm" onClick={() => remove('book', book.id)}><Trash2 size={15} /></Button></div></td>
                    </tr>
                  )) : <tr><td colSpan="5" className="px-6 py-10"><EmptyState icon={BookOpen} title="No books yet" description="Create a category first, then add your first book." /></td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        ) : tab === 'categories' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-28" />) : categories.length ? categories.map((categoryItem) => (
              <Card key={categoryItem.id} className="flex items-center justify-between p-5 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10">
                <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><FolderOpen size={22} /></span><div><p className="font-black text-slate-950">{categoryItem.name}</p><p className="text-xs font-bold text-slate-400">Category #{categoryItem.id}</p></div></div>
                <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => openEdit('category', categoryItem)}><Pencil size={15} /></Button><Button variant="danger" size="sm" onClick={() => remove('category', categoryItem.id)}><Trash2 size={15} /></Button></div>
              </Card>
            )) : <div className="sm:col-span-2 lg:col-span-3"><EmptyState icon={FolderOpen} title="No categories yet" description="Add a category before saving books." actionLabel="Add Category" onAction={() => openCreate('category')} /></div>}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
              <h2 className="text-lg font-black text-slate-950">Members activity</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Qof kasta ka arag buugaagta uu amaahday, kuwa uu celiyay, iyo kuwa uu gatay.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead className="bg-white text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Borrowed now</th>
                    <th className="px-6 py-4">Bought</th>
                    <th className="px-6 py-4">Total spent</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? <tr><td colSpan="7" className="px-6 py-8"><Skeleton className="h-16" /></td></tr> : memberRows.length ? memberRows.map((member) => (
                    <tr key={member.id || member.Id} className="align-top transition hover:bg-slate-50/70">
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-950">{member.fullName || member.FullName || 'User'}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{member.email || member.Email}</p>
                        {member.userBorrows.length > 0 && (
                          <div className="mt-3 flex max-w-md flex-wrap gap-2">
                            {member.userBorrows.slice(0, 4).map((borrow) => (
                              <Badge key={borrow.id} variant={borrow.status === 'Returned' ? 'success' : 'warning'}>
                                {borrow.bookTitle || `Book #${borrow.bookId}`}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5"><Badge variant={(member.role || member.Role) === 'Admin' ? 'purple' : 'indigo'}>{member.role || member.Role || 'User'}</Badge></td>
                      <td className="px-6 py-5">
                        <p className="text-lg font-black text-indigo-700">{member.activeBooks.length}</p>
                        <p className="text-xs font-bold text-slate-400">{member.pendingBooks.length} pending · {member.returnedCount} returned</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-lg font-black text-emerald-700">{member.boughtCopies}</p>
                        <p className="text-xs font-bold text-slate-400">{member.pendingOrders.length} pending orders</p>
                        {member.boughtBooks.length > 0 && (
                          <p className="mt-1 line-clamp-2 max-w-xs text-xs font-semibold text-slate-500">
                            {member.boughtBooks.map((item) => `${item.bookTitle} x${item.quantity}`).join(', ')}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5 font-black text-slate-950">{money(member.totalSpent)}</td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-500">{formatDate(member.createdDate || member.CreatedDate)}</td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end">
                          <Button variant="danger" size="sm" onClick={() => remove('user', member.id || member.Id)}>
                            <Trash2 size={15} /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="7" className="px-6 py-10"><EmptyState icon={UsersRound} title="No users found" description="Registered users will appear here." /></td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      <Modal isOpen={Boolean(modal)} onClose={() => setModal(null)} title={modalTitle} description={modal?.type === 'book' ? 'Required fields: Title, Author, Price, Quantity, CategoryId.' : 'Create a category that books can be attached to.'}>
        <form onSubmit={submit} className="space-y-5">
          {modal?.type === 'book' ? (
            <>
              {!hasCategories && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
                  No categories found. Close this form and create a category first.
                </div>
              )}
              <Input label="Title" required value={form.title || ''} onChange={updateField('title')} placeholder="Example: C# Programming" />
              <Input label="Author" required value={form.author || ''} onChange={updateField('author')} placeholder="Example: Ahmed Ali" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Price" type="number" step="0.01" min="0" required value={form.price || ''} onChange={updateField('price')} placeholder="10" />
                <Input label="Quantity" type="number" min="0" required value={form.quantity || ''} onChange={updateField('quantity')} placeholder="5" />
              </div>
              <div className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Category</span>
                <Select required value={form.categoryId || ''} onChange={updateField('categoryId')}>
                  <option value="">{hasCategories ? 'Select category' : 'No categories yet'}</option>
                  {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </div>
              {!hasCategories && <Button variant="secondary" className="w-full" onClick={() => { setModal({ type: 'category', mode: 'create', thenBook: true }); setForm({ name: '' }); }}>Create category first</Button>}
            </>
          ) : (
            <Input label="Category name" required value={form.name || ''} onChange={updateField('name')} placeholder="Example: Programming" />
          )}
          <Button type="submit" variant="accent" loading={submitting} disabled={modal?.type === 'book' && !hasCategories} className="w-full">Save changes</Button>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'user' ? 'Delete this user?' : 'Delete this item?'}
        description={pendingDelete?.type === 'user' ? 'This will remove the user account and related records. Active borrowed books will be returned to stock.' : 'This action will remove the selected record.'}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={confirmRemove}
        onCancel={() => setPendingDelete(null)}
      />
    </DashboardShell>
  );
}
