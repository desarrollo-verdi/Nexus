import { CheckCircle, AlertCircle, X } from 'lucide-react';

// Lo dejamos como una interfaz local común sin exportar
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-xs w-full">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        
        return (
          <div
            key={toast.id}
            className="flex items-center w-full p-4 text-slate-600 bg-white rounded-2xl shadow-2xl border border-slate-100 animate-fade-in-up transition-all duration-300"
            role="alert"
          >
            <div
              className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${
                isSuccess ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'
              }`}
            >
              {isSuccess ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>

            <div className="ms-3 text-sm font-semibold pr-2">{toast.message}</div>

            <button
              type="button"
              className="ms-auto -mx-1.5 -my-1.5 bg-white text-slate-400 hover:text-slate-900 rounded-lg p-1.5 hover:bg-slate-100 inline-flex items-center justify-center h-8 w-8 transition-colors"
              onClick={() => onClose(toast.id)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}