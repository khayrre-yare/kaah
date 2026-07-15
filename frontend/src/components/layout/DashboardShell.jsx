import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  BookOpen,
  FolderOpen,
  LibraryBig,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  ShoppingBag,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

function navClass({ isActive }, collapsed = false) {
  return `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black transition ${
    isActive
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:text-white'
      : 'text-slate-600 hover:bg-indigo-600 hover:text-white'
  } ${collapsed ? 'justify-center' : ''}`;
}

export default function DashboardShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();

  const role = user?.role || 'Member';
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LibraryBig },
    { to: isAdmin ? '/admin/books' : '/my-books', label: isAdmin ? 'Books' : 'My Books', icon: BookOpen },
    ...(!isAdmin ? [{ to: '/contact', label: 'Nala Soo Xiriir', icon: MessageSquare }] : []),
    ...(isAdmin ? [{ to: '/admin/approvals', label: 'Approvals', icon: ShieldCheck }] : []),
    ...(isAdmin ? [{ to: '/admin/messages', label: 'Messages', icon: MessageSquare }] : []),
    ...(isAdmin ? [{ to: '/admin/members', label: 'Members', icon: UsersRound }] : []),
    ...(isAdmin ? [{ to: '/admin/categories', label: 'Categories', icon: FolderOpen }] : []),
    { to: '/cart', label: 'Cart', icon: ShoppingBag, badge: count },
  ];

  const sidebar = (
    <aside className={`flex h-full flex-col border-r border-slate-200 bg-white p-3 transition-all ${collapsed ? 'w-[86px]' : 'w-72'}`}>
      <div className={`flex items-center gap-3 px-2 py-3 ${collapsed ? 'justify-center' : ''}`}>
        <Link to="/" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25">
          <BookOpen size={22} />
        </Link>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-base font-black text-slate-950">Kaah Library</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600">{role}</p>
          </div>
        )}
      </div>

      <nav className="mt-5 flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={(state) => navClass(state, collapsed)} title={collapsed ? item.label : undefined}>
              <Icon size={19} />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && item.badge > 0 && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{item.badge}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <button onClick={() => setCollapsed((value) => !value)} className={`focus-ring hidden w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 lg:flex ${collapsed ? 'justify-center' : ''}`}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && 'Collapse'}
        </button>
        <button onClick={logout} className={`focus-ring mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black text-red-600 transition hover:bg-red-50 ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={18} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50/70">
      <div className="mx-auto flex max-w-[1600px]">
        <div className="sticky top-20 hidden h-[calc(100vh-5rem)] shrink-0 lg:block">
          {sidebar}
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
            <div className="relative h-full w-[min(20rem,86vw)] animate-scale-in">
              {sidebar}
              <button className="focus-ring absolute right-3 top-3 rounded-2xl bg-white p-2 text-slate-600 shadow-lg" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <button
            className="focus-ring fixed bottom-5 left-5 z-40 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open dashboard menu"
          >
            <Menu size={20} />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
