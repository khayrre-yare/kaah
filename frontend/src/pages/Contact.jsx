import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, MessageSquare, Send } from 'lucide-react';
import { contactMessagesApi } from '../api/client';
import DashboardShell from '../components/layout/DashboardShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function statusVariant(status) {
  return status === 'Waa laga jawaabay' ? 'success' : 'warning';
}

export default function Contact() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const latestMessage = useMemo(() => messages[0] || null, [messages]);
  const hasContactMessage = Boolean(latestMessage);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await contactMessagesApi.getAll();
      setMessages(data || []);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const submitMessage = async (event) => {
    event.preventDefault();
    const cleanMessage = message.trim();

    if (!cleanMessage) {
      showToast('Fariinta geli marka hore.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await contactMessagesApi.create({ message: cleanMessage });
      setMessage('');
      showToast('Fariinta waa la diray. Maamulka ayaa ka jawaabi doona.');
      await loadMessages();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-8 text-white sm:px-8">
            <Badge className="border-white/15 bg-white/10 text-white">
              <MessageSquare size={13} /> Nala Soo Xiriir
            </Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Fariin u dir maamulka maktabadda</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/80">
              Qor hal fariin oo cad. Magaca iyo email-ka waxaa laga qaadayaa akoonkaaga: {user?.name || 'User'}.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-700">
                <Send size={21} />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-950">Dir Fariinta</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Looma baahna magaca, email, cinwaan, ama nooca fariinta. Nidaamku wuxuu isticmaalayaa akoonkaaga.
                </p>
              </div>
            </div>

            <form onSubmit={submitMessage} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Fariintaada</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  disabled={hasContactMessage}
                  placeholder={hasContactMessage ? 'Waxaad hore u dirtay fariin. Halkan hoose ka eeg status-ka iyo jawaabta maamulka.' : 'Ku qor fariintaada halkan...'}
                  className="min-h-52 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-7 text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                />
              </label>

              <Button type="submit" variant="accent" loading={submitting} disabled={hasContactMessage}>
                <Send size={17} /> Dir Fariinta
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Fariintaada</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Status iyo jawaabta maamulka.</p>
              </div>
              {latestMessage && <Badge variant={statusVariant(latestMessage.status)}>{latestMessage.status}</Badge>}
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                </div>
              ) : latestMessage ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Fariinta aad dirtay</p>
                      <p className="text-xs font-bold text-slate-400">{formatDate(latestMessage.createdAt)}</p>
                    </div>
                    <p className="whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">{latestMessage.message}</p>
                  </div>

                  <div className={`rounded-2xl border p-4 ${latestMessage.adminReply ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="mb-3 flex items-center gap-2">
                      {latestMessage.adminReply ? <CheckCircle2 className="text-emerald-700" size={18} /> : <Clock3 className="text-amber-700" size={18} />}
                      <p className={`text-sm font-black ${latestMessage.adminReply ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {latestMessage.adminReply ? 'Jawaabta maamulka' : 'Weli lama jawaabin'}
                      </p>
                    </div>
                    <p className={`whitespace-pre-wrap text-sm font-semibold leading-7 ${latestMessage.adminReply ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {latestMessage.adminReply || 'Maamulka maktabadda wali kama jawaabin fariintan.'}
                    </p>
                    {latestMessage.repliedAt && <p className="mt-3 text-xs font-bold text-emerald-700">La jawaabay: {formatDate(latestMessage.repliedAt)}</p>}
                  </div>
                </div>
              ) : (
                <EmptyState icon={MessageSquare} title="Wali fariin ma dirin" description="Markaad fariin dirto, halkan ayaad ka arki doontaa status-keeda iyo jawaabta maamulka." />
              )}
            </div>
          </Card>
        </div>
      </section>
    </DashboardShell>
  );
}
