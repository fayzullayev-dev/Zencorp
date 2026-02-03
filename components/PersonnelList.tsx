
import React, { useState } from 'react';
import { Employee, Catalog, AttendanceRecord } from '../types';
import { Search, Phone, MapPin, FileText, Download, Shield, Mail, CheckCircle, Trash2, Archive, UserX, Hash } from 'lucide-react';
import { api } from '../api';

interface PersonnelListProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  setEmployees?: React.Dispatch<React.SetStateAction<Employee[]>>;
  t: any;
  lang: string;
  isDarkMode: boolean;
  viewType: 'contacts' | 'documents' | 'workers' | 'catalog' | 'archive';
  catalogId?: string;
  catalogs: Catalog[];
}

const PersonnelList: React.FC<PersonnelListProps> = ({ employees, attendance, setEmployees, t, lang, isDarkMode, viewType, catalogId, catalogs }) => {
  const [query, setQuery] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const getStatus = (emp: Employee) => {
    if (emp.status === 'archived') return { label: 'Archived', color: 'bg-slate-400' };

    const isWorking = attendance.some(a => a.employeeId === emp.id && a.date === today && !a.clockOut);
    if (isWorking) return { label: lang === 'ru' ? 'Работает' : 'Working', color: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' };

    if (emp.isOnline) return { label: lang === 'ru' ? 'Онлайн' : 'Online', color: 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]' };

    return { label: lang === 'ru' ? 'Оффлайн' : 'Offline', color: 'bg-amber-400' };
  };

  const filtered = employees.filter(e => {
    // 1. Фильтр архива
    const isArchived = e.status === 'archived';
    if (viewType === 'archive') {
      if (!isArchived) return false;
    } else {
      if (isArchived) return false;
    }

    // 2. ФИЛЬТРАЦИЯ ПО КАТАЛОГУ (Исправлено и усилено)
    if (viewType === 'catalog' && catalogId) {
      // Сравниваем ID каталога сотрудника с выбранным ID. Используем строгий поиск.
      if (String(e.catalogId) !== String(catalogId)) return false;
    }

    // 3. Поиск по тексту
    const searchString = `${e.firstName} ${e.lastName} ${e.middleName} ${e.position} ${e.phoneNumber} ${e.passportPIN}`.toLowerCase();
    const matchesQuery = searchString.includes(query.toLowerCase());

    return matchesQuery;
  });

  const handleArchive = (id: string) => {
    if (confirm(lang === 'ru' ? "Переместить сотрудника в зашифрованный архив? Доступ к системе будет заблокирован." : "Move employee to encrypted archive? System access will be blocked.")) {
      api.updateEmployee(id, { status: 'archived' }).then(() => {
        setEmployees?.(prev => prev.map(e => e.id === id ? { ...e, status: 'archived', isOnline: false } : e));
      }).catch(err => alert("Failed to archive employee"));
    }
  };

  const handleRestore = (id: string) => {
    if (confirm(lang === 'ru' ? "Восстановить сотрудника из архива?" : "Restore employee from archive?")) {
      api.updateEmployee(id, { status: 'active' }).then(() => {
        setEmployees?.(prev => prev.map(e => e.id === id ? { ...e, status: 'active' } : e));
      }).catch(err => alert("Failed to restore employee"));
    }
  };

  const cardClass = `p-8 rounded-[2.5rem] border shadow-sm transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`;
  const inputClass = `w-full pl-14 pr-4 py-4 rounded-2xl font-bold outline-none border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 focus:bg-white focus:border-indigo-600'}`;

  const renderView = () => {
    if (filtered.length === 0) {
      return (
        <div className="py-40 text-center flex flex-col items-center gap-6">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
            {viewType === 'archive' ? <Archive size={40} /> : <Search size={40} />}
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">
            {viewType === 'catalog' ? "В этом разделе пока нет сотрудников." :
              viewType === 'archive' ? "Архив пуст." : "Поиск не дал результатов."}
          </p>
        </div>
      );
    }

    if (viewType === 'workers' || viewType === 'catalog' || viewType === 'archive') {
      return (
        <div className={`${cardClass} overflow-x-auto no-scrollbar p-0 rounded-[3rem]`}>
          <table className="w-full text-left">
            <thead className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-8 py-6">ID Unit</th>
                <th className="px-8 py-6">Personnel</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Position</th>
                <th className="px-8 py-6 text-right">Control</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-indigo-500/5 transition-all group">
                  <td className="px-8 py-5 text-[10px] font-black font-mono text-indigo-500">{emp.id.slice(-6)}</td>
                  <td className="px-8 py-5 flex items-center gap-4">
                    <img src={emp.photoUrl} className="w-10 h-14 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all border border-slate-200 shadow-sm" />
                    <div>
                      <p className="font-bold text-sm leading-none mb-1">{emp.lastName} {emp.firstName}</p>
                      <p className="text-[8px] text-slate-400 uppercase font-black">{emp.middleName}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const status = getStatus(emp);
                        return (
                          <>
                            <div className={`w-2 h-2 rounded-full ${status.color}`} />
                            <span className="text-[10px] font-black uppercase text-slate-500">{status.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-8 py-5"><span className="text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-500 px-3 py-1.5 rounded-lg">{emp.position}</span></td>
                  <td className="px-8 py-5 text-right">
                    {viewType === 'archive' ? (
                      <button onClick={() => handleRestore(emp.id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle size={14} /></button>
                    ) : (
                      <button onClick={() => handleArchive(emp.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><UserX size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filtered.map(emp => (
          <div key={emp.id} className={`${cardClass} hover:border-indigo-500 group relative overflow-hidden flex flex-col`}>
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <img src={emp.photoUrl} className="w-20 h-28 rounded-2xl object-cover shadow-2xl border border-slate-100/50" />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatus(emp).color}`} />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-black group-hover:text-indigo-500 transition-colors leading-tight">{emp.lastName} {emp.firstName}</h4>
                <p className="text-[8px] text-slate-400 font-black uppercase mb-1">{emp.middleName}</p>
                <p className="text-[10px] font-black uppercase text-indigo-500">{emp.position}</p>
                {emp.qrDataUrl && (
                  <img src={emp.qrDataUrl} className="mt-4 w-12 h-12 rounded-lg border shadow-sm bg-white p-1" alt="QR" />
                )}
              </div>
            </div>
            {viewType === 'contacts' ? (
              <div className="space-y-4 pt-6 border-t border-slate-100/10 mt-auto">
                <div className="flex items-center gap-4"><Phone size={16} className="text-slate-400" /><p className="text-sm font-bold">{emp.phoneNumber}</p></div>
                <div className="flex items-center gap-4"><MapPin size={16} className="text-slate-400" /><p className="text-sm font-bold truncate">{emp.residence}</p></div>
                <div className="flex items-center gap-4"><Mail size={16} className="text-slate-400" /><p className="text-sm font-bold truncate lowercase">{emp.systemLogin}@zencorp.com</p></div>
              </div>
            ) : (
              <div className="space-y-4 pt-6 border-t border-slate-100/10 mt-auto">
                <div className="flex items-center justify-between p-4 bg-slate-50/5 rounded-2xl border border-slate-100/10">
                  <Shield className="text-indigo-500" size={18} /><p className="text-xs font-bold">{emp.passportSerial}</p>
                  <Download size={14} className="text-indigo-500 cursor-pointer" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50/5 rounded-2xl border border-slate-100/10">
                  <Hash className="text-emerald-500" size={18} /><p className="text-[10px] font-bold">{emp.passportPIN}</p>
                  <span className="text-[8px] font-black uppercase text-slate-400">ПИНФЛ</span>
                </div>
              </div>
            )}
            <button
              onClick={() => handleArchive(emp.id)}
              className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
            >
              <UserX size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const currentTitle = viewType === 'catalog'
    ? catalogs.find(c => c.id === catalogId)?.name
    : viewType === 'archive' ? 'Secure Archive' : `${viewType} Registry`;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="text-4xl font-black italic tracking-tighter uppercase">
          {currentTitle}
        </h2>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input className={inputClass} placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      {renderView()}
    </div>
  );
};

export default PersonnelList;
