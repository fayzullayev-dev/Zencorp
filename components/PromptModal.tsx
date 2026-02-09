import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    placeholder: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    isDarkMode: boolean;
    lang: string;
}

const PromptModal: React.FC<PromptModalProps> = ({ isOpen, title, message, placeholder, onConfirm, onCancel, isDarkMode, lang }) => {
    const [value, setValue] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onCancel} />
            <div className={`relative w-full max-w-md rounded-[3rem] p-10 shadow-2xl border animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}>
                <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                        <MessageCircle size={28} />
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{title}</h3>
                <p className="text-sm font-bold text-slate-400 leading-relaxed mb-6">{message}</p>

                <input
                    autoFocus
                    className={`w-full px-6 py-4 rounded-2xl font-bold mb-8 outline-none border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600'
                        }`}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onConfirm(value)}
                />

                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                            }`}
                    >
                        {lang === 'ru' ? 'Отмена' : lang === 'en' ? 'Cancel' : 'Bekor qilish'}
                    </button>
                    <button
                        onClick={() => onConfirm(value)}
                        className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
                    >
                        {lang === 'ru' ? 'Отправить' : lang === 'en' ? 'Submit' : 'Yuborish'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptModal;
