import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart';
import Admin from './pages/Admin';
import Contact from './pages/Contact';

function NotFound() {
  return (
    <section className="grid min-h-[70vh] place-items-center px-4 py-16 text-center">
      <div className="max-w-xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-2xl shadow-slate-950/10">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600">404</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Page not found</h1>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">The route does not exist in this frontend. Use the navigation to continue.</p>
        <Link to="/" className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-600/25">
          Back home
        </Link>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="books" element={<Books />} />
                <Route path="books/:id" element={<BookDetails />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="my-books" element={<ProtectedRoute><Dashboard booksOnly /></ProtectedRoute>} />
                <Route path="contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
                <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
                <Route path="admin/:section" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
