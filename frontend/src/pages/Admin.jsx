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
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

const emptyBook = { title: '', author: '', price: '', quantity: '', categoryId: '' };
const emptyUser = { fullName: '', email: '', password: '', role: 'User' };

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
    <Card className="p-5 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/10">
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${tones[tone] || tones.indigo}`}>
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-sm font-black text-slate-700">{label}</p>
          {detail && <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{detail}</p>}
        </div>
      </div>
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
    setForm(type === 'book' ? { ...emptyBook, categoryId: firstCategoryId } : type === 'user' ? emptyUser : { name: '' });
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
    const id = item.id || item.Id;
    setModal({ type, mode: 'edit', id });
    if (type === 'book') {
      setForm({
        title: item.title || '',
        author: item.author || '',
        price: item.price || '',
        quantity: item.quantity || '',
        categoryId: item.categoryId || firstCategoryId,
      });
      return;
    }

    if (type === 'user') {
      setForm({
        fullName: item.fullName || item.FullName || '',
        email: item.email || item.Email || '',
        role: item.role || item.Role || 'User',
      });
      return;
    }

    setForm({ name: item.name || '' });
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
      } else if (modal.type === 'category') {
        if (!normalizeText(form.name)) throw new Error('Category name is required.');
        if (modal.mode === 'create') await categoriesApi.create(form);
        else await categoriesApi.update(modal.id, form);
      } else {
        if (!normalizeText(form.fullName)) throw new Error('Full name is required.');
        if (!normalizeText(form.email)) throw new Error('Email is required.');
        if (modal.mode === 'create' && !normalizeText(form.password)) throw new Error('Password is required.');
        if (form.role !== 'Admin' && form.role !== 'User') throw new Error('Role must be Admin or User.');
        if (modal.mode === 'create') await usersApi.create(form);
        else await usersApi.update(modal.id, form);
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
    : modal?.type === 'user'
      ? (modal?.mode === 'create' ? 'Add member' : 'Manage member')
      : (modal?.mode === 'create' ? 'Add category' : 'Edit category');

  return (
    <DashboardShell title="Admin Panel">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo"><Activity size={13} /> Admin</Badge>
              <Badge variant={approvalsTotal ? 'warning' : 'success'}>{approvalsTotal} pending</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Library operations</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
              Manage approvals, books, categories, members, roles, stock, and sales from one clean workspace.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:w-auto">
            <Button variant="secondary" onClick={() => openCreate('category')}><Plus size={18} /> Category</Button>
            <Button variant="secondary" onClick={() => openCreate('user')}><UsersRound size={18} /> Member</Button>
            <Button variant="accent" onClick={handleAddBook}><BookPlus size={18} /> Book</Button>
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card className="p-5 shadow-lg shadow-slate-950/5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Operations snapshot</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Quick actions for the most common admin work.</p>
              </div>
              <Button variant="ghost" onClick={loadData}><RefreshCw size={17} /> Refresh</Button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <button onClick={() => setTab('books')} className="flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-indigo-700 shadow-sm"><BookOpen size={20} /></span>
                <span><span className="block text-sm font-black">Inventory</span><span className="block text-xs font-semibold opacity-75">Books and stock</span></span>
              </button>
              <button onClick={() => setTab('members')} className="flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-indigo-700 shadow-sm"><UsersRound size={20} /></span>
                <span><span className="block text-sm font-black">Members</span><span className="block text-xs font-semibold opacity-75">Roles and users</span></span>
              </button>
              <button onClick={() => setTab('categories')} className="flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-indigo-700 shadow-sm"><FolderOpen size={20} /></span>
                <span><span className="block text-sm font-black">Categories</span><span className="block text-xs font-semibold opacity-75">Catalog groups</span></span>
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

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          <Card className="overflow-hidden border-indigo-100 shadow-xl shadow-indigo-950/5">
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-purple-50 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Members management</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Edit users, change roles, create admins, and monitor borrowed or purchased books.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Badge variant="purple">{memberRows.length} members</Badge>
                  <Button variant="accent" onClick={() => openCreate('user')}>
                    <Plus size={17} /> Add Member
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map((item) => <Skeleton key={item} className="h-72" />)}
                </div>
              ) : memberRows.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {memberRows.map((member) => {
                    const name = member.fullName || member.FullName || 'User';
                    const role = member.role || member.Role || 'User';
                    return (
                      <article key={member.id || member.Id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-sm font-black text-white shadow-lg shadow-indigo-600/20">
                              {name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U'}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-950">{name}</p>
                              <p className="mt-1 truncate text-sm font-semibold text-slate-500">{member.email || member.Email}</p>
                              <p className="mt-1 text-xs font-bold text-slate-400">Joined {formatDate(member.createdDate || member.CreatedDate)}</p>
                            </div>
                          </div>
                          <Badge variant={role === 'Admin' ? 'purple' : 'indigo'}>{role}</Badge>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-2xl bg-indigo-50 px-3 py-3">
                            <p className="text-xl font-black text-indigo-700">{member.activeBooks.length}</p>
                            <p className="text-[11px] font-bold text-indigo-500">Borrowed</p>
                          </div>
                          <div className="rounded-2xl bg-amber-50 px-3 py-3">
                            <p className="text-xl font-black text-amber-700">{member.pendingBooks.length + member.pendingOrders.length}</p>
                            <p className="text-[11px] font-bold text-amber-600">Pending</p>
                          </div>
                          <div className="rounded-2xl bg-emerald-50 px-3 py-3">
                            <p className="text-xl font-black text-emerald-700">{member.boughtCopies}</p>
                            <p className="text-[11px] font-bold text-emerald-600">Bought</p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Total spent</p>
                            <p className="font-black text-slate-950">{money(member.totalSpent)}</p>
                          </div>
                          {member.userBorrows.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {member.userBorrows.slice(0, 3).map((borrow) => (
                                <Badge key={borrow.id} variant={borrow.status === 'Returned' ? 'success' : 'warning'}>
                                  {borrow.bookTitle || `Book #${borrow.bookId}`}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEdit('user', member)}>
                            <Pencil size={15} /> Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => remove('user', member.id || member.Id)}>
                            <Trash2 size={15} /> Delete
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={UsersRound} title="No users found" description="Registered users will appear here." actionLabel="Add Member" onAction={() => openCreate('user')} />
              )}
            </div>
          </Card>
        )}
      </section>

      <Modal
        isOpen={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modalTitle}
        description={modal?.type === 'book' ? 'Required fields: Title, Author, Price, Quantity, CategoryId.' : modal?.type === 'user' ? 'Update member information and choose whether this account is User or Admin.' : 'Create a category that books can be attached to.'}
      >
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
          ) : modal?.type === 'category' ? (
            <Input label="Category name" required value={form.name || ''} onChange={updateField('name')} placeholder="Example: Programming" />
          ) : (
            <>
              <Input label="Full name" required value={form.fullName || ''} onChange={updateField('fullName')} placeholder="Member name" />
              <Input label="Email" type="email" required value={form.email || ''} onChange={updateField('email')} placeholder="member@example.com" />
              {modal?.mode === 'create' && (
                <Input label="Password" type="password" required value={form.password || ''} onChange={updateField('password')} placeholder="Temporary password" />
              )}
              <div className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Role</span>
                <Select required value={form.role || 'User'} onChange={updateField('role')}>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </Select>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-semibold leading-7 text-indigo-950">
                Role-ka Admin wuxuu qofkan siinayaa access buuxa: books, members, approvals, delete, iyo reports.
              </div>
            </>
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
