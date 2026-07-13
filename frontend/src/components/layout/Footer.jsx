import { BookOpen, Code2, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white"><BookOpen size={22} /></span>
            <div>
              <p className="text-lg font-black text-slate-950">Kaah Library</p>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">Digital System</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">Kaah Library is a digital system for managing books, members, borrowing, and orders easily.</p>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Contact</h3>
          <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
            <p className="flex items-center gap-2"><MapPin size={16} /> Mogadishu, Somalia</p>
            <p className="flex items-center gap-2"><Mail size={16} /> kaah.library@example.com</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Stack</h3>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600"><Code2 size={16} /> Modern Web System</p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-5 text-center text-xs font-bold text-slate-500">© 2026 Kaah Library. All rights reserved.</div>
    </footer>
  );
}
