
import React from 'react';
import { Task, User, FileAttachment, TaskStatus } from '../types';
import { FileText, Send, Clock, CheckCircle, Download, User as UserIcon, Calendar, Trash2 } from 'lucide-react';

interface TaskRegistryProps {
    tasks: Task[];
    currentUser: User;
    viewType: 'sent' | 'received' | 'pending' | 'send';
    isDarkMode: boolean;
    lang: string;
    onViewTask?: (task: Task) => void;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    notify: (type: 'success' | 'error' | 'info', message: string) => void;
    requestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const TaskRegistry: React.FC<TaskRegistryProps> = ({ tasks, currentUser, viewType, isDarkMode, lang, onViewTask, setTasks, notify, requestConfirm }) => {
    const filteredTasks = tasks.filter(t => {
        if (viewType === 'sent') return t.fromId === currentUser.id;
        if (viewType === 'received') return t.toId === currentUser.id;
        if (viewType === 'pending') return t.status === 'pending' || t.status === 'pending_hr';
        return true;
    });

    const handleDeleteTask = (task: Task) => {
        const confirmTitle = lang === 'ru' ? 'Удалить задачу?' : lang === 'en' ? 'Delete Task?' : 'Vazifani o\'chirish?';
        const confirmMessage = lang === 'ru'
            ? `Вы уверены, что хотите удалить задачу "${task.title}"? Это действие нельзя отменить.`
            : lang === 'en'
                ? `Are you sure you want to delete task "${task.title}"? This action cannot be undone.`
                : `"${task.title}" vazifasini o'chirishga ishonchingiz komilmi? Bu amalni bekor qilib bo'lmaydi.`;

        requestConfirm(confirmTitle, confirmMessage, async () => {
            try {
                const { api } = await import('../api');
                await api.deleteTask(task.id);
                setTasks(prev => prev.filter(t => t.id !== task.id));
                notify('success', lang === 'ru' ? 'Задача удалена' : lang === 'en' ? 'Task deleted' : 'Vazifa o\'chirildi');
            } catch (error) {
                notify('error', lang === 'ru' ? 'Ошибка удаления' : lang === 'en' ? 'Delete failed' : 'O\'chirishda xatolik');
            }
        });
    };

    const getStatusInfo = (status: TaskStatus) => {
        const labels: any = {
            ru: { completed: 'Завершено', in_progress: 'В работе', pending: 'Ожидает', pending_hr: 'На проверке HR', on_hold: 'В очереди' },
            en: { completed: 'Completed', in_progress: 'In Progress', pending: 'Pending', pending_hr: 'HR Review', on_hold: 'On Hold' },
            uz: { completed: 'Bajarildi', in_progress: 'Jarayonda', pending: 'Kutilmoqda', pending_hr: 'HR tekshiruvi', on_hold: 'Navbatda' }
        };
        const currentLabels = labels[lang] || labels.ru;

        switch (status) {
            case 'completed': return { label: currentLabels.completed, color: 'bg-emerald-500', icon: CheckCircle };
            case 'in_progress': return { label: currentLabels.in_progress, color: 'bg-amber-500', icon: Clock };
            case 'pending': return { label: currentLabels.pending, color: 'bg-indigo-500', icon: Clock };
            case 'pending_hr': return { label: currentLabels.pending_hr, color: 'bg-blue-500', icon: Send };
            case 'on_hold': return { label: currentLabels.on_hold, color: 'bg-slate-400', icon: Clock };
            default: return { label: status, color: 'bg-slate-400', icon: FileText };
        }
    };

    const cardClass = `p-6 rounded-[2rem] border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} hover:border-indigo-500 group shadow-sm`;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                    {viewType === 'sent' ? <Send size={28} /> : viewType === 'received' ? <Inbox size={28} /> : <Clock size={28} />}
                </div>
                <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">
                        {viewType === 'sent' ? (lang === 'ru' ? 'Отправленные' : lang === 'en' ? 'Sent' : 'Yuborilgan') :
                            viewType === 'received' ? (lang === 'ru' ? 'Полученные' : lang === 'en' ? 'Received' : 'Qabul qilingan') :
                                (lang === 'ru' ? 'Ожидаемые' : lang === 'en' ? 'Pending' : 'Kutilayotgan')}
                    </h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Всего объектов: {filteredTasks.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map(task => {
                    const status = getStatusInfo(task.status);
                    return (
                        <div key={task.id} className={cardClass}>
                            <div className="flex justify-between items-start mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase text-white shadow-lg ${status.color}`}>
                                    {status.label}
                                </span>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black font-mono text-indigo-500">#{task.id.slice(-6)}</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTask(task);
                                        }}
                                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                                        title={lang === 'ru' ? 'Удалить задачу' : lang === 'en' ? 'Delete task' : 'Vazifani o\'chirish'}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-black mb-2 group-hover:text-indigo-500 transition-colors leading-tight">{task.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium">{task.description}</p>

                            <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <UserIcon size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black uppercase text-slate-400">{lang === 'ru' ? 'Откуда' : lang === 'en' ? 'From' : 'Kimdan'}</span>
                                    </div>
                                    <span className="text-xs font-bold">{task.fromName || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <UserIcon size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black uppercase text-slate-400">{lang === 'ru' ? 'Кому' : lang === 'en' ? 'To' : 'Kimga'}</span>
                                    </div>
                                    <span className="text-xs font-bold">{task.toName || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black uppercase text-slate-400">{lang === 'ru' ? 'Дата и время' : lang === 'en' ? 'Date & Time' : 'Sana va vaqt'}</span>
                                    </div>
                                    <span className="text-xs font-bold">
                                        {new Date(task.createdAt).toLocaleDateString()} {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {task.attachment && (
                                <div className="mt-6 p-4 bg-indigo-50/50 dark:bg-slate-800 rounded-2xl flex items-center justify-between border border-indigo-100/50 dark:border-slate-700">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FileText size={16} className="text-indigo-500 shrink-0" />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">{task.attachment.name}</span>
                                    </div>
                                    <a href={task.attachment.data} download={task.attachment.name} className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm hover:scale-110 transition-all">
                                        <Download size={14} className="text-indigo-600" />
                                    </a>
                                </div>
                            )}
                        </div>
                    );
                })}
                {filteredTasks.length === 0 && (
                    <div className="col-span-full py-40 text-center flex flex-col items-center gap-6 opacity-30">
                        <FileText size={64} className="text-slate-300" />
                        <p className="font-black uppercase tracking-widest text-xs">Список задач пуст</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const Inbox = ({ size }: { size: number }) => <Send size={size} className="rotate-180" />;

export default TaskRegistry;
