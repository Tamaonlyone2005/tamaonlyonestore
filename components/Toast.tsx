
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
    }, 4000); // Slightly longer duration
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] animate-slide-up border-l-4 transition-all transform hover:scale-[1.02] ${
              toast.type === 'success' ? 'bg-white border-green-500 text-gray-800' :
              toast.type === 'error' ? 'bg-white border-red-500 text-gray-800' :
              'bg-white border-blue-500 text-gray-800'
            }`}
          >
            <div className={`p-2 rounded-full shrink-0 ${
               toast.type === 'success' ? 'bg-green-100 text-green-600' :
               toast.type === 'error' ? 'bg-red-100 text-red-600' :
               'bg-blue-100 text-blue-600'
            }`}>
                {toast.type === 'success' && <CheckCircle size={20} strokeWidth={3} />}
                {toast.type === 'error' && <AlertCircle size={20} strokeWidth={3} />}
                {toast.type === 'info' && <Info size={20} strokeWidth={3} />}
            </div>
            
            <div className="flex-1">
                <h4 className={`text-xs font-black uppercase tracking-wider mb-0.5 ${
                    toast.type === 'success' ? 'text-green-600' :
                    toast.type === 'error' ? 'text-red-600' :
                    'text-blue-600'
                }`}>
                    {toast.type === 'success' ? 'Sukses' : toast.type === 'error' ? 'Error' : 'Info'}
                </h4>
                <p className="text-sm font-bold text-gray-900 leading-tight">{toast.message}</p>
            </div>

            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-800 transition-colors p-1 bg-gray-100 hover:bg-gray-200 rounded-md">
              <X size={16} />
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
