import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  info: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
};

const BORDERS: Record<ToastType, string> = {
  success: 'border-green-500/20',
  error: 'border-red-500/20',
  warning: 'border-amber-500/20',
  info: 'border-blue-500/20',
};

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastNotification({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-3 p-4 min-w-[280px] max-w-sm bg-[#0d0d0c] border ${BORDERS[toast.type]} rounded-sm shadow-xl`}
    >
      {ICONS[toast.type]}
      <span className="font-sans text-xs text-zinc-300 flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default ToastContainer;
