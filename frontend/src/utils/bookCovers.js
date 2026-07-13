const COVERS = [
  { bg: 'from-blue-600 via-indigo-700 to-slate-950', spine: '#1e3a8a', accent: 'border-blue-200/30 text-blue-50' },
  { bg: 'from-emerald-500 via-teal-700 to-slate-950', spine: '#047857', accent: 'border-emerald-200/30 text-emerald-50' },
  { bg: 'from-amber-500 via-orange-700 to-slate-950', spine: '#b45309', accent: 'border-amber-200/30 text-amber-50' },
  { bg: 'from-rose-500 via-pink-700 to-slate-950', spine: '#be123c', accent: 'border-rose-200/30 text-rose-50' },
  { bg: 'from-violet-500 via-purple-700 to-slate-950', spine: '#6d28d9', accent: 'border-violet-200/30 text-violet-50' },
  { bg: 'from-cyan-500 via-sky-700 to-slate-950', spine: '#0369a1', accent: 'border-cyan-200/30 text-cyan-50' },
];

export function getBookCover(id = 0) {
  return COVERS[Math.abs(Number(id) || 0) % COVERS.length];
}

export function getBookGradient(id = 0) {
  return getBookCover(id).bg;
}
