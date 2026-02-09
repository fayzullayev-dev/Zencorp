import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

interface NotificationSystemProps {
    notifications: Toast[];
    removeNotification: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, removeNotification }) => {
    return (
        <div className="fixed top-10 right-10 z-[3000] flex flex-col gap-4 w-80">
            {notifications.map(n => (
                <div
                    key={n.id}
                    className={`p-5 rounded-3xl shadow-2xl border backdrop-blur-xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-300 ${n.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                            n.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                        }`}
                >
                    <div className="shrink-0">
                        {n.type === 'success' && <CheckCircle size={20} />}
                        {n.type === 'error' && <AlertCircle size={20} />}
                        {n.type === 'info' && <Info size={20} />}
                    </div>
                    <p className="text-xs font-bold flex-1">{n.message}</p>
                    <button onClick={() => removeNotification(n.id)} className="hover:opacity-50 transition-opacity">
                        <X size={16} />
                    </button>
                    <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-3000 w-full" style={{ animation: 'progress 3s linear forwards' }} />
                </div>
            ))}
            <style>{`
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export default NotificationSystem;
