import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, CircleAlert, FolderOpen, MessageSquare, Pencil, Plus, RefreshCw, Send, Trash2, UsersRound } from 'lucide-react';
import { booksApi, borrowsApi, categoriesApi, contactMessagesApi, ordersApi, usersApi } from '../api/client';
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
  const navigate = useNavigate();
  const { section } = useParams();
  const page = ['approvals', 'books', 'categories', 'members', 'messages'].includes(section) ? section : 'books';
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyBook);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [replyingMessage, setReplyingMessage] = useState(null);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookData, categoryData, userData, borrowData, orderData, contactData] = await Promise.all([
        booksApi.getAll(),
        categoriesApi.getAll(),
        usersApi.getAll(),
        borrowsApi.getAll(),
        ordersApi.getAll(),
        contactMessagesApi.getAll(),
      ]);
      setBooks(bookData || []);
      setCategories(categoryData || []);
      setUsers(userData || []);
      setBorrows(borrowData || []);
      setOrders(orderData || []);
      setContactMessages(contactData || []);
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

  const pendingBorrows = useMemo(() => borrows.filter((borrow) => borrow.status === 'Pending'), [borrows]);
  const pendingOrders = useMemo(() => orders.filter((order) => order.status === 'Pending'), [orders]);
  const pendingContactMessages = useMemo(() => contactMessages.filter((message) => message.status === 'Weli lama jawaabin'), [contactMessages]);
  const approvalsTotal = pendingBorrows.length + pendingOrders.length;

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
      navigate('/admin/categories');
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
        navigate('/admin/books');
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

  const updateReplyDraft = (id, value) => {
    setReplyDrafts((current) => ({ ...current, [id]: value }));
  };

  const sendReply = async (id) => {
    const adminReply = normalizeText(replyDrafts[id]);

    if (!adminReply) {
      showToast('Qor jawaabta maamulka marka hore.', 'error');
      return;
    }

    setReplyingMessage(id);
    try {
      await contactMessagesApi.reply(id, { adminReply });
      showToast('Jawaabta waa la diray.');
      setReplyDrafts((current) => ({ ...current, [id]: '' }));
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setReplyingMessage(null);
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
        <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo">Admin</Badge>
              <Badge variant={approvalsTotal ? 'warning' : 'success'}>{approvalsTotal} pending</Badge>
              <Badge variant={pendingContactMessages.length ? 'warning' : 'success'}>{pendingContactMessages.length} messages</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Library operations</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
              Door qaybta aad rabto. Approvals, Messages, Books, Categories, iyo Members mid walba meel gooni ah ayuu leeyahay.
            </p>
          </div>
        </div>

        <div className="mb-6 flex justify-end">
          <Button variant="ghost" onClick={loadData}><RefreshCw size={17} /> Refresh</Button>
        </div>

        {page === 'approvals' ? (
          <Card className="overflow-hidden border-indigo-100 shadow-xl shadow-indigo-950/5">
            <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-indigo-50 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Approval requests</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Borrow iyo buy requests ayaa halkan keliya lagu fasaxaa ama lagu diidaa.</p>
                </div>
                <Badge variant={approvalsTotal ? 'warning' : 'success'}>{approvalsTotal} pending</Badge>
              </div>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32" />)}
                </div>
              ) : approvalsTotal ? (
                <div className="grid gap-4 lg:grid-cols-2">
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
                </div>
              ) : (
                <EmptyState icon={CheckCircle2} title="Approval queue is clear" description="No borrow or buy requests are waiting right now." />
              )}
            </div>
          </Card>
        ) : page === 'books' ? (
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Books inventory</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Add, edit, and delete books only from this section.</p>
                </div>
                <Button variant="accent" onClick={handleAddBook}>
                  <Plus size={17} /> Add Book
                </Button>
              </div>
            </div>
            {!hasCategories && !loading && (
              <div className="border-b border-slate-100 p-5">
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
        ) : page === 'categories' ? (
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Categories</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Catalog groups are managed only here.</p>
                </div>
                <Button variant="accent" onClick={() => openCreate('category')}>
                  <Plus size={17} /> Add Category
                </Button>
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-28" />) : categories.length ? categories.map((categoryItem) => (
                <div key={categoryItem.id} className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10">
                  <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><FolderOpen size={22} /></span><div><p className="font-black text-slate-950">{categoryItem.name}</p><p className="text-xs font-bold text-slate-400">Category #{categoryItem.id}</p></div></div>
                  <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => openEdit('category', categoryItem)}><Pencil size={15} /></Button><Button variant="danger" size="sm" onClick={() => remove('category', categoryItem.id)}><Trash2 size={15} /></Button></div>
                </div>
              )) : <div className="sm:col-span-2 lg:col-span-3"><EmptyState icon={FolderOpen} title="No categories yet" description="Add a category before saving books." actionLabel="Add Category" onAction={() => openCreate('category')} /></div>}
            </div>
          </Card>
        ) : page === 'messages' ? (
          <Card className="mx-auto max-w-5xl overflow-hidden border-slate-700 bg-slate-900 shadow-xl shadow-slate-950/20">
            <div className="border-b border-slate-700 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Nala Soo Xiriir messages</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-300">Akhri fariinta, kadib jawaab kooban u dir.</p>
                </div>
                <Badge variant={pendingContactMessages.length ? 'warning' : 'success'}>{pendingContactMessages.length} waiting</Badge>
              </div>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => <Skeleton key={item} className="h-36" />)}
                </div>
              ) : contactMessages.length ? (
                <div className="space-y-3">
                  {contactMessages.map((contactMessage) => {
                    const id = contactMessage.messageId;
                    const replied = contactMessage.status === 'Waa laga jawaabay';

                    return (
                      <article key={id} className="rounded-2xl border border-slate-700 bg-slate-950/45 p-4 shadow-sm transition hover:border-indigo-400">
                        <div className="grid gap-4 xl:grid-cols-[240px_1fr_300px]">
                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-3 xl:block">
                              <div className="min-w-0">
                                <p className="truncate font-black text-white">{contactMessage.userName || `User #${contactMessage.userId}`}</p>
                                <p className="mt-1 truncate text-xs font-semibold text-slate-300">{contactMessage.userEmail || 'No email'}</p>
                                <p className="mt-2 text-xs font-bold text-slate-400">{formatDate(contactMessage.createdAt)}</p>
                              </div>
                              <Badge variant={replied ? 'success' : 'warning'}>{contactMessage.status}</Badge>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Fariinta</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-100">{contactMessage.message}</p>
                          </div>

                          {replied ? (
                            <div className="rounded-2xl border border-emerald-700/50 bg-emerald-950/30 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-300">Jawaab</p>
                                <p className="text-[11px] font-bold text-emerald-300">{formatDate(contactMessage.repliedAt)}</p>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-emerald-50">{contactMessage.adminReply}</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <textarea
                                value={replyDrafts[id] || ''}
                                onChange={(event) => updateReplyDraft(id, event.target.value)}
                                placeholder="Jawaabta ku qor..."
                                className="min-h-24 w-full resize-y rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                              />
                              <Button variant="accent" size="sm" loading={replyingMessage === id} onClick={() => sendReply(id)} className="w-full">
                                <Send size={15} /> Dir Jawaabta
                              </Button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={MessageSquare} title="Fariimo ma jiraan" description="Marka user-ku fariin ka soo diro Nala Soo Xiriir, halkan ayay ka muuqan doontaa." />
              )}
            </div>
          </Card>
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
