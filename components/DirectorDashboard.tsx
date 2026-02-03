
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Catalog, Employee, Task, FileAttachment, AttendanceRecord, Suggestion } from '../types';
import {
  Plus, Edit2, Trash2, Send, Paperclip, Upload, X, Phone, Camera, Folder,
  Inbox, CheckCircle, FileText, Download, Users, TrendingUp, Clock, AlertCircle,
  MapPin, Hash, Shield, History, Eye, Search, ChevronRight, MessageSquare, Lightbulb,
  ClipboardCheck
} from 'lucide-react';

interface DirectorDashboardProps {
  catalogs: Catalog[];
  setCatalogs: React.Dispatch<React.SetStateAction<Catalog[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  attendance: AttendanceRecord[];
  t: any;
  isDarkMode: boolean;
  currentView: string;
  setCurrentView: (v: any) => void;
  ideas: Suggestion[];
  setIdeas: React.Dispatch<React.SetStateAction<Suggestion[]>>;
}

import { api } from '../api';

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  catalogs, setCatalogs, employees, setEmployees, tasks, setTasks,
  attendance, t, isDarkMode, currentView, setCurrentView, ideas, setIdeas
}) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', toId: '' });
  const [attachment, setAttachment] = useState<FileAttachment | undefined>();
  const [statsData, setStatsData] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cardClass = `p-8 rounded-[2.5rem] border shadow-sm transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`;
  const inputClass = `w-full px-5 py-4 rounded-2xl font-bold outline-none border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600 text-slate-900 text-sm'}`;

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'active'), [employees]);

  useEffect(() => {
    api.getActivityStats().then(dates => setStatsData(dates as string[])).catch(console.error);
  }, []);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date,
      count: statsData.filter(d => new Date(d).toISOString().split('T')[0] === date).length
    }));
  }, [statsData]);

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      // Ideally use api.updateTask
      api.updateTask(editingTask.id, { ...taskForm, attachment: attachment || editingTask.attachment, updatedAt: Date.now() })
        .then(() => {
          setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskForm, attachment: attachment || t.attachment, updatedAt: Date.now() } : t));
          setEditingTask(null);
        });
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskForm,
        fromId: 'dir-1',
        fromName: 'Director',
        status: 'pending',
        createdAt: Date.now(),
        attachment
      };
      api.addTask(newTask).then(() => {
        setTasks([...tasks, newTask]);
      });
    }
    setTaskForm({ title: '', description: '', toId: '' });
    setAttachment(undefined);
    setCurrentView('main');
  };

  const deleteIdea = async (id: string) => {
    if (confirm("Delete this suggestion from the log?")) {
      try {
        await api.deleteSuggestion(id);
        setIdeas(ideas.filter(i => i.id !== id));
      } catch (e) { console.error(e); }
    }
  };

  const replyIdea = async (idea: Suggestion) => {
    const text = prompt("Enter reply message to " + idea.authorName);
    if (text) {
      try {
        await api.replySuggestion(idea.id, text, 'dir-1');
        alert("Reply sent.");
      } catch (e) { alert("Failed to send reply"); }
    }
  };


  if (currentView === 'main') {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const onlineCount = activeEmployees.filter(e => e.isOnline).length;
    const lateCount = attendance.filter(a => a.isLate).length;

    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-black italic tracking-tighter">{t.home}</h2>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-bold`}>{new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={cardClass}><Users className="text-indigo-500 mb-4" /><p className="text-3xl font-black">{activeEmployees.length}</p><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.personnel}</p></div>
          <div className={cardClass}><CheckCircle className="text-emerald-500 mb-4" /><p className="text-3xl font-black">{completedTasks}/{totalTasks}</p><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Completed</p></div>
          <div className={cardClass}><Clock className="text-amber-500 mb-4" /><p className="text-3xl font-black">{onlineCount}</p><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">In Office</p></div>
          <div className={cardClass}><AlertCircle className="text-red-500 mb-4" /><p className="text-3xl font-black">{lateCount}</p><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Late Arrival</p></div>
        </div>

        {/* Received Task Reports Section */}
        <div className={cardClass}>
          <h3 className="text-xl font-black mb-8 italic underline decoration-indigo-500 underline-offset-8">Received Mission Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.filter(t => t.status === 'completed').length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-300 italic text-sm">No task reports submitted yet.</div>
            ) : tasks.filter(t => t.status === 'completed').reverse().map(task => {
              const worker = employees.find(e => e.id === task.toId);
              return (
                <div key={task.id} className="p-6 bg-slate-50/5 rounded-[2.5rem] border border-slate-100/10 hover:border-indigo-500/50 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <img src={worker?.photoUrl || 'https://picsum.photos/100/100'} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 shadow-lg" alt="" />
                      <div>
                        <p className="font-black text-sm">{worker?.lastName} {worker?.firstName}</p>
                        <p className="text-[8px] font-black uppercase text-indigo-500">{task.title}</p>
                      </div>
                    </div>
                    <ClipboardCheck className="text-emerald-500" size={20} />
                  </div>
                  <p className="text-xs text-slate-400 italic mb-6 line-clamp-3 whitespace-pre-wrap">{task.description}</p>
                  {task.resultAttachment && (
                    <div className="mt-auto p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-[10px] font-bold text-emerald-600 truncate">{task.resultAttachment.name}</span>
                      </div>
                      <a href={task.resultAttachment.data} download={task.resultAttachment.name} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                        <Download size={14} />
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black italic underline decoration-indigo-500 underline-offset-8">HQ Activity Chart</h3>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Tasks completed (last 7 days)</span>
          </div>
          <div className="h-64 flex items-end justify-between gap-4">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 bg-indigo-600/5 rounded-t-xl relative group">
                <div className="absolute bottom-0 w-full bg-indigo-600 rounded-t-xl transition-all duration-1000" style={{ height: `${(d.count / (Math.max(...chartData.map(x => x.count)) || 1)) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Ideas Block */}
        <div className={cardClass}>
          <h3 className="text-xl font-black mb-6 italic underline decoration-emerald-500 underline-offset-8">Staff Suggestions Hub</h3>
          <div className="max-h-80 overflow-y-auto pr-4 space-y-4 no-scrollbar">
            {ideas.length === 0 ? (
              <div className="py-16 text-center">
                <Lightbulb className="mx-auto text-slate-100 dark:text-slate-800 mb-4" size={48} />
                <p className="text-xs text-slate-400 italic">No field suggestions received yet.</p>
              </div>
            ) : ideas.map(idea => (
              <div key={idea.id} className="p-5 bg-slate-50/5 rounded-[2rem] border border-slate-100/5 flex items-start gap-4 group hover:border-emerald-500 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg"><MessageSquare size={18} /></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-bold">{idea.authorName}</p>
                      <p className="text-[8px] font-black uppercase text-slate-400">{new Date(idea.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => replyIdea(idea)} className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"><Send size={12} /></button>
                      <button onClick={() => deleteIdea(idea.id)} className="p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic mt-3 leading-relaxed border-l-2 border-emerald-500/20 pl-4">{idea.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'send_task') {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-500 pb-20">
        <div className={cardClass}>
          <div className="flex items-center gap-4 border-b border-slate-100/10 pb-8 mb-8">
            <Send className="text-indigo-600" size={32} />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">{editingTask ? 'Modify Directive' : t.sendTask}</h2>
          </div>
          <form className="space-y-6" onSubmit={handleTaskSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Mission Lead (Assignee)</label>
                <select required className={inputClass} value={taskForm.toId} onChange={e => setTaskForm({ ...taskForm, toId: e.target.value })}>
                  <option value="">Select Personnel...</option>
                  {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.lastName} {e.firstName} ({e.position})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Objective Header</label>
                <input required className={inputClass} placeholder="Mission Title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Operational Protocols (Description)</label>
              <textarea required className={`${inputClass} h-32 resize-none`} placeholder="Detailed directive details..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
            </div>
            <div className="flex gap-4">
              <div onClick={() => fileInputRef.current?.click()} className={`${inputClass} py-8 border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50/5 transition-colors`}>
                <Paperclip className="text-slate-400" />
                <span className="text-[8px] font-black uppercase">{attachment ? attachment.name : (editingTask?.attachment?.name || "Attach Data File")}</span>
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setAttachment({ name: f.name, type: f.type, size: f.size, data: ev.target?.result as string });
                    reader.readAsDataURL(f);
                  }
                }} />
              </div>
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                {editingTask ? 'Update Transmission' : 'Transmit Mission'}
              </button>
              {editingTask && <button onClick={() => { setEditingTask(null); setTaskForm({ title: '', description: '', toId: '' }); }} className="px-8 bg-slate-800 text-white rounded-3xl font-black uppercase text-[10px]">Cancel</button>}
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4"><History className="text-indigo-500" size={20} /><h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transmission Log</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.filter(t => t.fromId === 'dir-1').map(task => {
              const worker = employees.find(e => e.id === task.toId);
              return (
                <div key={task.id} className={`${cardClass} hover:border-indigo-500 group relative overflow-hidden`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-sm">{task.title}</h4>
                      <p className="text-[8px] font-black text-indigo-500 uppercase">To: {worker?.lastName || 'Unknown'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100/10 pt-4">
                    <span className="text-[8px] font-black text-slate-500">{new Date(task.createdAt).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setEditingTask(task);
                        setTaskForm({ title: task.title, description: task.description, toId: task.toId });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} className="text-indigo-500 hover:scale-125 transition-transform"><Edit2 size={14} /></button>
                      <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DirectorDashboard;
