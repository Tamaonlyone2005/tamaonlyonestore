
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-slide-up backdrop-blur-md ${
              toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' :
              toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
              'bg-blue-500/90 border-blue-400 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={24} className="text-white shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={24} className="text-white shrink-0" />}
            {toast.type === 'info' && <Info size={24} className="text-white shrink-0" />}
            <span className="text-sm font-bold flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-white/80 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
