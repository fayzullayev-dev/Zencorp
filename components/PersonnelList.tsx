
import React, { useState } from 'react';
import { Employee, Catalog, AttendanceRecord, User, Language } from '../types';
import { Search, Phone, MapPin, FileText, Download, Shield, Mail, CheckCircle, Trash2, Archive, UserX, Hash } from 'lucide-react';
import { api } from '../api';

interface PersonnelListProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  t: any;
  lang: string;
  isDarkMode: boolean;
  viewType: 'workers' | 'catalog' | 'archive';
  catalogId?: string;
  catalogs: Catalog[];
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
  requestConfirm: (title: string, message: string, onConfirm: () => void) => void;
  currentUser: User;
}

const PersonnelList: React.FC<PersonnelListProps> = ({
  employees, attendance, setEmployees, t, lang, isDarkMode, viewType, catalogId, catalogs, notify, requestConfirm, currentUser
}) => {
  const [query, setQuery] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
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
    const title = lang === 'ru' ? "Архивация" : "Archiving";
    const msg = lang === 'ru' ? "Переместить сотрудника в зашифрованный архив? Доступ к системе будет заблокирован." : "Move employee to encrypted archive? System access will be blocked.";

    requestConfirm(title, msg, () => {
      api.updateEmployee(id, { status: 'archived' }).then(() => {
        setEmployees?.(prev => prev.map(e => e.id === id ? { ...e, status: 'archived', isOnline: false } : e));
        notify('success', lang === 'ru' ? "Сотрудник архивирован" : "Employee archived");
      }).catch(err => notify('error', "Failed to archive employee"));
    });
  };

  const handleRestore = (id: string) => {
    const title = lang === 'ru' ? "Восстановление" : "Restoration";
    const msg = lang === 'ru' ? "Восстановить сотрудника из архива?" : "Restore employee from archive?";

    requestConfirm(title, msg, () => {
      api.updateEmployee(id, { status: 'active' }).then(() => {
        setEmployees?.(prev => prev.map(e => e.id === id ? { ...e, status: 'active' } : e));
        notify('success', lang === 'ru' ? "Сотрудник восстановлен" : "Employee restored");
      }).catch(err => notify('error', "Failed to restore employee"));
    });
  };

  const handleDelete = (id: string) => {
    const title = lang === 'ru' ? "Удаление" : "Deletion";
    const msg = lang === 'ru'
      ? "Удалить сотрудника НАВСЕГДА? Это действие нельзя отменить!"
      : "Delete employee FOREVER? This action cannot be undone!";

    requestConfirm(title, msg, () => {
      api.deleteEmployee(id).then(() => {
        setEmployees?.(prev => prev.filter(e => e.id !== id));
        notify('success', lang === 'ru' ? "Сотрудник полностью удален" : "Employee deleted forever");
      }).catch(err => notify('error', "Failed to delete employee"));
    });
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
                <tr
                  key={emp.id}
                  className="hover:bg-indigo-500/5 transition-all group cursor-pointer"
                  onClick={() => setSelectedEmp(emp)}
                >
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
                  <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                    {viewType === 'archive' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleRestore(emp.id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle size={14} /></button>
                        <button onClick={() => handleDelete(emp.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                      </div>
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

    return null;
  };

  const currentTitle = viewType === 'catalog'
    ? catalogs.find(c => c.id === catalogId)?.name
    : viewType === 'archive' ? 'Защищенный архив' : `Реестр ${viewType === 'workers' ? 'сотрудников' : ''}`;

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

      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4 cursor-pointer" onClick={() => setSelectedEmp(null)}>
          <div
            className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 cursor-default p-8 md:p-12 relative flex flex-col md:flex-row gap-10`}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setSelectedEmp(null)} className="absolute top-8 right-8 p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors"><Mail size={20} /></button>
            <div className="flex-shrink-0 flex flex-col items-center">
              <img src={selectedEmp.photoUrl} className="w-48 h-64 rounded-3xl object-cover shadow-2xl border-4 border-white dark:border-slate-800 mb-6" alt="" />
              <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400">System Signature</span>
                <p className="font-mono text-indigo-500 font-bold">{selectedEmp.id}</p>
                {selectedEmp.qrDataUrl && <img src={selectedEmp.qrDataUrl} className="w-24 h-24 mt-2 rounded-xl border bg-white p-2" alt="QR" />}
              </div>
            </div>

            <div className="flex-1 space-y-8">
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{selectedEmp.lastName} {selectedEmp.firstName}</h3>
                <p className="text-lg font-bold text-indigo-600 uppercase tracking-widest">{selectedEmp.middleName}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">Должность</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.position}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">Отдел</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{catalogs.find(c => c.id === selectedEmp.catalogId)?.name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">Телефон</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.phoneNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">ПИНФЛ</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.passportPIN}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">Паспортные данные</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.passportSerial}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">Место жительства</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 italic">{selectedEmp.residence}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                  <span>График: {selectedEmp.workingHours}</span>
                  <span>Дни: {selectedEmp.workingDays.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelList;
