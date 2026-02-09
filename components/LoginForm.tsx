
import React, { useState, useRef } from 'react';
import { User, Employee } from '../types';
import { QrCode, Camera, ShieldCheck, X } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: User) => void;
  employees: Employee[];
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, employees }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin({ id: 'dir-1', username: 'admin', role: 'director', fullName: 'Alexander Director', email: 'director@zencorp.com' });
      return;
    }
    const emp = employees.find(e => e.systemLogin === username && e.systemPassword === password);
    if (emp) {
      onLogin({ id: emp.id, username: emp.systemLogin || '', role: 'employee', fullName: `${emp.lastName} ${emp.firstName}`, email: `${username}@zencorp.com` });
    } else { setError('Access Denied: Check Security Keys'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/5 -skew-y-12 translate-y-24" />

      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] p-12 border border-white relative z-10 animate-in zoom-in-95 duration-700">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-[2rem] shadow-2xl mb-6"><span className="text-white text-3xl font-black">ZC</span></div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Terminal Auth</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Security Key Required</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 border border-slate-100 outline-none font-bold text-sm" placeholder="Terminal ID" />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 border border-slate-100 outline-none font-bold text-sm" placeholder="Security Key" />
          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}
          <div className="flex flex-col gap-3">
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs">Authorize Entry</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
