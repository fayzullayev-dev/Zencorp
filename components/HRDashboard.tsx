
import React from 'react';
import { User, Employee, Task } from '../types';
import { ShieldCheck, UserCheck, Send, FileText, Download, CheckCircle } from 'lucide-react';

interface HRDashboardProps {
  currentUser: User;
  employees: Employee[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const HRDashboard: React.FC<HRDashboardProps> = ({
  currentUser, employees, tasks, setTasks
}) => {
  const tasksToDelegate = tasks.filter(t => t.status === 'pending_hr');
  const tasksToReview = tasks.filter(t => t.status === 'review_by_hr');

  const handleForwardToEmployee = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'assigned_to_worker' } : t));
    alert("Task documentation forwarded to the employee workspace.");
  };

  const handleForwardToManager = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
    alert("Task results verified. Notifying manager.");
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-slate-200 p-8 rounded-2xl flex items-center gap-6 shadow-sm">
        <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">HR Verification Hub</h2>
          <p className="text-slate-500">Security clearance and task validation active.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Delegation Lane */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
            <UserCheck size={18} className="text-amber-500" /> Incoming Delegations
          </h3>
          <div className="space-y-3">
            {tasksToDelegate.map(task => {
              const worker = employees.find(e => e.id === task.assignedWorkerId);
              return (
                <div key={task.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-slate-900 text-lg">{task.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Ref: {task.id.split('-')[1]}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-3">{task.description}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Recipient</p>
                      <p className="text-sm font-bold text-slate-800">{worker ? `${worker.firstName} ${worker.lastName}` : 'System Error'}</p>
                    </div>
                    <button onClick={() => handleForwardToEmployee(task.id)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                      <Send size={16} /> Release to Worker
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification Lane */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
            <CheckCircle size={18} className="text-emerald-500" /> Task Result Review
          </h3>
          <div className="space-y-3">
            {tasksToReview.map(task => {
              const worker = employees.find(e => e.id === task.assignedWorkerId);
              return (
                <div key={task.id} className="bg-white p-6 rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 shadow-md">
                  <h4 className="font-bold text-slate-900 mb-2">{task.title}</h4>
                  <p className="text-xs text-slate-500 mb-6 font-medium italic">Submitted by {worker?.firstName} {worker?.lastName}</p>
                  
                  {task.resultAttachment && (
                    <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText size={20} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{task.resultAttachment.name}</p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">Work Output Attached</p>
                        </div>
                      </div>
                      <a href={task.resultAttachment.data} download={task.resultAttachment.name} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                        <Download size={18} />
                      </a>
                    </div>
                  )}

                  <button onClick={() => handleForwardToManager(task.id)} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all">
                    Final Approve & Notify Manager
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
