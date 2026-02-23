
import React, { useState, useRef } from 'react';
import { User, Employee, Task, FileAttachment, Catalog } from '../types';
import { Send, Paperclip, Users, FileText, ChevronRight, X, Plus, Building2, ChevronDown } from 'lucide-react';
import { api } from '../api';
import { MOCK_HR_HEAD } from '../constants';

interface TaskSenderProps {
    currentUser: User;
    employees: Employee[];
    catalogs: Catalog[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    notify: (type: 'success' | 'error' | 'info', message: string) => void;
    isDarkMode: boolean;
    lang: string;
}

const TaskSender: React.FC<TaskSenderProps> = ({ currentUser, employees, catalogs, setTasks, notify, isDarkMode, lang }) => {
    const [taskData, setTaskData] = useState({ title: '', description: '' });
    const [chainSteps, setChainSteps] = useState<{ id: string; departmentId: string; workerId: string }[]>([
        { id: `step-${Date.now()}`, departmentId: '', workerId: '' }
    ]);
    const [attachment, setAttachment] = useState<FileAttachment | undefined>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addStep = () => setChainSteps([...chainSteps, { id: `step-${Date.now()}`, departmentId: '', workerId: '' }]);
    const removeStep = (id: string) => setChainSteps(chainSteps.filter(s => s.id !== id));

    const updateStepDept = (id: string, departmentId: string) =>
        setChainSteps(chainSteps.map(s => s.id === id ? { ...s, departmentId, workerId: '' } : s));

    const updateStepWorker = (id: string, workerId: string) =>
        setChainSteps(chainSteps.map(s => s.id === id ? { ...s, workerId } : s));

    // Build hierarchical catalog list: parent + children indented
    const getOrderedCatalogs = () => {
        const parents = catalogs.filter(c => !c.parentId);
        const result: { cat: Catalog; depth: number }[] = [];
        const addWithChildren = (cat: Catalog, depth: number) => {
            result.push({ cat, depth });
            catalogs.filter(c => c.parentId === cat.id).forEach(child => addWithChildren(child, depth + 1));
        };
        parents.forEach(p => addWithChildren(p, 0));
        // Add orphaned sub-departments not matching any parent
        catalogs.filter(c => c.parentId && !catalogs.find(p => p.id === c.parentId))
            .forEach(c => result.push({ cat: c, depth: 0 }));
        return result;
    };

    const orderedCatalogs = getOrderedCatalogs();

    const getEmployeesForDept = (departmentId: string) => {
        if (!departmentId) return [];
        // Include employees from this department and all sub-departments
        const subDepIds = [departmentId, ...catalogs.filter(c => c.parentId === departmentId).map(c => c.id)];
        return employees.filter(e => e.status !== 'archived' && subDepIds.includes(e.catalogId || ''));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setAttachment({ name: file.name, type: file.type, size: file.size, data: ev.target?.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleSendTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (chainSteps.some(s => !s.workerId)) {
            notify('error', lang === 'ru' ? "Выберите исполнителей для всех этапов" : lang === 'en' ? "Select workers for all steps" : "Barcha bosqichlar uchun ijrochilarni tanlang");
            return;
        }

        const taskIds = chainSteps.map((_, i) => `task-${Date.now()}-${i}`);
        const createdTasks: Task[] = [];

        for (let i = 0; i < chainSteps.length; i++) {
            const step = chainSteps[i];
            const targetEmployee = employees.find(emp => emp.id === step.workerId);

            const newTask: Task = {
                id: taskIds[i],
                title: chainSteps.length > 1
                    ? (lang === 'ru' ? `${taskData.title} (Этап ${i + 1})` : lang === 'en' ? `${taskData.title} (Step ${i + 1})` : `${taskData.title} (${i + 1}-bosqich)`)
                    : taskData.title,
                description: taskData.description,
                fromId: currentUser.id,
                fromName: currentUser.fullName || 'Unknown',
                toId: step.workerId,
                toName: targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}` : 'Unknown Employee',
                fromManagerId: currentUser.id,
                assignedWorkerId: step.workerId,
                hrReviewerId: MOCK_HR_HEAD.id,
                status: i === 0 ? 'pending_hr' : 'on_hold',
                createdAt: Date.now(),
                attachment: i === 0 ? attachment : undefined,
                isChainTask: chainSteps.length > 1,
                chainStep: i + 1,
                nextChainTaskId: taskIds[i + 1] || undefined,
                parentTaskId: chainSteps.length > 1 ? taskIds[0] : undefined
            };

            await api.addTask(newTask);
            createdTasks.push(newTask);
        }

        setTasks(prev => [...prev, ...createdTasks]);
        notify('success', lang === 'ru' ? "Задача успешно отправлена" : lang === 'en' ? "Task successfully sent" : "Vazifa muvaffaqiyatli yuborildi");
        setTaskData({ title: '', description: '' });
        setChainSteps([{ id: `step-${Date.now()}`, departmentId: '', workerId: '' }]);
        setAttachment(undefined);
    };

    const cardClass = `p-8 rounded-[2.5rem] border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`;
    const inputClass = `w-full px-5 py-4 rounded-2xl font-bold outline-none border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-600'}`;

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                    <Send size={28} />
                </div>
                <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">
                        {lang === 'ru' ? 'Новая директива' : lang === 'en' ? 'New Directive' : 'Yangi ko\'rsatma'}
                    </h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                        {lang === 'ru' ? 'Отправка задачи через HR-контроль' : lang === 'en' ? 'Task Submission via HR Control' : 'HR nazorati orqali vazifa yuborish'}
                    </p>
                </div>
            </div>

            <div className={cardClass}>
                <form onSubmit={handleSendTask} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Task Info */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest block">
                                {lang === 'ru' ? 'Информация о задаче' : lang === 'en' ? 'Task Information' : 'Vazifa ma\'lumotlari'}
                            </label>
                            <input
                                type="text" required value={taskData.title}
                                onChange={e => setTaskData({ ...taskData, title: e.target.value })}
                                className={inputClass}
                                placeholder={lang === 'ru' ? "Заголовок задачи..." : lang === 'en' ? "Task Title..." : "Vazifa sarlavhasi..."}
                            />
                            <textarea
                                required value={taskData.description}
                                onChange={e => setTaskData({ ...taskData, description: e.target.value })}
                                className={`${inputClass} h-48 resize-none`}
                                placeholder={lang === 'ru' ? "Подробное описание..." : lang === 'en' ? "Detailed Description..." : "Batafsil tavsif..."}
                            />
                        </div>

                        {/* Right: Workflow */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest block">
                                {lang === 'ru' ? 'Цепочка исполнения (Workflow)' : lang === 'en' ? 'Execution Chain (Workflow)' : 'Ijro zanjiri'}
                            </label>

                            <div className="space-y-4">
                                {chainSteps.map((step, index) => (
                                    <div key={step.id} className={`space-y-3 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">
                                                {lang === 'ru' ? `Этап ${index + 1}` : lang === 'en' ? `Step ${index + 1}` : `${index + 1}-bosqich`}
                                            </span>
                                            {chainSteps.length > 1 && (
                                                <button type="button" onClick={() => removeStep(step.id)} className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Department select */}
                                        <div className="relative">
                                            <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <select
                                                value={step.departmentId}
                                                onChange={e => updateStepDept(step.id, e.target.value)}
                                                className={`${inputClass} pl-10 appearance-none cursor-pointer`}
                                            >
                                                <option value="">
                                                    {lang === 'ru' ? 'Выберите отдел...' : lang === 'en' ? 'Select Department...' : 'Bo\'lim tanlang...'}
                                                </option>
                                                {orderedCatalogs.map(({ cat, depth }) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {depth > 0 ? '  └ ' : ''}{cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                        </div>

                                        {/* Employee select (filtered by department) */}
                                        {step.departmentId && (
                                            <div className="relative">
                                                <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <select
                                                    required
                                                    value={step.workerId}
                                                    onChange={e => updateStepWorker(step.id, e.target.value)}
                                                    className={`${inputClass} pl-10 appearance-none cursor-pointer`}
                                                >
                                                    <option value="">
                                                        {lang === 'ru' ? 'Выберите сотрудника...' : lang === 'en' ? 'Select Employee...' : 'Xodim tanlang...'}
                                                    </option>
                                                    {getEmployeesForDept(step.departmentId).map(e => (
                                                        <option key={e.id} value={e.id}>
                                                            {e.firstName} {e.lastName} ({e.position})
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                            </div>
                                        )}
                                        {step.departmentId && getEmployeesForDept(step.departmentId).length === 0 && (
                                            <p className="text-[10px] text-amber-500 font-bold px-2">
                                                {lang === 'ru' ? 'Нет сотрудников в этом отделе' : lang === 'en' ? 'No employees in this department' : 'Bu bo\'limda xodimlar yo\'q'}
                                            </p>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addStep}
                                    className="w-full py-4 border-2 border-dashed border-indigo-100 dark:border-indigo-900/50 text-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> {lang === 'ru' ? 'Добавить следующий этап' : lang === 'en' ? 'Add Next Step' : 'Keyingi bosqichni qo\'shish'}
                                </button>
                            </div>

                            {/* File attachment */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full py-10 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                    <Paperclip size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400 block">
                                    {attachment ? attachment.name : (lang === 'ru' ? "Прикрепить документ" : lang === 'en' ? "Attach Document" : "Hujjat ilova qilish")}
                                </span>
                                <span className="text-[8px] text-slate-300 font-bold uppercase">PDF, DOC, XLS (MAX 50MB)</span>
                                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-50 dark:border-slate-800/50 flex justify-end">
                        <button
                            type="submit"
                            className="px-12 py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-4"
                        >
                            <div className="w-8 h-8 bg-indigo-500 dark:bg-white/20 rounded-full flex items-center justify-center">
                                <Send size={14} />
                            </div>
                            {lang === 'ru' ? 'Отправить на проверку' : lang === 'en' ? 'Send for Review' : 'Tekshiruvga yuborish'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskSender;
