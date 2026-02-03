
import React, { useState, useRef } from 'react';
import { User, Employee, Task, Department, FileAttachment } from '../types';
import { DEPARTMENTS, MOCK_HR_HEAD } from '../constants';
// Added Clock to the lucide-react imports
import { Plus, Edit2, Trash2, Send, Move, Check, FileText, Paperclip, Upload, Download, CheckCircle, Clock } from 'lucide-react';

interface ManagerDashboardProps {
  currentUser: User;
  employees: Employee[];
  tasks: Task[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  currentUser, employees, tasks, setEmployees, setTasks 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [transferringEmployee, setTransferringEmployee] = useState<Employee | null>(null);
  const [attachment, setAttachment] = useState<FileAttachment | undefined>();
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    position: '',
    departmentId: DEPARTMENTS[0].id,
    phoneNumber: '',
    residence: '',
    passportData: '',
    photoUrl: 'https://picsum.photos/300/400',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    hours: '09:00 - 18:00'
  });

  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    workerId: ''
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { alert("Photo exceeds 30MB."); return; }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      if (Math.abs((img.width/img.height) - 0.75) > 0.1) { alert("Please use 3x4 format."); return; }
      setFormData({ ...formData, photoUrl: img.src });
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAttachment({ name: file.name, type: file.type, size: file.size, data: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleAddOrEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? { ...emp, ...formData } : emp));
    } else {
      setEmployees(prev => [...prev, { id: `emp-${Date.now()}`, ...formData, status: 'active', schedule: { days: formData.days, hours: formData.hours } }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingEmployee(null);
    setFormData({ firstName: '', lastName: '', position: '', departmentId: DEPARTMENTS[0].id, phoneNumber: '', residence: '', passportData: '', photoUrl: 'https://picsum.photos/300/400', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hours: '09:00 - 18:00' });
  };

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskData.workerId) return;
    setTasks(prev => [...prev, { id: `task-${Date.now()}`, title: taskData.title, description: taskData.description, fromManagerId: currentUser.id, assignedWorkerId: taskData.workerId, hrReviewerId: MOCK_HR_HEAD.id, status: 'pending_hr', createdAt: Date.now(), attachment: attachment }]);
    setTaskData({ title: '', description: '', workerId: '' });
    setAttachment(undefined);
    alert('Task sent to HR for verification.');
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Workforce</p>
          <p className="text-3xl font-bold text-slate-900">{employees.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Active Projects</p>
          <p className="text-3xl font-bold text-indigo-600">{tasks.filter(t => t.status !== 'completed').length}</p>
        </div>
        <button onClick={() => { resetForm(); setShowAddForm(true); }} className="bg-indigo-600 text-white font-bold p-6 rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
          <Plus size={24} /> Register New Employee
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Personnel & Departments</h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <tr><th className="px-6 py-4">Employee</th><th className="px-6 py-4">Position</th><th className="px-6 py-4 text-right">Control</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      <img src={emp.photoUrl} className="w-12 h-16 rounded object-cover border border-slate-100" />
                      <div><p className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-400">{emp.phoneNumber}</p></div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{emp.position}</p>
                      <p className="text-xs text-slate-500">{DEPARTMENTS.find(d => d.id === emp.departmentId)?.name}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingEmployee(emp); setFormData({ ...emp, ...emp.schedule }); setShowAddForm(true); }} className="p-2 hover:bg-white rounded text-indigo-600 shadow-sm border border-transparent hover:border-slate-100"><Edit2 size={16}/></button>
                        <button onClick={() => setTransferringEmployee(emp)} className="p-2 hover:bg-white rounded text-emerald-600 shadow-sm border border-transparent hover:border-slate-100"><Move size={16}/></button>
                        <button onClick={() => { if(confirm("Remove worker?")) setEmployees(prev => prev.filter(e => e.id !== emp.id)); }} className="p-2 hover:bg-white rounded text-red-600 shadow-sm border border-transparent hover:border-slate-100"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold text-slate-800 pt-4">Recent Task Outcomes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.filter(t => t.status === 'review_by_hr' || t.status === 'completed').map(task => (
              <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900">{task.title}</h4>
                    {task.status === 'completed' ? <CheckCircle className="text-emerald-500" size={16}/> : <Clock className="text-amber-500" size={16}/>}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{task.status === 'completed' ? 'Verified by HR' : 'Awaiting Final HR Approval'}</p>
                </div>
                {task.resultAttachment && (
                  <div className="p-3 bg-emerald-50 rounded-lg flex items-center justify-between border border-emerald-100">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={16} className="text-emerald-600 shrink-0"/>
                      <span className="text-xs font-bold text-emerald-700 truncate">{task.resultAttachment.name}</span>
                    </div>
                    <a href={task.resultAttachment.data} download={task.resultAttachment.name} className="text-emerald-700 hover:text-emerald-900"><Download size={16}/></a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Direct New Task</h2>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Task Title</label>
                <input type="text" required value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Project Name" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Description</label>
                <textarea required value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32" placeholder="Task details for the worker..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Attached Document</label>
                <div onClick={() => fileInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-slate-100 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors">
                  <Paperclip size={20} className="text-slate-300"/>
                  <span className="text-xs text-slate-500 font-medium">{attachment ? attachment.name : "Select Reference File"}</span>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Worker Selection</label>
                <select required value={taskData.workerId} onChange={e => setTaskData({...taskData, workerId: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Choose Personnel...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                <Send size={18}/> Assign via HR Head
              </button>
            </form>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Employee Profile Entry</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddOrEditEmployee} className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex flex-col items-center mb-4">
                <div onClick={() => photoInputRef.current?.click()} className="w-24 h-32 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-white overflow-hidden group">
                  {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover"/> : <Upload className="text-slate-300 group-hover:text-indigo-400 transition-colors" size={24}/>}
                </div>
                <p className="text-[10px] font-bold uppercase text-slate-400 mt-2 tracking-widest">Photo 3x4 Required</p>
                <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload}/>
              </div>
              {['firstName', 'lastName', 'position', 'phoneNumber'].map(f => (
                <div key={f}>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{f.replace(/([A-Z])/g, ' $1')}</label>
                  <input type="text" required value={(formData as any)[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Residence Address</label>
                <input type="text" required value={formData.residence} onChange={e => setFormData({...formData, residence: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Passport Documentation</label>
                <input type="text" required value={formData.passportData} onChange={e => setFormData({...formData, passportData: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-50">
                <button type="button" onClick={resetForm} className="px-6 py-2 text-slate-500 font-bold">Discard</button>
                <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-lg">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
