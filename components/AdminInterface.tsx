
import React, { useState } from 'react';
import { Employee } from '../types';
import { ShieldCheck, ArrowDownRight, UserCheck, X, Link } from 'lucide-react';

interface AdminInterfaceProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  t: any;
  isDarkMode: boolean;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const AdminInterface: React.FC<AdminInterfaceProps> = ({ employees, setEmployees, t, isDarkMode, notify }) => {
  const [headId, setHeadId] = useState('');
  const [subordinateId, setSubordinateId] = useState('');

  const handleSetSubordination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headId || !subordinateId || headId === subordinateId) return;

    setEmployees(employees.map(emp =>
      emp.id === subordinateId ? { ...emp, reportsToId: headId } : emp
    ));
    setHeadId('');
    setSubordinateId('');
    notify('success', "Hierarchical link established successfully.");
  };

  const removeLink = (id: string) => {
    setEmployees(employees.map(emp => emp.id === id ? { ...emp, reportsToId: undefined } : emp));
  };

  const cardClass = `p-8 rounded-[2.5rem] border shadow-sm transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`;
  const inputClass = `w-full px-5 py-4 rounded-2xl font-bold outline-none border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600'}`;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className={`${cardClass} flex items-center gap-8`}>
        <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">{t.hierarchy}</h2>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-bold`}>Define and manage company reporting lines and chain of command.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className={`${cardClass} space-y-8`}>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <Link size={16} className="text-indigo-500" /> Construct Link
          </h3>
          <form onSubmit={handleSetSubordination} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-2 tracking-widest">Select Supervisor</label>
              <select
                value={headId} onChange={e => setHeadId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select Official Head...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.lastName} {e.firstName} ({e.position})</option>)}
              </select>
            </div>
            <div className="flex justify-center py-2">
              <ArrowDownRight size={24} className="text-slate-200 animate-bounce" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-2 tracking-widest">Assign Subordinate</label>
              <select
                value={subordinateId} onChange={e => setSubordinateId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select Subordinate Unit...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.lastName} {e.firstName} ({e.position})</option>)}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:scale-[1.02] transition-all"
            >
              Verify & Link Units
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-4">
            <ArrowDownRight size={16} className="text-indigo-500" /> Reporting Structure
          </h3>
          <div className="space-y-4">
            {employees.filter(e => e.reportsToId).map(sub => {
              const head = employees.find(h => h.id === sub.reportsToId);
              return (
                <div key={sub.id} className={`${cardClass} p-6 flex items-center justify-between group`}>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-indigo-500">{head?.lastName}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase truncate w-24">{head?.position}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300"><ArrowDownRight size={14} /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{sub.lastName}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase truncate w-24">{sub.position}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLink(sub.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
            {employees.filter(e => e.reportsToId).length === 0 && (
              <div className="py-24 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-100/10 rounded-[3rem]">
                No hierarchical data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInterface;
