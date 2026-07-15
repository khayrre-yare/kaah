import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../../hooks/useNotifications';

export default function AdminNotifications({ buttonClassName = 'h-10 w-10' }) {
  const notifications = useNotifications();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/admin/approvals')}
      className={`focus-ring relative grid place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 ${buttonClassName}`}
      aria-label="Open approvals"
    >
      <Bell size={18} />
      {notifications.count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
          {notifications.count}
        </span>
      )}
    </button>
  );
}
