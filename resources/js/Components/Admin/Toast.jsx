import { useToast } from '@/contexts/ToastContext';

const STYLES = {
    success: { bar: 'bg-green-500',  bg: 'bg-green-50  border-green-200',  text: 'text-green-800',  icon: '✓' },
    error:   { bar: 'bg-red-500',    bg: 'bg-red-50    border-red-200',    text: 'text-red-800',    icon: '✕' },
    warning: { bar: 'bg-amber-500',  bg: 'bg-amber-50  border-amber-200',  text: 'text-amber-800',  icon: '!' },
    info:    { bar: 'bg-blue-500',   bg: 'bg-blue-50   border-blue-200',   text: 'text-blue-800',   icon: 'i' },
};

export default function Toast() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
            {toasts.map((toast) => {
                const s = STYLES[toast.type] ?? STYLES.info;
                return (
                    <div
                        key={toast.id}
                        className={`flex items-start gap-3 rounded-xl border shadow-lg overflow-hidden ${s.bg} animate-in slide-in-from-right-5 fade-in duration-200`}
                    >
                        <div className={`w-1 self-stretch shrink-0 ${s.bar}`} />
                        <div className="flex items-start gap-2 flex-1 py-3 pr-3">
                            <span className={`text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white ${s.bar}`}>
                                {s.icon}
                            </span>
                            <p className={`text-sm font-medium flex-1 ${s.text}`}>{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className={`text-xs opacity-50 hover:opacity-80 transition shrink-0 ${s.text}`}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
