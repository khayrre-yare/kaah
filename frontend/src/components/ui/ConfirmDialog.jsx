import { TriangleAlert } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

export default function ConfirmDialog({ open, title = 'Confirm action', description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, loading = false, onConfirm, onCancel }) {
  return (
    <Modal isOpen={open} onClose={onCancel} title={title} description={description}>
      <div className="flex gap-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-7 text-slate-600">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${danger ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
          <TriangleAlert size={22} />
        </span>
        <p>This action will be sent to the existing backend endpoint. Please confirm before continuing.</p>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'accent'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
