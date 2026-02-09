import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDarkMode: boolean;
    lang: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel, isDarkMode, lang }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onCancel} />
            <div className={`relative w-full max-w-md rounded-[3rem] p-10 shadow-2xl border animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}>
                <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                        <AlertTriangle size={28} />
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{title}</h3>
                <p className="text-sm font-bold text-slate-400 leading-relaxed mb-10">{message}</p>

                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                            }`}
                    >
                        {lang === 'ru' ? 'Отмена' : lang === 'en' ? 'Cancel' : 'Bekor qilish'}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all border-b-4 border-red-700 active:border-b-0 active:translate-y-1"
                    >
                        {lang === 'ru' ? 'Подтвердить' : lang === 'en' ? 'Confirm' : 'Tasdiqlash'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
