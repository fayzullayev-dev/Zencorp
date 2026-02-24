
import React from 'react';
import { Task, User, Language } from '../types';
import { ChevronRight, Clock, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';

interface TaskWorkflowManagerProps {
    tasks: Task[];
    currentUser: User;
    isDarkMode: boolean;
    lang: Language;
}

const TaskWorkflowManager: React.FC<TaskWorkflowManagerProps> = ({ tasks, currentUser, isDarkMode, lang }) => {
    // Group tasks by their original parentTaskId or by the first task in the chain
    const chainTasks = tasks.filter(t => t.isChainTask || t.nextChainTaskId || t.parentTaskId);

    // Find unique chains by grouping tasks that belong to the same sequence
    const workflows: Task[][] = [];
    const processedTaskIds = new Set<string>();

    chainTasks.forEach(task => {
        if (processedTaskIds.has(task.id)) return;

        // Find the start of the chain (a task that has no parent/prev in chain)
        let firstTask = task;
        let visited = new Set<string>();
        while (firstTask.parentTaskId && !visited.has(firstTask.parentTaskId)) {
            const parent = chainTasks.find(t => t.id === firstTask.parentTaskId);
            if (!parent) break;
            firstTask = parent;
            visited.add(firstTask.id);
        }

        // Collect all tasks in this chain
        const currentChain: Task[] = [];
        let current: Task | undefined = firstTask;
        while (current && !processedTaskIds.has(current.id)) {
            currentChain.push(current);
            processedTaskIds.add(current.id);
            current = chainTasks.find(t => t.id === current?.nextChainTaskId);
        }

        if (currentChain.length > 0) {
            workflows.push(currentChain);
        }
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="text-emerald-500" size={16} />;
            case 'in_progress': return <PlayCircle className="text-amber-500 animate-pulse" size={16} />;
            case 'on_hold': return <Clock className="text-slate-300" size={16} />;
            default: return <AlertCircle className="text-indigo-500" size={16} />;
        }
    };

    const cardClass = `p-6 rounded-[2rem] border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Clock size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Мониторинг процессов</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Отслеживание цепочек делегирования</p>
                </div>
            </div>

            {workflows.length === 0 ? (
                <div className={`${cardClass} flex flex-col items-center justify-center py-20 opacity-30`}>
                    <Clock size={48} className="text-slate-400 mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">Активные цепочки не найдены</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {workflows.map((chain, idx) => (
                        <div key={idx} className={cardClass}>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-black text-sm uppercase text-indigo-500">{chain[0].title.replace(' (Этап 1)', '')}</h4>
                                <span className="text-[10px] font-bold text-slate-400">{new Date(chain[0].createdAt).toLocaleDateString()}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                {chain.map((step, sIdx) => (
                                    <React.Fragment key={step.id}>
                                        <div className={`flex items-center gap-3 p-3 rounded-2xl border ${step.status === 'completed' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/20' : step.status === 'in_progress' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/20' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}>
                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-black text-xs shadow-sm">
                                                {getStatusIcon(step.status)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-tight">{step.toName || 'Unknown'}</p>
                                                <p className={`text-[8px] font-bold uppercase ${step.status === 'completed' ? 'text-emerald-600' : step.status === 'on_hold' ? 'text-slate-400' : 'text-indigo-500'}`}>{step.status}</p>
                                            </div>
                                        </div>
                                        {sIdx < chain.length - 1 && (
                                            <ChevronRight size={16} className="text-slate-200" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TaskWorkflowManager;
