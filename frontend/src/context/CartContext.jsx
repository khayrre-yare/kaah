import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'kaah_cart';

function sanitizeQuantity(value, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.max(1, Math.min(Math.floor(number), Math.max(1, Number(max) || 1)));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (book) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === book.id);
      const maxQuantity = Math.max(0, Number(book.quantity) || 0);
      if (maxQuantity <= 0) return current;

      if (existing) {
        return current.map((item) => (
          item.id === book.id
            ? { ...item, quantity: sanitizeQuantity(item.quantity + 1, maxQuantity), maxQuantity }
            : item
        ));
      }

      return [...current, {
        id: book.id,
        title: book.title,
        author: book.author,
        price: Number(book.price) || 0,
        categoryName: book.categoryName,
        quantity: 1,
        maxQuantity,
      }];
    });
  };

  const removeItem = (id) => setItems((current) => current.filter((item) => item.id !== id));

  const updateQuantity = (id, quantity) => {
    setItems((current) => current.map((item) => (
      item.id === id ? { ...item, quantity: sanitizeQuantity(quantity, item.maxQuantity) } : item
    )));
  };

  const clearCart = () => setItems([]);

  const value = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
