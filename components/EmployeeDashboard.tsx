
import React, { useState, useRef, useMemo } from 'react';
import { User, Task, AttendanceRecord, Employee, Language, FileAttachment, Suggestion, TaskStatus } from '../types';
import {
  Camera, Clock3, Send, X, CheckCircle,
  Upload, Paperclip, Download, LayoutGrid, Award, BookOpen, Lightbulb, LogOut,
  Clock, Package, RefreshCw, FileText, ClipboardCheck
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
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser, employees, tasks, setTasks, attendance, setAttendance, t, lang, isDarkMode, ideas, setIdeas
}) => {
  const [readingTask, setReadingTask] = useState<Task | null>(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [ideaText, setIdeaText] = useState('');

  // States for Task Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [pendingTaskToComplete, setPendingTaskToComplete] = useState<Task | null>(null);
  const [reportComment, setReportComment] = useState('');
  const [reportFile, setReportFile] = useState<FileAttachment | undefined>();
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const [isFaceIDActive, setIsFaceIDActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const myTasks = tasks.filter(t => t.toId === currentUser.id);
  const myEmpData = employees.find(e => e.id === currentUser.id);
  const today = new Date().toISOString().split('T')[0];

  const activeRecord = useMemo(() => {
    return attendance.slice().reverse().find(a => a.employeeId === currentUser.id && a.date === today && !a.clockOut);
  }, [attendance, currentUser.id, today]);

  const columns: { title: string, status: TaskStatus[], key: TaskStatus, color: string, icon: any }[] = [
    { title: lang === 'ru' ? "Новые" : "New", status: ['pending', 'assigned_to_worker'], key: 'pending', color: 'indigo', icon: Package },
    { title: lang === 'ru' ? "В процессе" : "In Progress", status: ['in_progress'], key: 'in_progress', color: 'amber', icon: Clock3 },
    { title: lang === 'ru' ? "Отправлено" : "Sent", status: ['in_review', 'pending_hr', 'review_by_hr'], key: 'in_review', color: 'blue', icon: Send },
    { title: lang === 'ru' ? "Выполнено" : "Completed", status: ['completed'], key: 'completed', color: 'emerald', icon: CheckCircle }
  ];

  const [faceIDPurpose, setFaceIDPurpose] = useState<'start' | 'finish' | null>(null);

  const handleStartWork = () => {
    // Check if there is an ACTIVE record for today (not finished yet)
    const activeToday = attendance.find(a => a.employeeId === currentUser.id && a.date === today && !a.clockOut);
    if (activeToday) {
      alert(lang === 'ru' ? "У вас уже есть открытая смена!" : "You already have an active shift!");
      return;
    }

    // Instead of recording attendance, we trigger Face ID first
    startFaceID('start');
  };

  const finalizeStartWork = () => {
    const now = Date.now();
    const formattedTime = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isLate = formattedTime > "09:00";

    const newRecord: AttendanceRecord = {
      id: `att-${now}`,
      employeeId: currentUser.id,
      employeeName: currentUser.fullName,
      position: myEmpData?.position || 'Employee',
      date: today,
      clockIn: now,
      method: 'face_id',
      isLate: isLate
    };

    api.recordAttendance(newRecord).then(() => {
      setAttendance(prev => [...prev, newRecord]);
    }).catch(e => alert("Failed to start shift"));
  };

  const handleFinishWork = () => {
    if (!activeRecord) {
      alert(lang === 'ru' ? "Активная сессия не найдена." : "No active session found.");
      return;
    }
    // Trigger Face ID for finishing work
    startFaceID('finish');
  };

  const finalizeFinishWork = () => {
    if (!activeRecord) return;
    const now = Date.now();
    api.finishWork(activeRecord.employeeId, activeRecord.date, now).then(() => {
      setAttendance(prev => prev.map(a => a.id === activeRecord.id ? { ...a, clockOut: now } : a));
    }).catch(() => alert("Failed to save work status"));
  };

  const [faceIDStatus, setFaceIDStatus] = useState<'idle' | 'scanning' | 'recognized' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

  const loadModels = async () => {
    if (modelsLoaded) return;
    setFaceIDStatus('scanning');
    setVerificationMessage(lang === 'ru' ? 'Загрузка модулей защиты...' : 'Loading security modules...');
    try {
      const faceapi = await import('face-api.js');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      setVerificationMessage(lang === 'ru' ? 'Система готова' : 'System Ready');
      setFaceIDStatus('idle');
    } catch (e) {
      console.error("Model load failed", e);
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
      alert(lang === 'ru' ? "Ошибка камеры" : "Camera Error");
      setIsFaceIDActive(false);
      setFaceIDPurpose(null);
    }
  };

  const processFaceVerify = async () => {
    if (!videoRef.current || !myEmpData?.photoUrl) {
      setFaceIDStatus('error');
      setVerificationMessage(lang === 'ru' ? "Нет фото в профиле" : "Reference photo missing");
      return;
    }

    setFaceIDStatus('scanning');
    setVerificationMessage(lang === 'ru' ? 'Сравнение биометрии...' : 'Comparing biometrics...');

    const faceapi = await import('face-api.js');
    const video = videoRef.current;

    try {
      // 1. Get reference descriptor from profile photo
      const refImg = await faceapi.fetchImage(myEmpData.photoUrl);
      const refDetection = await faceapi.detectSingleFace(refImg, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

      if (!refDetection) {
        setFaceIDStatus('error');
        setVerificationMessage(lang === 'ru' ? "Лицо не найдено в профиле" : "No face in profile photo");
        return;
      }

      const refDescriptor = refDetection.descriptor;

      // 2. Detect face in current video stream
      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        setFaceIDStatus('error');
        setVerificationMessage(lang === 'ru' ? "Лицо не обнаружено" : "Face not detected");
        return;
      }

      // 3. Compare (Distance check - smaller is better)
      const distance = faceapi.euclideanDistance(refDescriptor, detection.descriptor);
      const threshold = 0.56;

      if (distance <= threshold) {
        setFaceIDStatus('recognized');
        setVerificationMessage(lang === 'ru' ? 'РАСПОЗНАНО' : 'RECOGNIZED');

        // Success animation delay before closing
        setTimeout(() => {
          const stream = video.srcObject as MediaStream;
          stream?.getTracks().forEach(t => t.stop());
          setIsFaceIDActive(false);

          if (faceIDPurpose === 'start') {
            finalizeStartWork();
          } else if (faceIDPurpose === 'finish') {
            finalizeFinishWork();
          }
          setFaceIDPurpose(null);
        }, 1500);
      } else {
        setFaceIDStatus('error');
        setVerificationMessage(lang === 'ru' ? 'НЕ РАСПОЗНАНО' : 'NOT RECOGNIZED');
      }
    } catch (e) {
      console.error(e);
      setFaceIDStatus('error');
      setVerificationMessage(lang === 'ru' ? 'Ошибка верификации' : 'Verification Error');
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Trigger report modal if dropping to "completed"
    if (targetStatus === 'completed') {
      setPendingTaskToComplete(task);
      setShowReportModal(true);
    } else {
      api.updateTask(taskId, { status: targetStatus, updatedAt: Date.now() }).then(() => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus, updatedAt: Date.now() } : t));
      });
    }
  };

  const submitTaskReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTaskToComplete) return;

    const updates = {
      status: 'completed' as TaskStatus,
      updatedAt: Date.now(),
      // description: pendingTaskToComplete.description + "\n\n--- REPORT ---\n" + reportComment,
      resultAttachment: reportFile
    };

    api.updateTask(pendingTaskToComplete.id, updates).then(() => {
      setTasks(prev => prev.map(t => t.id === pendingTaskToComplete.id ? {
        ...t, ...updates, description: t.description + "\n\n--- REPORT ---\n" + reportComment
      } : t));
      setShowReportModal(false);
      setPendingTaskToComplete(null);
      setReportComment('');
      setReportFile(undefined);
      alert(lang === 'ru' ? "Отчет отправлен. Задача завершена." : "Report submitted. Task marked as completed.");
    }).catch(err => alert("Failed to submit report"));
  };

  const handleReportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReportFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: ev.target?.result as string
      });
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
            <div className={`absolute inset-0 border-[40px] border-black/30 rounded-full ${faceIDStatus === 'scanning' ? 'animate-pulse' : ''}`} />
          </div>

          <div className="text-center mb-8">
            <p className={`font-black uppercase tracking-[0.4em] text-sm mb-2 ${faceIDStatus === 'recognized' ? 'text-emerald-500 animate-bounce' : faceIDStatus === 'error' ? 'text-red-500' : 'text-white'}`}>
              {verificationMessage}
            </p>
            {faceIDStatus === 'scanning' && (
              <div className="w-48 h-1 bg-white/10 mx-auto rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 animate-progress w-[100%]" />
              </div>
            )}
          </div>

          {faceIDStatus !== 'recognized' && (
            <button
              onClick={processFaceVerify}
              disabled={faceIDStatus === 'scanning'}
              className="px-12 py-5 bg-white text-indigo-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-2xl disabled:opacity-50"
            >
              {faceIDStatus === 'scanning' ? (lang === 'ru' ? 'Обработка...' : 'Processing...') : (lang === 'ru' ? 'Подтвердить личность' : 'Verify Identity')}
            </button>
          )}

          <button onClick={() => {
            if (videoRef.current?.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(t => t.stop());
            }
            setIsFaceIDActive(false);
          }} className="mt-8 text-slate-500 font-bold uppercase text-[10px]">
            {lang === 'ru' ? 'Отмена' : 'Cancel Scan'}
          </button>
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
            <h2 className="text-4xl font-black italic tracking-tight">{currentUser.fullName}</h2>
            <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">{myEmpData?.position}</p>
            {activeRecord && (
              <p className="text-[10px] font-bold text-slate-400 mt-1">
                {lang === 'ru' ? 'Смена активна с ' : 'Session Active since '}
                {new Date(activeRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex gap-4">
            {activeRecord ? (
              <>
                <button
                  onClick={() => startFaceID('finish')}
                  className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl hover:bg-indigo-600 transition-colors group"
                  title="Face Verification"
                >
                  <Camera size={20} className="group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={handleFinishWork} className="bg-red-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-red-700 transition-colors">
                  <LogOut size={16} /> {lang === 'ru' ? 'Завершить работу' : 'Finish Work'}
                </button>
              </>
            ) : (
              <button onClick={handleStartWork} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors">
                <Clock size={16} /> {lang === 'ru' ? 'Начать работу' : 'Start Work'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(col => (
          <div
            key={col.key}
            className="space-y-6"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="flex items-center gap-3 px-5">
              <col.icon size={16} className={`text-${col.color}-500`} />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{col.title}</h4>
            </div>
            <div className={`space-y-4 min-h-[500px] p-4 rounded-[2.5rem] transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-slate-100/50 hover:bg-slate-100'}`}>
              {myTasks.filter(t => col.status.includes(t.status)).map(task => (
                <div
                  key={task.id}
                  draggable={task.status !== 'completed'}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => setReadingTask(task)}
                  className={`${cardStyle} p-6 cursor-grab active:cursor-grabbing hover:border-indigo-500 group relative border-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}
                >
                  <h5 className="font-black text-sm mb-2 group-hover:text-indigo-500 transition-colors">{task.title}</h5>

                  {/* Attached Files Display */}
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

                  {/* Result Display if completed */}
                  {task.resultAttachment && (
                    <div className="mt-2 p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <ClipboardCheck size={14} className="text-emerald-500 shrink-0" />
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 truncate">Report: {task.resultAttachment.name}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <p className="text-[8px] font-black text-slate-400 uppercase">{new Date(task.createdAt).toLocaleDateString()}</p>
                    <RefreshCw size={12} className="text-slate-200 animate-spin-slow" />
                  </div>
                </div>
              ))}
              {myTasks.filter(t => col.status.includes(t.status)).length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 opacity-20">
                  <LayoutGrid size={32} className="text-slate-400 mb-2" />
                  <p className="text-[10px] font-black text-slate-300 uppercase italic">{lang === 'ru' ? 'Список пуст' : 'List is Empty'}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className={`${cardStyle} w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95`}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-2xl font-black italic tracking-tight">{lang === 'ru' ? 'Отчет о выполнении' : 'Completion Report'}</h4>
                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{pendingTaskToComplete?.title}</p>
              </div>
              <button onClick={() => { setShowReportModal(false); setPendingTaskToComplete(null); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><X size={20} /></button>
            </div>

            <form onSubmit={submitTaskReport} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">{lang === 'ru' ? 'Комментарий к работе' : 'Work Comment'}</label>
                <textarea
                  required
                  value={reportComment}
                  onChange={e => setReportComment(e.target.value)}
                  className="w-full p-5 bg-slate-50 border-slate-200 border rounded-[2rem] h-32 resize-none outline-none font-bold text-sm text-slate-900 focus:border-indigo-500"
                  placeholder={lang === 'ru' ? "Опишите проделанную работу..." : "Describe the work done..."}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">{lang === 'ru' ? 'Файл результата' : 'Result File'}</label>
                <div
                  onClick={() => reportFileInputRef.current?.click()}
                  className="w-full py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-indigo-500/5 transition-all group"
                >
                  <Upload className={`text-slate-300 group-hover:text-indigo-500 transition-colors ${reportFile ? 'text-indigo-500' : ''}`} size={32} />
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {reportFile ? reportFile.name : (lang === 'ru' ? "Загрузить документ (PDF/Doc/Xls/Photo)" : "Upload Document (PDF/Doc/Xls/Photo)")}
                  </span>
                  <input ref={reportFileInputRef} type="file" className="hidden" onChange={handleReportFileUpload} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setShowReportModal(false); setPendingTaskToComplete(null); }} className="flex-1 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ru' ? 'Отмена' : 'Cancel'}</button>
                <button
                  type="submit"
                  className="flex-1 py-5 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.03] transition-all"
                >
                  {lang === 'ru' ? 'Подтвердить выполнение' : 'Confirm Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suggestion / Innovation Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6"><Award className="text-amber-500" /><h4 className="text-sm font-black uppercase tracking-widest">Achievements</h4></div>
          <div className="h-32 flex items-end gap-2 px-2">
            {[40, 80, 55, 100, 70, 90].map((h, i) => (
              <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg relative">
                <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
          <p className="text-center text-[8px] font-black text-slate-400 uppercase mt-4">Performance KPI</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6"><BookOpen className="text-blue-500" /><h4 className="text-sm font-black uppercase tracking-widest">Library</h4></div>
          <div className="space-y-3">
            {['ZenCorp_Handbook.pdf', 'Safety_Rules.docx', 'System_Access.pdf'].map(doc => (
              <div key={doc} className="flex items-center justify-between p-3 bg-slate-50/5 rounded-xl border border-slate-100/10 hover:border-indigo-500 transition-colors cursor-pointer group">
                <span className="text-[10px] font-bold truncate w-40 group-hover:text-indigo-500">{doc}</span>
                <Download size={14} className="text-indigo-500" />
              </div>
            ))}
          </div>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6"><Lightbulb className="text-emerald-500" /><h4 className="text-sm font-black uppercase tracking-widest">Innovation</h4></div>
          <button onClick={() => setShowIdeaModal(true)} className="w-full py-6 border-2 border-dashed border-slate-100/10 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all">Submit Feedback</button>
        </div>
      </div>

      {/* Idea Modal */}
      {showIdeaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className={`${cardStyle} w-full max-w-md p-10 space-y-6 animate-in zoom-in-95`}>
            <h4 className="text-2xl font-black italic">Share Idea</h4>
            <textarea
              value={ideaText}
              onChange={e => setIdeaText(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border h-40 resize-none outline-none font-bold text-sm text-slate-900"
              placeholder="Improvement suggestion..."
            />
            <div className="flex gap-4">
              <button onClick={() => setShowIdeaModal(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase">Cancel</button>
              <button onClick={() => {
                if (!ideaText.trim()) return;
                const newIdea = { id: `id-${Date.now()}`, authorId: currentUser.id, authorName: currentUser.fullName, text: ideaText, date: Date.now() };
                api.addSuggestion(newIdea).then(() => {
                  setIdeas([...ideas, newIdea]);
                  setIdeaText(''); setShowIdeaModal(false);
                  // alert("Submitted to HQ.");
                }).catch(() => alert("Failed to submit"));
              }} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
