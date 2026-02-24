import React from 'react';
import { AttendanceRecord } from '../types';
import { Clock, User as UserIcon, Calendar, CheckCircle, ArrowRightCircle, Trash2 } from 'lucide-react';
import { api } from '../api';

interface MonitoringDashboardProps {
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  t: any;
  isDarkMode: boolean;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
  requestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ attendance, setAttendance, t, isDarkMode, notify, requestConfirm }) => {
  const formatTime = (ts?: number) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const handleDelete = async (id: string) => {
    requestConfirm(
      t.delete || "Delete",
      t.deleteConfirm || "Are you sure you want to delete this record?",
      async () => {
        try {
          await api.deleteAttendance(id);
          setAttendance(prev => prev.filter(a => a.id !== id));
          notify('success', t.deleted || "Record deleted");
        } catch (e) {
          notify('error', "Failed to delete record");
        }
      }
    );
  };

  const sortedAttendance = [...attendance].sort((a, b) => b.clockIn - a.clockIn);

  const cardClass = `p-8 rounded-[2.5rem] border shadow-sm transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={cardClass}>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl">
            <Clock size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Personnel Monitoring</h2>
            <p className="text-slate-400 font-medium">Real-time arrival and departure registry.</p>
          </div>
        </div>
      </div>

      <div className={`${cardClass} overflow-x-auto no-scrollbar p-0 rounded-[3rem]`}>
        <table className="w-full text-left">
          <thead className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50/50 text-slate-400'}`}>
            <tr>
              <th className="px-8 py-5">Personnel</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Arrival</th>
              <th className="px-8 py-5">Departure</th>
              <th className="px-8 py-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
            {sortedAttendance.map(record => (
              <tr key={record.id} className="hover:bg-indigo-500/5 transition-colors group">
                <td className="px-8 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{record.employeeName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{record.position}</p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Calendar size={14} className="text-slate-300" /> {formatDate(record.date)}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-black">
                    {formatTime(record.clockIn)}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-black ${record.clockOut ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {formatTime(record.clockOut)}
                  </span>
                </td>
                <td className="px-8 py-5 text-right relative">
                  <div className="flex items-center justify-end gap-3">
                    {record.clockOut ? (
                      <div className="inline-flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
                        <CheckCircle size={14} className="text-emerald-500" /> Completed
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase animate-pulse">
                        <ArrowRightCircle size={14} /> On Site
                      </div>
                    )}

                    <button
                      onClick={() => handleDelete(record.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedAttendance.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-slate-300 text-sm font-medium">
                  No active or historical attendance records detected in the registry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
