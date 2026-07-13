import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = location.state?.from?.pathname;

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const auth = await login(form.email, form.password);
      const role = auth?.role?.toLowerCase();
      const destination = requestedPath || (role === 'admin' ? '/admin' : '/dashboard');
      showToast('Login successful.');
      navigate(destination, { replace: true });
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-5rem)] place-items-center px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 lg:grid-cols-[1fr_1.05fr]">
        <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,.45),transparent_28rem),radial-gradient(circle_at_bottom_right,rgba(147,51,234,.28),transparent_24rem)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <span className="grid h-14 w-14 place-items-center rounded-3xl bg-white/10 ring-1 ring-white/15">
                <BookOpen size={26} />
              </span>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-indigo-200">Secure Access</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight">Login to manage your library activity.</h1>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="flex items-center gap-2 text-sm font-black text-white"><ShieldCheck size={17} /> Protected dashboard</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">Use your registered account to access borrow records, orders, and admin tools.</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="p-8 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-700">Welcome back</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Sign in</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">Access your dashboard with your library account credentials.</p>

          <div className="mt-8 space-y-5">
            <Input label="Email" type="email" required value={form.email} onChange={update('email')} leftIcon={<Mail size={18} />} placeholder="you@example.com" />
            <Input label="Password" type="password" required value={form.password} onChange={update('password')} leftIcon={<LockKeyhole size={18} />} placeholder="••••••••" />
          </div>

          <Button type="submit" variant="accent" loading={loading} className="mt-7 w-full">Login</Button>

          <p className="mt-6 text-center text-sm font-semibold text-slate-500">
            No account? <Link to="/register" className="font-black text-indigo-700 hover:text-indigo-900">Create one</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
