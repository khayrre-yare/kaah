import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { borrowsApi, ordersApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import useNotifications from '../../hooks/useNotifications';
import Button from '../ui/Button';

export default function AdminNotifications({ buttonClassName = 'h-10 w-10' }) {
  const [open, setOpen] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const notifications = useNotifications();
  const { showToast } = useToast();

  const decide = async (type, id, decision) => {
    setWorkingId(`${type}-${id}-${decision}`);
    try {
      if (type === 'borrow') {
        if (decision === 'approve') await borrowsApi.approve(id);
        else await borrowsApi.reject(id);
      } else if (decision === 'approve') await ordersApi.approve(id);
      else await ordersApi.reject(id);

      showToast(decision === 'approve' ? 'Request approved.' : 'Request rejected.');
      window.dispatchEvent(new CustomEvent('kaah:notifications-refresh'));
      setOpen(false);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className={`focus-ring relative grid place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 ${buttonClassName}`}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {notifications.count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">{notifications.count}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 animate-scale-in overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">Pending approvals</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{notifications.count} request ayaa sugaya fasax.</p>
              </div>
              <button onClick={() => setOpen(false)} className="focus-ring rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close notifications">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.count ? (
              <>
                {notifications.pendingBorrows.map((item) => (
                  <div key={`borrow-${item.id}`} className="rounded-2xl p-3 hover:bg-slate-50">
                    <p className="text-sm font-black text-slate-950">Borrow: {item.bookTitle}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.userName || `User #${item.userId}`}</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="accent" loading={workingId === `borrow-${item.id}-approve`} onClick={() => decide('borrow', item.id, 'approve')}>Approve</Button>
                      <Button size="sm" variant="danger" loading={workingId === `borrow-${item.id}-reject`} onClick={() => decide('borrow', item.id, 'reject')}>Reject</Button>
                    </div>
                  </div>
                ))}

                {notifications.pendingOrders.map((item) => (
                  <div key={`order-${item.id}`} className="rounded-2xl p-3 hover:bg-slate-50">
                    <p className="text-sm font-black text-slate-950">Order #{item.id}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.userName || `User #${item.userId}`} · {item.details?.length || 0} items</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="accent" loading={workingId === `order-${item.id}-approve`} onClick={() => decide('order', item.id, 'approve')}>Approve</Button>
                      <Button size="sm" variant="danger" loading={workingId === `order-${item.id}-reject`} onClick={() => decide('order', item.id, 'reject')}>Reject</Button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="p-4 text-sm font-semibold text-slate-500">No pending requests.</p>
            )}
          </div>

          <Link to="/admin" onClick={() => setOpen(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-black text-indigo-700 hover:bg-indigo-50">
            Open approvals
          </Link>
        </div>
      )}
    </div>
  );
}
