import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const colors = {
    danger: { bg: 'bg-red-600/20', text: 'text-red-400', btn: 'bg-red-600 hover:bg-red-700' },
    warning: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', btn: 'bg-yellow-600 hover:bg-yellow-700' },
    info: { bg: 'bg-blue-600/20', text: 'text-blue-400', btn: 'bg-blue-600 hover:bg-blue-700' },
  };

  const c = colors[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-lg ${c.bg}`}>
            <AlertTriangle className={`w-5 h-5 ${c.text}`} />
          </div>
          <button onClick={onCancel} className="p-1 text-dark-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-dark-300 mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm text-dark-300 hover:text-white transition-colors disabled:opacity-50">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 ${c.btn}`}>
            {loading ? '处理中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
