import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LockKeyhole, Mail, UserRound } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form.fullName, form.email, form.password);
      showToast('Account created. Login now.');
      navigate('/login');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-5rem)] place-items-center px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
        <div className="relative overflow-hidden bg-slate-950 px-8 py-8 text-white sm:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,.42),transparent_24rem),radial-gradient(circle_at_bottom_right,rgba(147,51,234,.26),transparent_22rem)]" />
          <div className="relative">
            <span className="grid h-13 w-13 place-items-center rounded-3xl bg-white/10 ring-1 ring-white/15"><BookOpen size={25} /></span>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-indigo-200">Create account</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Join Kaah Library</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">Create your account and continue to the library dashboard.</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-700">Account details</p>
        <p className="mt-3 text-sm leading-7 text-slate-500">Enter your details to create a new member account.</p>

        <div className="mt-8 space-y-5">
          <Input label="Full name" required value={form.fullName} onChange={update('fullName')} leftIcon={<UserRound size={18} />} placeholder="Your name" />
          <Input label="Email" type="email" required value={form.email} onChange={update('email')} leftIcon={<Mail size={18} />} placeholder="you@example.com" />
          <Input label="Password" type="password" required minLength={3} value={form.password} onChange={update('password')} leftIcon={<LockKeyhole size={18} />} placeholder="Create password" />
        </div>

        <Button type="submit" variant="accent" loading={loading} className="mt-7 w-full">Create account</Button>
        <p className="mt-6 text-center text-sm font-semibold text-slate-500">
          Already have an account? <Link to="/login" className="font-black text-indigo-700 hover:text-indigo-900">Login</Link>
        </p>
        </div>
      </form>
    </section>
  );
}
