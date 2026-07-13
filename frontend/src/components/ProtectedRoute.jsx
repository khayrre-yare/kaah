import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (adminOnly && !isAdmin) {
    return (
      <section className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-4 py-16 text-center sm:px-6">
        <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-2xl shadow-slate-950/10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-100 text-amber-700">
            <ShieldCheck size={30} />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Admin access required</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            This page is only for accounts with Role = Admin. Change the role in Neon, then logout and login again so the new token is loaded.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/dashboard" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50">Go dashboard</Link>
            <Link to="/login" className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700">Login again</Link>
          </div>
        </div>
      </section>
    );
  }

  return children;
}
