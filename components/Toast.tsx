
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info, Zap } from 'lucide-react';

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
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Position: Top Center */}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] animate-slide-up transition-all transform hover:scale-[1.02] border border-white/10 relative overflow-hidden ${
              toast.type === 'success' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' :
              toast.type === 'error' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white' :
              'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
            }`}
          >
            {/* Decorative Shine */}
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>

            <div className="p-2 bg-white/20 rounded-full shrink-0 backdrop-blur-sm shadow-inner">
                {toast.type === 'success' && <CheckCircle size={24} strokeWidth={3} className="text-white" />}
                {toast.type === 'error' && <AlertTriangle size={24} strokeWidth={3} className="text-white" />}
                {toast.type === 'info' && <Info size={24} strokeWidth={3} className="text-white" />}
            </div>
            
            <div className="flex-1 relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                    {toast.type === 'success' ? 'Berhasil' : toast.type === 'error' ? 'Gagal' : 'Info'}
                </h4>
                <p className="text-sm font-bold leading-tight shadow-black drop-shadow-md">{toast.message}</p>
            </div>

            <button onClick={() => removeToast(toast.id)} className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-lg z-10">
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
