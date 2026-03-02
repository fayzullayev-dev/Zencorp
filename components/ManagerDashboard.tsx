
import React, { useState, useRef } from 'react';
import { User, Employee, Task, Department, FileAttachment } from '../types';
import { DEPARTMENTS, MOCK_HR_HEAD } from '../constants';
// Added Clock to the lucide-react imports
import { Plus, Edit2, Trash2, Send, Move, Check, FileText, Paperclip, Upload, Download, CheckCircle, Clock, Users } from 'lucide-react';

interface ManagerDashboardProps {
  currentUser: User;
  employees: Employee[];
  tasks: Task[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
  requestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  currentUser, employees, tasks, setEmployees, setTasks, notify, requestConfirm
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
    middleName: '',
    position: '',
    catalogId: '',
    departmentId: DEPARTMENTS[0].id,
    phoneNumber: '',
    residence: '',
    passportSerial: '',
    passportPIN: '',
    photoUrl: 'https://picsum.photos/300/400',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    workingHours: '09:00 - 18:00'
  });

  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    workerId: ''
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { notify('error', "Photo exceeds 30MB."); return; }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      if (Math.abs((img.width / img.height) - 0.75) > 0.1) { notify('error', "Please use 3x4 format."); return; }
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
    const employeeData: Employee = {
      id: editingEmployee?.id || `emp-${Date.now()}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName || '',
      position: formData.position,
      catalogId: formData.catalogId || 'cat-default',
      departmentId: formData.departmentId,
      phoneNumber: formData.phoneNumber,
      residence: formData.residence,
      passportSerial: formData.passportSerial,
      passportPIN: formData.passportPIN,
      photoUrl: formData.photoUrl,
      workingDays: formData.workingDays,
      workingHours: formData.workingHours,
      status: editingEmployee?.status || 'active',
      isOnline: editingEmployee?.isOnline || false
    };

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? employeeData : emp));
    } else {
      setEmployees(prev => [...prev, employeeData]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingEmployee(null);
    setFormData({
      firstName: '', lastName: '', middleName: '', position: '', catalogId: '',
      departmentId: DEPARTMENTS[0].id, phoneNumber: '', residence: '',
      passportSerial: '', passportPIN: '', photoUrl: 'https://picsum.photos/300/400',
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], workingHours: '09:00 - 18:00'
    });
  };

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskData.workerId) return;
    setTasks(prev => [...prev, {
      id: `task-${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      fromId: currentUser.id,
      fromName: currentUser.fullName,
      toId: taskData.workerId,
      fromManagerId: currentUser.id,
      assignedWorkerId: taskData.workerId,
      hrReviewerId: MOCK_HR_HEAD.id,
      status: 'pending_hr',
      createdAt: Date.now(),
      attachment: attachment
    }]);
    setTaskData({ title: '', description: '', workerId: '' });
    setAttachment(undefined);
    notify('success', 'Task sent to HR for verification.');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Users size={80} /></div>
          <p className="text-xs font-black uppercase tracking-[0.3em] mb-2 opacity-80">Общий штат</p>
          <p className="text-5xl font-black">{employees.length}</p>
          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-4 py-2 rounded-full">
            <CheckCircle size={12} /> Активные единицы
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Send size={80} /></div>
          <p className="text-xs font-black uppercase tracking-[0.3em] mb-2 opacity-80">Активные задачи</p>
          <p className="text-5xl font-black">{tasks.filter(t => t.status !== 'completed').length}</p>
          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-4 py-2 rounded-full">
            <Clock size={12} /> Требуют внимания
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
          <h3 className="text-xl font-black mb-4">Быстрые действия</h3>
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Используйте боковое меню для управления персоналом и отправки задач.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-4">
            <Users size={28} className="text-indigo-600" />
            Обзор персонала
          </h2>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
              <tr><th className="px-10 py-6">Сотрудник</th><th className="px-10 py-6">Должность</th><th className="px-10 py-6 text-right">Статус</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employees.slice(0, 5).map(emp => (
                <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-5 flex items-center gap-6">
                    <img src={emp.photoUrl} className="w-12 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                    <div><p className="font-black text-slate-900">{emp.lastName} {emp.firstName}</p><p className="text-[10px] font-bold text-indigo-500 uppercase">{emp.id.slice(-6)}</p></div>
                  </td>
                  <td className="px-10 py-5">
                    <p className="text-sm font-bold text-slate-800">{emp.position}</p>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase text-white ${emp.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      {emp.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length > 5 && (
            <div className="p-6 text-center border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">И еще {employees.length - 5} сотрудников в основном списке</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
