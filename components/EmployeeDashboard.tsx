import React, { useState, useRef, useMemo } from 'react';
import { User, Task, AttendanceRecord, Employee, Language, FileAttachment, Suggestion, TaskStatus } from '../types';
import {
  Camera, Clock3, Send, X, CheckCircle,
  Upload, Download, LayoutGrid, Award, BookOpen, Lightbulb, LogOut,
  Clock, Package, RefreshCw, FileText, ClipboardCheck, Plus, Workflow
} from 'lucide-react';
import { api } from '../api';

interface EmployeeDashboardProps {
  currentUser: User;
  employees: Employee[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  t: any;
  lang: Language;
  isDarkMode: boolean;
  ideas: Suggestion[];
  setIdeas: React.Dispatch<React.SetStateAction<Suggestion[]>>;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser, employees, tasks, setTasks, attendance, setAttendance, t, lang, isDarkMode, ideas, setIdeas, notify
}) => {
  const [readingTask, setReadingTask] = useState<Task | null>(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [ideaText, setIdeaText] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [pendingTaskToComplete, setPendingTaskToComplete] = useState<Task | null>(null);
  const [reportComment, setReportComment] = useState('');
  const [reportFile, setReportFile] = useState<FileAttachment | undefined>();
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const [isFaceIDActive, setIsFaceIDActive] = useState(false);
  const [newSubTaskTexts, setNewSubTaskTexts] = useState<{ [taskId: string]: string }>({});
  const videoRef = useRef<HTMLVideoElement>(null);

  const myTasks = tasks.filter(t => t.toId === currentUser.id);
  const myEmpData = employees.find(e => e.id === currentUser.id);
  const today = new Date().toISOString().split('T')[0];

  const activeRecord = useMemo(() => {
    return attendance.slice().reverse().find(a => a.employeeId === currentUser.id && a.date === today && !a.clockOut);
  }, [attendance, currentUser.id, today]);

  const columns: { title: string, status: TaskStatus[], key: TaskStatus, color: string, icon: any }[] = [
    { title: lang === 'ru' ? "Новые" : lang === 'en' ? "New" : "Yangi", status: ['pending', 'assigned_to_worker'], key: 'pending', color: 'indigo', icon: Package },
    { title: lang === 'ru' ? "В процессе" : lang === 'en' ? "In Progress" : "Jarayonda", status: ['in_progress'], key: 'in_progress', color: 'amber', icon: Clock3 },
    { title: lang === 'ru' ? "На проверке" : lang === 'en' ? "In Review" : "Tekshiruvda", status: ['in_review', 'pending_hr', 'review_by_hr'], key: 'in_review', color: 'blue', icon: Send },
    { title: lang === 'ru' ? "Выполнено" : lang === 'en' ? "Completed" : "Bajarildi", status: ['completed'], key: 'completed', color: 'emerald', icon: CheckCircle }
  ];

  const [faceIDPurpose, setFaceIDPurpose] = useState<'start' | 'finish' | null>(null);
  const [faceIDStatus, setFaceIDStatus] = useState<'idle' | 'scanning' | 'recognized' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

  const loadModels = async () => {
    if (modelsLoaded) return;
    setFaceIDStatus('scanning');
    setVerificationMessage(lang === 'ru' ? 'Загрузка биометрии...' : 'Loading biometrics...');
    try {
      const faceapi = await import('face-api.js');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      setFaceIDStatus('idle');
    } catch (e) {
      setFaceIDStatus('error');
      setVerificationMessage(lang === 'ru' ? 'Ошибка загрузки моделей' : 'Model load failed');
    }
  };

  const startFaceID = async (purpose: 'start' | 'finish') => {
    setIsFaceIDActive(true);
    setFaceIDPurpose(purpose);
    setFaceIDStatus('idle');
    setVerificationMessage(lang === 'ru' ? 'Посмотрите в камеру' : 'Look at the camera');
    await loadModels();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      notify('error', lang === 'ru' ? "Ошибка камеры" : "Camera Error");
      setIsFaceIDActive(false);
    }
  };

  const processFaceVerify = async () => {
    if (!videoRef.current || !myEmpData?.photoUrl) return;
    setFaceIDStatus('scanning');
    const faceapi = await import('face-api.js');
    try {
      const refImg = await faceapi.fetchImage(myEmpData.photoUrl);
      const refDetection = await faceapi.detectSingleFace(refImg, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

      if (refDetection && detection) {
        const distance = faceapi.euclideanDistance(refDetection.descriptor, detection.descriptor);
        if (distance <= 0.56) {
          setFaceIDStatus('recognized');
          setVerificationMessage(lang === 'ru' ? 'ЛИЧНОСТЬ ПОДТВЕРЖДЕНА' : 'IDENTITY VERIFIED');
          setTimeout(() => {
            if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            setIsFaceIDActive(false);
            if (faceIDPurpose === 'start') finalizeStartWork();
            else finalizeFinishWork();
          }, 1500);
          return;
        }
      }
      setFaceIDStatus('error');
      setVerificationMessage(lang === 'ru' ? 'СООТВЕТСТВИЕ НЕ НАЙДЕНО' : 'NO MATCH FOUND');
    } catch (e) {
      setFaceIDStatus('error');
    }
  };

  const finalizeStartWork = () => {
    const now = Date.now();
    const newRecord: AttendanceRecord = {
      id: `att-${now}`, employeeId: currentUser.id, employeeName: currentUser.fullName,
      position: myEmpData?.position || 'Employee', date: today, clockIn: now, method: 'face_id'
    };
    api.recordAttendance(newRecord).then(() => {
      setAttendance(prev => [...prev, newRecord]);
      notify('success', lang === 'ru' ? "Смена открыта. Задачи доступны." : "Shift started. Tasks are now available.");
    });
  };

  const finalizeFinishWork = () => {
    if (!activeRecord) return;
    const now = Date.now();
    api.finishWork(activeRecord.employeeId, activeRecord.date, now).then(() => {
      setAttendance(prev => prev.map(a => a.id === activeRecord.id ? { ...a, clockOut: now } : a));
      notify('success', lang === 'ru' ? "Смена завершена" : "Shift finished");
    });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData('taskId', taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (targetStatus === 'completed') {
      if (task.subTasks?.some(st => !st.completed)) {
        notify('error', lang === 'ru' ? "Завершите все подзадачи!" : "Complete all sub-tasks first!");
        return;
      }
      setPendingTaskToComplete(task);
      setShowReportModal(true);
    } else {
      api.updateTask(taskId, { status: targetStatus, updatedAt: Date.now() }).then(() => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus, updatedAt: Date.now() } : t));
      });
    }
  };

  const handleAddSubTask = (taskId: string) => {
    const text = newSubTaskTexts[taskId];
    if (!text?.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubTasks = [...(task.subTasks || []), { id: `st-${Date.now()}`, title: text, completed: false }];
    api.updateTask(taskId, { subTasks: updatedSubTasks }).then(() => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subTasks: updatedSubTasks } : t));
      setNewSubTaskTexts(prev => ({ ...prev, [taskId]: '' }));
    });
  };

  const toggleSubTask = (taskId: string, stId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubTasks = task.subTasks?.map(st => st.id === stId ? { ...st, completed: !st.completed } : st);
    api.updateTask(taskId, { subTasks: updatedSubTasks }).then(() => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subTasks: updatedSubTasks } : t));
    });
  };

  const deleteSubTask = (taskId: string, stId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubTasks = task.subTasks?.filter(st => st.id !== stId);
    api.updateTask(taskId, { subTasks: updatedSubTasks }).then(() => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subTasks: updatedSubTasks } : t));
    });
  };

  const submitTaskReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTaskToComplete) return;
    const updates = { status: 'completed' as TaskStatus, updatedAt: Date.now(), resultAttachment: reportFile };
    api.updateTask(pendingTaskToComplete.id, updates).then(() => {
      setTasks(prev => prev.map(t => t.id === pendingTaskToComplete.id ? { ...t, ...updates } : t));
      setShowReportModal(false);
      setPendingTaskToComplete(null);
      setReportComment('');
      setReportFile(undefined);
      notify('success', lang === 'ru' ? "Отчет отправлен" : "Report sent");
    });
  };

  const handleReportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReportFile({ name: file.name, type: file.type, size: file.size, data: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const cardStyle = `p-8 rounded-[2.5rem] border shadow-sm transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24 no-scrollbar">
      {/* Face ID Overlay */}
      {isFaceIDActive && (
        <div className="fixed inset-0 z-[3000] bg-black/95 flex flex-col items-center justify-center p-10">
          <div className={`relative w-80 h-80 rounded-full border-4 ${faceIDStatus === 'recognized' ? 'border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.5)]' : faceIDStatus === 'error' ? 'border-red-500 shadow-[0_0_100px_rgba(239,68,68,0.5)]' : 'border-indigo-500 shadow-[0_0_100px_rgba(79,70,229,0.5)]'} overflow-hidden mb-10 transition-all duration-500`}>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
          </div>
          <p className={`font-black uppercase tracking-[0.4em] text-sm mb-10 ${faceIDStatus === 'recognized' ? 'text-emerald-500' : faceIDStatus === 'error' ? 'text-red-500' : 'text-white'}`}>
            {verificationMessage}
          </p>
          {faceIDStatus !== 'recognized' && (
            <button onClick={processFaceVerify} disabled={faceIDStatus === 'scanning'} className="px-12 py-5 bg-white text-indigo-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-2xl disabled:opacity-50">
              {faceIDStatus === 'scanning' ? (lang === 'ru' ? 'Обработка...' : 'Processing...') : (lang === 'ru' ? 'Подтвердить личность' : 'Verify Identity')}
            </button>
          )}
          <button onClick={() => {
            if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            setIsFaceIDActive(false);
          }} className="mt-8 text-slate-500 font-bold uppercase text-[10px]">{lang === 'ru' ? 'Отмена' : 'Cancel'}</button>
        </div>
      )}

      {/* Header Info Card */}
      <div className={`${cardStyle} flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-transparent`}>
        <div className="flex items-center gap-8">
          <div className="relative">
            <img src={myEmpData?.photoUrl || 'https://picsum.photos/300/400'} className="w-24 h-32 rounded-[2rem] object-cover border-4 border-white shadow-2xl" />
            <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white ${activeRecord ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight">{currentUser.fullName}</h2>
            <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">{myEmpData?.position}</p>
          </div>
        </div>
        <div>
          {activeRecord ? (
            <button onClick={() => startFaceID('finish')} className="bg-red-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-red-700 transition-colors">
              <LogOut size={16} /> {lang === 'ru' ? 'Завершить работу' : 'Finish Work'}
            </button>
          ) : (
            <button onClick={() => startFaceID('start')} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors">
              <Clock size={16} /> {lang === 'ru' ? 'Начать работу' : 'Start Work'}
            </button>
          )}
        </div>
      </div>

      {/* Task Board */}
      {activeRecord ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-5 duration-700">
          {columns.map(col => (
            <div key={col.key} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.key)} className="space-y-6">
              <div className="flex items-center gap-3 px-5">
                <col.icon size={16} className={`text-${col.color}-500`} />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{col.title}</h4>
              </div>
              <div className={`space-y-4 min-h-[500px] p-4 rounded-[2.5rem] transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-slate-100/50 hover:bg-slate-100'}`}>
                {myTasks.filter(t => col.status.includes(t.status)).map(task => (
                  <div key={task.id} draggable={task.status !== 'completed'} onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => setReadingTask(task)} className={`${cardStyle} p-6 cursor-grab active:cursor-grabbing hover:border-indigo-500 group relative border-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <h5 className="font-black text-sm mb-4 group-hover:text-indigo-500 transition-colors">{task.title}</h5>

                    {task.status !== 'completed' && (
                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-4 mb-4" onClick={e => e.stopPropagation()}>
                        {task.subTasks?.map(st => (
                          <div key={st.id} className="flex items-center gap-2">
                            <button onClick={() => toggleSubTask(task.id, st.id)} className={`w-3 h-3 rounded border flex items-center justify-center ${st.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                              {st.completed && <CheckCircle size={8} className="text-white" />}
                            </button>
                            <span className={`text-[10px] font-bold ${st.completed ? 'text-slate-400 line-through' : ''}`}>{st.title}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 mt-2">
                          <input type="text" placeholder="..." value={newSubTaskTexts[task.id] || ''} onChange={e => setNewSubTaskTexts(prev => ({ ...prev, [task.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleAddSubTask(task.id)} className="flex-1 bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 py-1 text-[10px]" />
                        </div>
                      </div>
                    )}

                    {task.attachment && (
                      <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-slate-700/50 rounded-xl border border-indigo-100 dark:border-slate-600 flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText size={14} className="text-indigo-500 shrink-0" />
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-300 truncate">{task.attachment.name}</span>
                        </div>
                        <a href={task.attachment.data} download={task.attachment.name} className="p-1 hover:bg-indigo-100 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                          <Download size={14} className="text-indigo-600" />
                        </a>
                      </div>
                    )}

                    {task.resultAttachment && (
                      <div className="mt-2 p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <ClipboardCheck size={14} className="text-emerald-500 shrink-0" />
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 truncate">Отчет: {task.resultAttachment.name}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase mt-4">
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                      {task.isChainTask && <Workflow size={10} className="text-indigo-500" />}
                    </div>
                  </div>
                ))}
                {myTasks.filter(t => col.status.includes(t.status)).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 opacity-20">
                    <LayoutGrid size={32} className="text-slate-400 mb-2" />
                    <p className="text-[10px] font-black text-slate-300 uppercase">{lang === 'ru' ? 'Список пуст' : 'List is Empty'}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${cardStyle} flex flex-col items-center justify-center py-40 border-dashed opacity-50`}>
          <Clock size={64} className="text-indigo-500 mb-6 animate-pulse" />
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
            {lang === 'ru' ? 'Список задач скрыт' : lang === 'en' ? 'Tasks Hidden' : 'Vazifalar yashirilgan'}
          </h3>
          <p className="text-slate-400 font-bold text-sm text-center max-w-md">
            {lang === 'ru' ? 'Пожалуйста, подтвердите личность, чтобы увидеть задачи.' : lang === 'en' ? 'Please verify identity to see tasks.' : 'Vazifalarni ko\'rish uchun shaxsni tasdiqlang.'}
          </p>
        </div>
      )}

      {/* Suggestion & Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6"><Award className="text-amber-500" /><h4 className="text-sm font-black uppercase tracking-widest">KPI</h4></div>
          <div className="h-32 flex items-end gap-2 px-2">
            {[40, 80, 55, 100, 70, 90].map((h, i) => (
              <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg relative">
                <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6"><BookOpen className="text-blue-500" /><h4 className="text-sm font-black uppercase tracking-widest">Library</h4></div>
          <div className="space-y-2">
            {['Manual_v1.pdf', 'Security_Protocol.pdf'].map(doc => (
              <div key={doc} className="flex items-center justify-between p-3 bg-slate-50/5 rounded-xl border border-slate-100/10 hover:border-indigo-500 transition-colors cursor-pointer group">
                <span className="text-[10px] font-bold truncate group-hover:text-indigo-500">{doc}</span>
                <Download size={14} className="text-indigo-500" />
              </div>
            ))}
          </div>
        </div>
        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6"><Lightbulb className="text-emerald-500" /><h4 className="text-sm font-black uppercase tracking-widest">Feedback</h4></div>
          <button onClick={() => setShowIdeaModal(true)} className="w-full py-6 border-2 border-dashed border-slate-100/10 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all">Submit Idea</button>
        </div>
      </div>

      {/* Modals */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className={`${cardStyle} w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95`}>
            <div className="flex justify-between items-center">
              <h4 className="text-2xl font-black">{lang === 'ru' ? 'Отчет' : 'Report'}</h4>
              <button onClick={() => setShowReportModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={submitTaskReport} className="space-y-6">
              <textarea required value={reportComment} onChange={e => setReportComment(e.target.value)} className="w-full p-5 bg-slate-50 border rounded-[2rem] h-32 resize-none outline-none font-bold text-sm" placeholder="..." />
              <div onClick={() => reportFileInputRef.current?.click()} className="w-full py-10 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer">
                <Upload className="text-slate-300" size={32} />
                <span className="text-[10px] font-black uppercase text-slate-400">{reportFile ? reportFile.name : (lang === 'ru' ? "Загрузить файл" : "Upload File")}</span>
                <input ref={reportFileInputRef} type="file" className="hidden" onChange={handleReportFileUpload} />
              </div>
              <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl">Confirm</button>
            </form>
          </div>
        </div>
      )}

      {showIdeaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className={`${cardStyle} w-full max-w-md p-10 space-y-6 animate-in zoom-in-95`}>
            <h4 className="text-2xl font-black">Share Idea</h4>
            <textarea value={ideaText} onChange={e => setIdeaText(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border h-40 resize-none outline-none font-bold text-sm" placeholder="..." />
            <div className="flex gap-4">
              <button onClick={() => setShowIdeaModal(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase">Cancel</button>
              <button onClick={() => {
                const newIdea = { id: `id-${Date.now()}`, authorId: currentUser.id, authorName: currentUser.fullName, text: ideaText, date: Date.now() };
                api.addSuggestion(newIdea).then(() => { setIdeas([...ideas, newIdea]); setShowIdeaModal(false); setIdeaText(''); notify('success', 'Idea sent'); });
              }} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
