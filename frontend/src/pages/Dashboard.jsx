import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookCheck, CalendarClock, PackageCheck, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import { borrowsApi, ordersApi } from '../api/client';
import DashboardShell from '../components/layout/DashboardShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getBookCover } from '../utils/bookCovers';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function statusVariant(status) {
  if (status === 'Approved' || status === 'Active') return 'success';
  if (status === 'Returned') return 'default';
  if (status === 'Rejected') return 'danger';
  return 'warning';
}

function StatCard({ icon: Icon, label, value, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <Card className="p-6 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10">
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tones[tone] || tones.indigo}`}>
        <Icon size={22} />
      </span>
      <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
    </Card>
  );
}

function initials(name = 'User') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function MyBookCard({ item, onReturn }) {
  const cover = getBookCover(item.bookId);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-950/10">
      <div className="relative isolate flex min-h-56 items-center justify-center overflow-hidden bg-slate-100 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.18),transparent_30rem),linear-gradient(135deg,rgba(255,255,255,.76),rgba(238,242,255,.68))]" />
        <div className={`relative h-44 w-32 rounded-l-sm rounded-r-xl bg-gradient-to-br ${cover.bg} p-4 shadow-2xl transition duration-500 group-hover:-rotate-2 group-hover:scale-105`}>
          <div className="absolute inset-y-0 left-0 w-3 rounded-l-sm" style={{ backgroundColor: cover.spine }} />
          <div className="relative flex h-full flex-col justify-between pl-3 text-white">
            <Badge className={`self-start border-white/20 bg-white/10 text-white ${cover.accent}`}>{item.kind}</Badge>
            <div>
              <BookCheck className="mb-3 opacity-75" size={25} />
              <h3 className="line-clamp-3 text-sm font-black leading-tight">{item.title}</h3>
              <p className="mt-2 line-clamp-1 text-[11px] font-semibold text-white/70">{item.statusText}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-7 h-5 w-32 rounded-full bg-slate-950/15 blur-lg" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-black tracking-tight text-slate-950">{item.title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{item.meta}</p>
          </div>
          <Badge variant={statusVariant(item.status)}>{item.statusText}</Badge>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
          <p className="mt-1 text-sm font-bold text-slate-700">{item.detail}</p>
        </div>

        {item.canReturn && (
          <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => onReturn(item.borrowId)}>
            <RotateCcw size={15} /> Return book
          </Button>
        )}
      </div>
    </article>
  );
}

export default function Dashboard({ booksOnly = false }) {
  const [borrows, setBorrows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnId, setReturnId] = useState(null);
  const [returning, setReturning] = useState(false);
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const loadData = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [borrowData, orderData] = await Promise.all([borrowsApi.getAll(), ordersApi.getAll()]);
      setBorrows(borrowData || []);
      setOrders(orderData || []);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const returnBook = async () => {
    if (!returnId) return;
    setReturning(true);
    try {
      await borrowsApi.returnBook(returnId);
      showToast('Book returned successfully.');
      setReturnId(null);
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setReturning(false);
    }
  };

  const activeBorrows = borrows.filter((item) => item.status === 'Approved' || item.status === 'Active');
  const pendingBorrows = borrows.filter((item) => item.status === 'Pending');
  const approvedOrders = orders.filter((item) => item.status === 'Approved');
  const pendingOrders = orders.filter((item) => item.status === 'Pending');
  const visibleBorrows = isAdmin ? borrows : borrows.filter((item) => item.status !== 'Rejected');
  const boughtBooks = approvedOrders.flatMap((order) => (order.details || []).map((item) => ({
    ...item,
    orderId: order.id,
    orderDate: order.orderDate,
  })));
  const pendingOrderItems = pendingOrders.flatMap((order) => (order.details || []).map((item) => ({
    ...item,
    orderId: order.id,
    orderDate: order.orderDate,
  })));
  const myBookItems = useMemo(() => [
    ...activeBorrows.map((borrow) => ({
      id: `borrow-active-${borrow.id}`,
      kind: 'Borrow',
      status: borrow.status,
      statusText: 'Borrowed',
      title: borrow.bookTitle || `Book #${borrow.bookId}`,
      bookId: borrow.bookId,
      meta: `Borrowed on ${formatDate(borrow.borrowDate)}`,
      label: 'Return date',
      detail: formatDate(borrow.returnDate),
      canReturn: true,
      borrowId: borrow.id,
    })),
    ...pendingBorrows.map((borrow) => ({
      id: `borrow-pending-${borrow.id}`,
      kind: 'Borrow',
      status: borrow.status,
      statusText: 'Pending',
      title: borrow.bookTitle || `Book #${borrow.bookId}`,
      bookId: borrow.bookId,
      meta: `Requested on ${formatDate(borrow.borrowDate)}`,
      label: 'Admin approval',
      detail: 'Sug fasaxa admin-ka ka hor intaadan qaadan.',
      canReturn: false,
    })),
    ...boughtBooks.map((item) => ({
      id: `buy-approved-${item.orderId}-${item.id}`,
      kind: 'Buy',
      status: 'Approved',
      statusText: 'Bought',
      title: item.bookTitle || `Book #${item.bookId}`,
      bookId: item.bookId,
      meta: `Order #${item.orderId} · ${formatDate(item.orderDate)}`,
      label: 'Purchase',
      detail: `${item.quantity} copy · ${money(Number(item.price || 0) * Number(item.quantity || 0))}`,
      canReturn: false,
    })),
    ...pendingOrderItems.map((item) => ({
      id: `buy-pending-${item.orderId}-${item.id}`,
      kind: 'Buy',
      status: 'Pending',
      statusText: 'Pending',
      title: item.bookTitle || `Book #${item.bookId}`,
      bookId: item.bookId,
      meta: `Order #${item.orderId} · ${formatDate(item.orderDate)}`,
      label: 'Admin approval',
      detail: `${item.quantity} copy ayaa sugaya fasax.`,
      canReturn: false,
    })),
  ], [activeBorrows, boughtBooks, pendingBorrows, pendingOrderItems]);
  const dashboardBookItems = booksOnly ? myBookItems : myBookItems.slice(0, 4);
  const recentActivities = useMemo(() => [
    ...visibleBorrows.map((item) => ({
      id: `borrow-${item.id}`,
      title: item.bookTitle || `Borrow #${item.id}`,
      meta: `${item.status || 'Borrowed'} · ${formatDate(item.returnDate)}`,
      type: 'Borrow',
    })),
    ...(isAdmin ? orders : orders.filter((item) => item.status !== 'Rejected')).map((item) => ({
      id: `order-${item.id}`,
      title: `Order #${item.id}`,
      meta: `${item.status || 'Pending'} · ${formatDate(item.orderDate)} · ${money(item.total)}`,
      type: 'Order',
    })),
  ].slice(0, 6), [isAdmin, orders, visibleBorrows]);

  const topStats = isAdmin
    ? [
      { icon: BookCheck, label: 'Borrow records', value: borrows.length, tone: 'indigo' },
      { icon: PackageCheck, label: 'Approved orders', value: approvedOrders.length, tone: 'emerald' },
      { icon: CalendarClock, label: 'Active borrows', value: activeBorrows.length, tone: 'amber' },
    ]
    : [
      { icon: BookCheck, label: 'Borrowed now', value: activeBorrows.length, tone: 'indigo' },
      { icon: PackageCheck, label: 'Bought books', value: boughtBooks.length, tone: 'emerald' },
      { icon: CalendarClock, label: 'Pending requests', value: pendingBorrows.length + pendingOrderItems.length, tone: 'amber' },
    ];

  const chartItems = [
    { label: 'Active', value: activeBorrows.length, color: 'bg-indigo-600' },
    { label: 'Pending', value: pendingBorrows.length + pendingOrders.length, color: 'bg-amber-500' },
    { label: 'Orders', value: approvedOrders.length, color: 'bg-purple-500' },
  ];
  const chartMax = Math.max(...chartItems.map((item) => item.value), 1);

  return (
    <DashboardShell title={booksOnly ? 'My Books' : (isAdmin ? 'Admin Dashboard' : 'Member Dashboard')}>
      <PageHeader
        eyebrow={booksOnly ? 'My books' : (isAdmin ? 'Admin dashboard' : 'My dashboard')}
        title={booksOnly ? 'Books I have' : `Welcome, ${user?.name || 'User'}`}
        description={booksOnly ? 'Halkan ka arag buugaagta aad haysato, kuwa sugaya fasax, kuwa aad iibsatay, iyo kuwa aad celin karto.' : (isAdmin ? 'Track borrowed books, orders, and recent library activity.' : 'Overview kooban oo kuu sheegaya buugaagta aad haysato, kuwa aad iibsatay, iyo requests-ka sugaya fasax.')}
      >
        <Button onClick={loadData} disabled={loading} variant="secondary">
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </PageHeader>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {topStats.map((item) => <StatCard key={item.label} {...item} />)}
        </div>

        {!isAdmin && (
          <Card className="mt-8 overflow-hidden border-indigo-200 shadow-xl shadow-indigo-950/10">
            <CardHeader
              title={booksOnly ? 'My Books' : 'My books overview'}
              description={booksOnly ? 'Buugaagtaada oo dhan: cover, status, information, iyo Return button haddii aad haysato.' : 'Qayb kooban oo aan ku soo koobnay buugaagta aad hadda haysato ama sugaya fasax.'}
              action={!booksOnly && myBookItems.length > 4 ? (
                <Link to="/my-books" className="inline-flex h-10 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700">
                  View all
                </Link>
              ) : null}
            />
            <div className="border-b border-slate-100 bg-slate-50/70 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-xl font-black text-white shadow-lg shadow-indigo-600/25">
                    {initials(user?.name)}
                  </span>
                  <div>
                    <p className="text-lg font-black text-slate-950">{user?.name || 'User'}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Member profile · {activeBorrows.length} borrowed · {boughtBooks.length} bought</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm"><p className="text-xl font-black text-indigo-700">{activeBorrows.length}</p><p className="text-[11px] font-bold text-slate-400">Borrowed</p></div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm"><p className="text-xl font-black text-amber-700">{pendingBorrows.length + pendingOrderItems.length}</p><p className="text-[11px] font-bold text-slate-400">Pending</p></div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm"><p className="text-xl font-black text-purple-700">{boughtBooks.length}</p><p className="text-[11px] font-bold text-slate-400">Bought</p></div>
                </div>
              </div>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {(booksOnly ? [1, 2, 3, 4] : [1, 2]).map((item) => <Skeleton key={item} className="h-96" />)}
                </div>
              ) : dashboardBookItems.length ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {dashboardBookItems.map((item) => <MyBookCard key={item.id} item={item} onReturn={setReturnId} />)}
                </div>
              ) : (
                <EmptyState icon={BookCheck} title="No books in your shelf yet" description="Borrow or buy a book from the catalog. Requests will appear here immediately." />
              )}
            </div>
          </Card>
        )}

        {!booksOnly && isAdmin && <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_420px]">
          <Card className="overflow-hidden">
            <CardHeader title="Borrowed books" description={isAdmin ? 'All visible borrow records for your role.' : 'Your current and returned borrowed books.'} />
            <div className="divide-y divide-slate-100">
              {loading ? [1, 2, 3].map((item) => <Skeleton key={item} className="m-5 h-20" />) : visibleBorrows.length ? visibleBorrows.map((borrow) => (
                <div key={borrow.id} className="p-5 transition hover:bg-slate-50/70">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-black text-slate-950">{borrow.bookTitle}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">Return: {formatDate(borrow.returnDate)}</p>
                      {isAdmin && <p className="mt-1 text-xs font-bold text-slate-400">User: {borrow.userName}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(borrow.status)}>{borrow.status}</Badge>
                      {(borrow.status === 'Approved' || borrow.status === 'Active') && (
                        <Button variant="secondary" size="sm" onClick={() => setReturnId(borrow.id)}>
                          <RotateCcw size={15} /> Return
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )) : <div className="p-5"><EmptyState icon={BookCheck} title="No borrowed books yet" description="Borrowed books will appear here after records are created." /></div>}
            </div>
          </Card>

          <div className="space-y-8">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Activity chart</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Current records overview</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-50 text-purple-700"><Sparkles size={21} /></span>
              </div>
              <div className="mt-6 space-y-5">
                {chartItems.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-sm font-black text-slate-600">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max(7, (item.value / chartMax) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader title="Recent activities" description="Latest borrow and order records." />
              <div className="divide-y divide-slate-100">
                {loading ? [1, 2, 3].map((item) => <Skeleton key={item} className="m-4 h-14" />) : recentActivities.length ? recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{activity.title}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{activity.meta}</p>
                    </div>
                    <Badge variant={activity.type === 'Order' ? 'purple' : 'indigo'}>{activity.type}</Badge>
                  </div>
                )) : <p className="p-5 text-sm font-semibold text-slate-500">No recent activity yet.</p>}
              </div>
            </Card>
          </div>
        </div>}

        {!booksOnly && isAdmin && <Card className="mt-8 overflow-hidden">
          <CardHeader title="Orders" description="Order history and item quantities." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Items</th><th className="px-5 py-4 text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan="5" className="px-5 py-6"><Skeleton className="h-16" /></td></tr> : orders.length ? orders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-black text-slate-950">Order #{order.id}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-500">{formatDate(order.orderDate)}</td>
                    <td className="px-5 py-4"><Badge variant={statusVariant(order.status)}>{order.status || 'Pending'}</Badge></td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">{order.details?.length || 0} items</td>
                    <td className="px-5 py-4 text-right font-black text-indigo-700">{money(order.total)}</td>
                  </tr>
                )) : <tr><td colSpan="5" className="px-5 py-8 text-center text-sm font-semibold text-slate-500">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>}
      </section>

      <ConfirmDialog
        open={Boolean(returnId)}
        title="Return this book?"
        description="Confirm that this borrow record should be marked as returned."
        confirmLabel="Return book"
        loading={returning}
        onConfirm={returnBook}
        onCancel={() => setReturnId(null)}
      />
    </DashboardShell>
  );
}
