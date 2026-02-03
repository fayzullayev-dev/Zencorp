
import React from 'react';
import { AttendanceRecord, Employee } from '../types';
import { Clock, User as UserIcon } from 'lucide-react';

interface AttendanceLogProps {
  attendance: AttendanceRecord[];
  employees: Employee[];
}

const AttendanceLog: React.FC<AttendanceLogProps> = ({ attendance, employees }) => {
  const formatTime = (ts?: number) => {
    if (!ts) return "--:--";
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Group by date
  const grouped = attendance.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance Log</h2>
          <p className="text-slate-500">Chronological history of shift arrivals and departures.</p>
        </div>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-20 text-center text-slate-400">
          No attendance data recorded yet.
        </div>
      )}

      {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([date, records]) => (
        <div key={date} className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-2">{formatDate(date)}</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee & Position</th>
                  <th className="px-6 py-4">Arrival</th>
                  <th className="px-6 py-4">Departure</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* FIX: Cast records to AttendanceRecord[] to ensure .map exists */}
                {(records as AttendanceRecord[]).map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                          <UserIcon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{record.employeeName}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{record.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                        <Clock size={14} />
                        {formatTime(record.clockIn)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Clock size={14} />
                        {formatTime(record.clockOut)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {record.clockOut ? (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded uppercase">Shift Ended</span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded uppercase animate-pulse">On Site</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttendanceLog;
