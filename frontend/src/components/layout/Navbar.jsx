import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, ChevronDown, LayoutDashboard, LogOut, Menu, MessageSquare, Moon, ShieldCheck, ShoppingBag, Sun, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import AdminNotifications from './AdminNotifications';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/books', label: 'Books' },
];

const sectionLinks = [
  { id: 'about', label: 'About' },
];

function navClass({ isActive }) {
  return `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
    isActive
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:text-white'
      : 'text-slate-600 hover:bg-indigo-600 hover:text-white'
  }`;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('kaah_theme') === 'dark');
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', darkMode);
    localStorage.setItem('kaah_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const close = () => {
    setOpen(false);
    setProfileOpen(false);
  };

  const toggleTheme = () => setDarkMode((value) => !value);

  const goToSection = (event, id) => {
    event.preventDefault();
    close();
    navigate('/');
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `/#${id}`);
    }, 90);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3" onClick={close}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/25">
            <BookOpen size={22} />
          </span>
          <span>
            <span className="block text-lg font-black leading-5 tracking-tight text-slate-950">Kaah</span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-600">Library</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {publicLinks.map((link) => <NavLink key={link.to} to={link.to} className={navClass}>{link.label}</NavLink>)}
          {sectionLinks.map((link) => (
            <Link key={link.id} to={`/#${link.id}`} onClick={(event) => goToSection(event, link.id)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-indigo-600 hover:text-white">
              {link.label}
            </Link>
          ))}
          {user && !isAdmin && <NavLink to="/contact" className={navClass}>Nala Soo Xiriir</NavLink>}
          {user && <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>}
          {isAdmin && <NavLink to="/admin/messages" className={navClass}>Messages</NavLink>}
          {isAdmin && <NavLink to="/admin/books" className={navClass}>Admin</NavLink>}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button onClick={toggleTheme} className="focus-ring grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user && isAdmin && <AdminNotifications buttonClassName="h-11 w-11" />}
          <Link to="/cart" className="relative inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-lg">
            <ShoppingBag size={18} /> Cart
            {count > 0 && <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-purple-600 px-1 text-xs text-white">{count}</span>}
          </Link>
          {user ? (
            <div className="relative">
              <button onClick={() => setProfileOpen((value) => !value)} className="focus-ring flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 pl-3 transition hover:border-indigo-200 hover:bg-indigo-50">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  {isAdmin ? <ShieldCheck size={17} className="text-indigo-600" /> : <UserRound size={17} className="text-indigo-600" />}
                  {user.name}
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-500">
                  <ChevronDown size={16} />
                </span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 animate-scale-in overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
                  <div className="border-b border-slate-100 p-4">
                    <p className="text-sm font-black text-slate-950">{user.name}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{user.role || 'Member'}</p>
                  </div>
                  <Link to="/dashboard" onClick={close} className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><LayoutDashboard size={16} /> Dashboard</Link>
                  {!isAdmin && <Link to="/contact" onClick={close} className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><MessageSquare size={16} /> Nala Soo Xiriir</Link>}
                  {isAdmin && <Link to="/admin/messages" onClick={close} className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><MessageSquare size={16} /> Messages</Link>}
                  <button onClick={() => { logout(); close(); }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5">Login</Link>
          )}
        </div>

        <button onClick={() => setOpen((value) => !value)} className="focus-ring rounded-2xl border border-slate-200 p-3 text-slate-700 lg:hidden" aria-label="Open menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-2xl lg:hidden">
          <div className="flex flex-col gap-2">
            {publicLinks.map((link) => <NavLink key={link.to} to={link.to} className={navClass} onClick={close}>{link.label}</NavLink>)}
            {sectionLinks.map((link) => <Link key={link.id} to={`/#${link.id}`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-indigo-600 hover:text-white" onClick={(event) => goToSection(event, link.id)}>{link.label}</Link>)}
            {user && !isAdmin && <NavLink to="/contact" className={navClass} onClick={close}><MessageSquare size={16} /> Nala Soo Xiriir</NavLink>}
            {user && <NavLink to="/dashboard" className={navClass} onClick={close}><LayoutDashboard size={16} /> Dashboard</NavLink>}
            {isAdmin && <NavLink to="/admin/messages" className={navClass} onClick={close}><MessageSquare size={16} /> Messages</NavLink>}
            {isAdmin && <NavLink to="/admin/books" className={navClass} onClick={close}>Admin</NavLink>}
            {user && isAdmin && <NavLink to="/admin/approvals" className={navClass} onClick={close}><Bell size={16} /> Notifications</NavLink>}
            <NavLink to="/cart" className={navClass} onClick={close}>Cart ({count})</NavLink>
            {user ? (
              <button onClick={() => { logout(); close(); }} className="rounded-full px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50">Logout</button>
            ) : (
              <NavLink to="/login" className={navClass} onClick={close}>Login</NavLink>
            )}
            <button onClick={toggleTheme} className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-left text-sm font-black text-slate-700 transition hover:bg-indigo-600 hover:text-white">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />} {darkMode ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
