
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
  const [isQRScanning, setIsQRScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const startQRScanner = async () => {
    setIsQRScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      // Real simulation: look through employee database
      setTimeout(() => {
        if (employees.length > 0) {
           const luckyEmp = employees[0]; // Simulation pick
           onLogin({ id: luckyEmp.id, username: luckyEmp.systemLogin || '', role: 'employee', fullName: `${luckyEmp.lastName} ${luckyEmp.firstName}`, email: 'auto@zencorp.com' });
        } else {
           setError("No personnel signature detected.");
           setIsQRScanning(false);
        }
      }, 3000);
    } catch (err) { setIsQRScanning(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/5 -skew-y-12 translate-y-24" />
      
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] p-12 border border-white relative z-10 animate-in zoom-in-95 duration-700">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-[2rem] shadow-2xl mb-6"><span className="text-white text-3xl font-black">ZC</span></div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Secure Terminal</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Biometry & QR Authenticated</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 border border-slate-100 outline-none font-bold text-sm" placeholder="Terminal ID" />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 border border-slate-100 outline-none font-bold text-sm" placeholder="Security Key" />
          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}
          <div className="flex flex-col gap-3">
             <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs">Authorize Entry</button>
             <button type="button" onClick={startQRScanner} className="w-full border-2 border-indigo-600 text-indigo-600 font-black py-5 rounded-[2rem] hover:bg-indigo-50 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"><QrCode size={18} /> QR Login</button>
          </div>
        </form>
      </div>

      {isQRScanning && (
        <div className="fixed inset-0 bg-slate-950/95 z-[2000] flex flex-col items-center justify-center p-6">
           <div className="relative w-72 h-72 border-4 border-indigo-600 rounded-[3rem] overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-150" />
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_2s_infinite]" />
           </div>
           <p className="mt-10 text-white font-black uppercase tracking-[0.5em] animate-pulse text-xs text-center">Awaiting QR Signature Signature Signature...</p>
           <button onClick={() => setIsQRScanning(false)} className="mt-20 p-4 bg-white/10 rounded-full text-white"><X /></button>
        </div>
      )}
      <style>{` @keyframes scan { 0%, 100% { top: 10%; } 50% { top: 90%; } } `}</style>
    </div>
  );
};

export default LoginForm;
