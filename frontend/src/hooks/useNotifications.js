import { useEffect, useMemo, useState } from 'react';
import { borrowsApi, ordersApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function useNotifications() {
  const { user, isAdmin } = useAuth();
  const [borrows, setBorrows] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadNotifications() {
      if (!user?.token || !isAdmin) {
        setBorrows([]);
        setOrders([]);
        return;
      }

      try {
        const [borrowData, orderData] = await Promise.all([
          borrowsApi.getAll(),
          ordersApi.getAll(),
        ]);
        if (alive) {
          setBorrows(borrowData || []);
          setOrders(orderData || []);
        }
      } catch {
        if (alive) {
          setBorrows([]);
          setOrders([]);
        }
      }
    }

    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    window.addEventListener('kaah:notifications-refresh', loadNotifications);

    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('kaah:notifications-refresh', loadNotifications);
    };
  }, [user?.token, isAdmin]);

  return useMemo(() => {
    const pendingBorrows = borrows.filter((item) => item.status === 'Pending');
    const pendingOrders = orders.filter((item) => item.status === 'Pending');
    const count = isAdmin ? pendingBorrows.length + pendingOrders.length : 0;

    return {
      count,
      pendingBorrows,
      pendingOrders,
    };
  }, [borrows, orders, isAdmin]);
}
