import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { ordersApi } from '../api/client';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, total, count } = useCart();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    if (!items.length) return;
    setLoading(true);
    try {
      await ordersApi.create({ items });
      clearCart();
      showToast('Order request sent. Please wait for admin approval.', 'info');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Cart" title="Checkout" description="Review selected books and create an order." />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-4">
          {items.length ? items.map((item) => (
            <Card key={item.id} className="flex flex-col gap-4 p-5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10 sm:flex-row sm:items-center">
              <div className="grid h-20 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white"><ShoppingBag size={24} /></div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-lg font-black text-slate-950">{item.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{item.author} · {item.categoryName || 'Book'}</p>
                <p className="mt-2 text-sm font-black text-indigo-700">{money(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={16} /></button>
                <span className="grid h-10 w-12 place-items-center rounded-2xl bg-slate-100 text-sm font-black">{item.quantity}</span>
                <button className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={16} /></button>
                <button className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 hover:bg-red-100" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
              </div>
            </Card>
          )) : (
            <EmptyState icon={ShoppingBag} title="Cart is empty" description="Add books first, then checkout." />
          )}
        </div>

        <aside className="h-fit rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
          <h2 className="text-xl font-black text-slate-950">Order summary</h2>
          <div className="mt-6 space-y-4 text-sm font-semibold text-slate-600">
            <div className="flex justify-between"><span>Items</span><span>{count}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>{money(total)}</span></div>
            <div className="flex justify-between"><span>Service</span><span>{money(0)}</span></div>
          </div>
          <div className="mt-6 flex justify-between border-t border-slate-200 pt-5 text-xl font-black text-slate-950"><span>Total</span><span>{money(total)}</span></div>
          <Button variant="accent" className="mt-6 w-full" disabled={!items.length} loading={loading} onClick={checkout}>Request order approval</Button>
          <Link to="/books" className="mt-3 inline-flex w-full justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">Continue browsing</Link>
        </aside>
      </section>
    </>
  );
}
