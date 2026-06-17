import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: Check,
  error:   AlertTriangle,
  info:    Info,
};
const COLORS = {
  success: 'text-green-400 bg-green-500/15',
  error:   'text-red-400 bg-red-500/15',
  info:    'text-accent bg-accent/15',
};

let idSeed = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback((message, type = 'info', ms = 3500) => {
    const id = ++idSeed;
    setToasts(t => [...t.slice(-3), { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), ms);
    return id;
  }, [dismiss]);

  const api = {
    toast,
    success: (m, ms) => toast(m, 'success', ms),
    error:   (m, ms) => toast(m, 'error', ms),
    info:    (m, ms) => toast(m, 'info', ms),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2.5 max-w-[calc(100vw-2.5rem)]">
        {toasts.map(t => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div key={t.id} className="glass-dark rounded-xl shadow-2xl border border-white/10 px-4 py-3 flex items-center gap-3 min-w-[260px] animate-pop">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${COLORS[t.type]}`}>
                <Icon size={15} />
              </span>
              <p className="text-white text-sm flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-muted hover:text-white transition flex-shrink-0">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// Module-level escape hatch so non-component code (e.g. the API client) can toast.
let _externalToast = null;
export function setExternalToast(fn) { _externalToast = fn; }
export function notify(message, type = 'info') { _externalToast?.(message, type); }
