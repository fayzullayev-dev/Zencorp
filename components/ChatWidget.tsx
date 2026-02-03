
import React, { useState, useEffect, useRef } from 'react';
import { User, Employee, Message, Language } from '../types';
import { MessageSquare, Send, X, Shield } from 'lucide-react';

interface ChatWidgetProps {
  currentUser: User;
  employees: Employee[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isDarkMode: boolean;
  lang: Language;
}

const chatTranslations = {
  en: { terminal: "HQ Terminal", contacts: "Select Contact", type: "Type message...", director: "General Director" },
  ru: { terminal: "Терминал HQ", contacts: "Выберите контакт", type: "Напишите сообщение...", director: "Генеральный директор" },
  uz: { terminal: "HQ Terminali", contacts: "Kontaktni tanlang", type: "Xabar yozing...", director: "Bosh direktor" }
};

import { api } from '../api';

const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUser, employees, messages, setMessages, isDarkMode, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ct = chatTranslations[lang];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, activeChatId]);

  useEffect(() => {
    if (activeChatId && isOpen) {
      // Mark as read in backend
      api.markMessagesRead(currentUser.id, activeChatId).catch(console.error);
      // Optimistic update
      setMessages(prev => prev.map(m =>
        (m.fromId === activeChatId && m.toId === currentUser.id && !m.read) ? { ...m, read: true } : m
      ));
    }
  }, [activeChatId, isOpen, messages.length]); // Dependencies adjusted to avoid infinite loop but catch new messages

  const filteredMessages = messages.filter(m =>
    (m.fromId === currentUser.id && m.toId === activeChatId) ||
    (m.toId === currentUser.id && m.fromId === activeChatId)
  );

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeChatId) return;
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      fromId: currentUser.id,
      toId: activeChatId,
      text: text.trim(),
      timestamp: Date.now(),
      read: false
    };
    try {
      await api.sendMessage(newMessage);
      setMessages(prev => [...prev, newMessage]);
      setText('');
    } catch (e) { console.error("Failed to send", e); }
  };

  const currentChatPartner = employees.find(e => e.id === activeChatId) || (activeChatId === 'dir-1' ? { firstName: 'Alexander', lastName: 'Director', position: ct.director, photoUrl: '', isOnline: true } : null);

  const hasUnread = messages.some(m => m.toId === currentUser.id && !m.read);

  const contactList = currentUser.role === 'director'
    ? employees.filter(e => e.id !== currentUser.id)
    : [{ id: 'dir-1', firstName: 'Alexander', lastName: 'Director', position: ct.director, photoUrl: '', isOnline: true }];

  return (
    <div className="fixed bottom-10 right-10 z-[2000] flex flex-col items-end gap-4">
      {isOpen && (
        <div className={`w-[350px] h-[500px] rounded-[2.5rem] shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
            {activeChatId ? (
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChatId(null)} className="p-1 hover:bg-white/10 rounded-lg">←</button>
                <p className="font-bold text-sm truncate w-32">{currentChatPartner?.firstName} {currentChatPartner?.lastName}</p>
              </div>
            ) : (<p className="font-black uppercase text-xs tracking-widest">{ct.terminal}</p>)}
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            {!activeChatId ? (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{ct.contacts}</p>
                {contactList.map((emp: any) => (
                  <button key={emp.id} onClick={() => setActiveChatId(emp.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                    <div className="relative">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500">{emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full rounded-full object-cover" /> : <Shield size={20} />}</div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${emp.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                    <div className="text-left flex-1"><p className="text-xs font-bold truncate">{emp.firstName} {emp.lastName}</p><p className="text-[8px] text-slate-400 uppercase font-black">{emp.position}</p></div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map(m => (
                  <div key={m.id} className={`flex ${m.fromId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-xs font-medium ${m.fromId === currentUser.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
          {activeChatId && (
            <form onSubmit={sendMessage} className="p-6 border-t border-slate-100/10 flex gap-2">
              <input className={`flex-1 px-4 py-3 rounded-xl text-xs outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} placeholder={ct.type} value={text} onChange={e => setText(e.target.value)} />
              <button type="submit" className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Send size={16} /></button>
            </form>
          )}
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 bg-indigo-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 transition-all group relative">
        <MessageSquare className="group-hover:animate-bounce" />
        {hasUnread && <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-4 border-white animate-pulse" />}
      </button>
    </div>
  );
};

export default ChatWidget;
