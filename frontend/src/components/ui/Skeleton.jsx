export default function Skeleton({ className = '' }) {
  return <div className={`skeleton-shimmer rounded-2xl ${className}`} />;
}

export function BookCardSkeleton() {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <Skeleton className="h-60" />
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}
