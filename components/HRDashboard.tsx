
import React from 'react';
import { User, Employee, Task } from '../types';
import { ShieldCheck, UserCheck, Send, FileText, Download, CheckCircle } from 'lucide-react';

interface HRDashboardProps {
  currentUser: User;
  employees: Employee[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const HRDashboard: React.FC<HRDashboardProps> = ({
  currentUser, employees, tasks, setTasks, notify
}) => {
  const tasksToDelegate = tasks.filter(t => t.status === 'pending_hr');
  const tasksToReview = tasks.filter(t => t.status === 'review_by_hr');

  const handleForwardToEmployee = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'assigned_to_worker' } : t));
    notify('success', "Документация по задаче направлена исполнителю.");
  };

  const handleForwardToManager = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
    notify('success', "Результаты задачи проверены. Менеджер уведомлен.");
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 rounded-[2.5rem] flex items-center gap-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><ShieldCheck size={120} /></div>
        <div className="p-5 bg-indigo-600 rounded-[1.5rem] text-white shadow-2xl shadow-indigo-200">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Центр верификации HR</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Проверка допусков и валидация рабочих процессов активна</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Delegation Lane */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-4">
            <UserCheck size={18} className="text-amber-500" /> Входящие делегирования
          </h3>
          <div className="space-y-4">
            {tasksToDelegate.map(task => {
              const worker = employees.find(e => e.id === task.assignedWorkerId);
              return (
                <div key={task.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-indigo-500 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="font-black text-slate-900 dark:text-white text-xl leading-tight">{task.title}</h4>
                    <span className="text-[10px] font-black font-mono text-indigo-500 uppercase tracking-tighter">REF: {task.id.slice(-6)}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-8 line-clamp-3 font-medium">{task.description}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800/50">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Получатель</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{worker ? `${worker.lastName} ${worker.firstName}` : 'Ошибка системы'}</p>
                    </div>
                    <button onClick={() => handleForwardToEmployee(task.id)} className="flex items-center gap-3 bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                      <Send size={14} /> Передать в работу
                    </button>
                  </div>
                </div>
              );
            })}
            {tasksToDelegate.length === 0 && (
              <div className="py-20 text-center opacity-20">
                <UserCheck size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Нет задач для делегирования</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Lane */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-4">
            <CheckCircle size={18} className="text-emerald-500" /> Проверка результатов
          </h3>
          <div className="space-y-4">
            {tasksToReview.map(task => {
              const worker = employees.find(e => e.id === task.assignedWorkerId);
              return (
                <div key={task.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border-l-8 border-l-emerald-500 border border-slate-100 dark:border-slate-800 shadow-md">
                  <h4 className="font-black text-slate-900 dark:text-white mb-2 text-lg">{task.title}</h4>
                  <p className="text-[10px] text-slate-400 mb-8 font-black uppercase tracking-widest">Отправил: {worker?.lastName} {worker?.firstName}</p>

                  {task.resultAttachment && (
                    <div className="mb-8 p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-emerald-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-32 md:w-auto">{task.resultAttachment.name}</p>
                          <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest">Отчёт исполнения</p>
                        </div>
                      </div>
                      <a href={task.resultAttachment.data} download={task.resultAttachment.name} className="p-3 bg-emerald-600 text-white rounded-xl hover:scale-110 transition-all">
                        <Download size={18} />
                      </a>
                    </div>
                  )}

                  <button onClick={() => handleForwardToManager(task.id)} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all">
                    Утвердить и уведомить менеджмент
                  </button>
                </div>
              );
            })}
            {tasksToReview.length === 0 && (
              <div className="py-20 text-center opacity-20">
                <CheckCircle size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Нет результатов на проверку</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
