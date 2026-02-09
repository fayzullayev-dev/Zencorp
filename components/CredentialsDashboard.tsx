
import React, { useState } from 'react';
import { Employee } from '../types';
import { Key, Save, User as UserIcon, Lock } from 'lucide-react';
import { api } from '../api';

interface CredentialsDashboardProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  t: any;
  isDarkMode: boolean;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const CredentialsDashboard: React.FC<CredentialsDashboardProps> = ({ employees, setEmployees, t, isDarkMode, notify }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleSave = async (id: string) => {
    if (!login || !password) return;
    try {
      await api.updateEmployee(id, { systemLogin: login, systemPassword: password });
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, systemLogin: login, systemPassword: password } : e));
      setEditingId(null);
      setLogin('');
      setPassword('');
      notify('success', t.credentialsUpdated || "Employee credentials updated successfully.");
    } catch (e) {
      notify('error', "Failed to save credentials");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex items-center gap-6">
        <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl">
          <Key size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Control</h2>
          <p className="text-slate-400 font-medium italic">Configure system identifiers and security keys for personnel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-6">
              <img src={emp.photoUrl || 'https://picsum.photos/300/400'} className="w-12 h-16 rounded-xl object-cover border border-slate-100" alt="" />
              <div>
                <p className="font-bold text-slate-900">{emp.lastName} {emp.firstName}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{emp.position}</p>
              </div>
            </div>

            {editingId === emp.id ? (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase px-2">System Login</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 text-slate-300" size={14} />
                    <input value={login} onChange={e => setLogin(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" placeholder="New Login" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase px-2">Access Key</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-slate-300" size={14} />
                    <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" placeholder="New Password" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="flex-1 py-2 text-[10px] font-black text-slate-400 uppercase">Cancel</button>
                  <button onClick={() => handleSave(emp.id)} className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">Apply</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Login</span>
                  <span className="text-xs font-bold text-slate-800">{emp.systemLogin || "Not Configured"}</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key</span>
                  <span className="text-xs font-bold text-slate-800">{emp.systemPassword ? "••••••••" : "Missing"}</span>
                </div>
                <button
                  onClick={() => { setEditingId(emp.id); setLogin(emp.systemLogin || ''); setPassword(emp.systemPassword || ''); }}
                  className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                >
                  Configure Access
                </button>
              </div>
            )}
          </div>
        ))}
        {employees.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-300 italic font-medium">No personnel detected to configure.</div>
        )}
      </div>
    </div>
  );
};

export default CredentialsDashboard;
