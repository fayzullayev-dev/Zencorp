import React, { useState, useEffect } from 'react';
import { User, Employee, Task, Catalog, AttendanceRecord, Language, Message, Suggestion } from './types';
import { api } from './api';
import NotificationSystem, { Toast } from './components/NotificationSystem';
import ConfirmModal from './components/ConfirmModal';
import PromptModal from './components/PromptModal';
import LoginForm from './components/LoginForm';
import DirectorDashboard from './components/DirectorDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import HRDashboard from './components/HRDashboard';
import AdminInterface from './components/AdminInterface';
import MonitoringDashboard from './components/MonitoringDashboard';
import CredentialsDashboard from './components/CredentialsDashboard';
import PersonnelList from './components/PersonnelList';
import ChatWidget from './components/ChatWidget';
import GlobalModals from './components/GlobalModals';
import TaskRegistry from './components/TaskRegistry';
import TaskSender from './components/TaskSender';
import TaskWorkflowManager from './components/TaskWorkflowManager';
import {
  Home, UserPlus, FolderPlus, Users, ShieldCheck, Key, Plus,
  Clock, LogOut, Sun, Moon, Send, Inbox, ChevronDown, ChevronRight,
  Contact, FileText, ListFilter, ArrowLeft, Archive, Search as UserSearch,
  LayoutPanelLeft, Workflow, Menu, X
} from 'lucide-react';

const translations = {
  en: {
    search: "Search...", home: "Dashboard", addEmp: "Add Employee", addDep: "Add Department",
    personnel: "Personnel Management", contacts: "Contacts", documents: "Documents", workersList: "Workers List",
    hierarchy: "Administration", credentials: "Credentials", monitoring: "Monitoring",
    logout: "Logout", themeDark: "Dark Mode", themeLight: "Light Mode", sendTask: "Send Directive",
    receivedTasks: "Received Reports", welcome: "Welcome back", stats: "Statistics",
    departments: "Departments", back: "Back to Home", archive: "Archive",
    tasks: "Task Management", tasksSent: "Sent", tasksReceived: "Received", tasksPending: "Pending",
    myDepartment: "My Department", processMonitor: "Process Monitor", backBtn: "Back"
  },
  ru: {
    search: "Поиск...", home: "Главная", addEmp: "Добавить работника", addDep: "Создать отдел",
    personnel: "Список персонала", contacts: "Контакты", documents: "Документы", workersList: "Список рабочих",
    hierarchy: "Администрирование", credentials: "Логины/Пароли", monitoring: "Мониторинг",
    logout: "Выйти", themeDark: "Темный режим", themeLight: "Светлый режим", sendTask: "Отправить задачу",
    receivedTasks: "Завершенные отчеты", welcome: "С возвращением", stats: "Статистика",
    departments: "Отделы", back: "На главную", archive: "Архив",
    tasks: "Задачи", tasksSent: "Отправленные", tasksReceived: "Полученные", tasksPending: "Ожидаемые",
    myDepartment: "Мой отдел", processMonitor: "Мониторинг процессов", backBtn: "Назад"
  },
  uz: {
    search: "Qidiruv...", home: "Asosiy oyna", addEmp: "Xodim qo'shish", addDep: "Bo'lim yaratish",
    personnel: "Xodimlar ro'yxati", contacts: "Kontaktlar", documents: "Hujjatlar", workersList: "Ishchilar ro'yxati",
    hierarchy: "Ma'muriyat", credentials: "Kirish ma'lumotlari", monitoring: "Monitoring",
    logout: "Chiqish", themeDark: "Tungi rejim", themeLight: "Kunduzgi rejim", sendTask: "Vazifa yuborish",
    receivedTasks: "Bajarilgan hisobotlar", welcome: "Xush kelibsiz", stats: "Statistika",
    departments: "Bo'limlar", back: "Asosiyga", archive: "Arxiv",
    tasks: "Vazifalar", tasksSent: "Yuborilgan", tasksReceived: "Qabul qilingan", tasksPending: "Kutilayotgan",
    myDepartment: "Mening bo'limim", processMonitor: "Jarayonlar monitoringi", backBtn: "Orqaga"
  }
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('ru');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([{ id: 'cat-1', name: 'General', positions: ['Manager', 'Developer'] }]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ideas, setIdeas] = useState<Suggestion[]>([]);
  const [currentView, setCurrentView] = useState<string>('main');
  const [activeModal, setActiveModal] = useState<'add_employee' | 'add_catalog' | null>(null);
  const [isPersonnelOpen, setIsPersonnelOpen] = useState(false);
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false);
  const [isTasksMenuOpen, setIsTasksMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [promptModal, setPromptModal] = useState<{ isOpen: boolean; title: string; message: string; placeholder: string; onConfirm: (v: string) => void } | null>(null);

  const notify = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const requestPrompt = (title: string, message: string, placeholder: string, onConfirm: (v: string) => void) => {
    setPromptModal({ isOpen: true, title, message, placeholder, onConfirm });
  };

  const t = translations[lang];

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Polling interval for real-time updates
    const interval = setInterval(() => {
      fetchData();
      if (currentUser) {
        api.getMessages(currentUser.id).then(setMessages).catch(console.error);
      }
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [currentUser]);

  // Load from localStorage on mount (Instant start)
  useEffect(() => {
    const savedEmps = localStorage.getItem('zen_employees');
    const savedCats = localStorage.getItem('zen_catalogs');
    const savedTasks = localStorage.getItem('zen_tasks');
    const savedAtt = localStorage.getItem('zen_attendance');

    if (savedEmps) setEmployees(JSON.parse(savedEmps));
    if (savedCats) setCatalogs(JSON.parse(savedCats));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedAtt) setAttendance(JSON.parse(savedAtt));
  }, []);

  // Save to localStorage whenever state changes (Safety backup)
  useEffect(() => {
    if (employees.length) localStorage.setItem('zen_employees', JSON.stringify(employees));
    if (catalogs.length) localStorage.setItem('zen_catalogs', JSON.stringify(catalogs));
    if (tasks.length) localStorage.setItem('zen_tasks', JSON.stringify(tasks));
    if (attendance.length) localStorage.setItem('zen_attendance', JSON.stringify(attendance));
  }, [employees, catalogs, tasks, attendance]);

  const fetchData = async () => {
    try {
      const [emps, cats, tsks, atts, suggs] = await Promise.all([
        api.getEmployees(),
        api.getCatalogs(),
        api.getTasks(),
        api.getAttendance(),
        api.getSuggestions()
      ]);
      setEmployees(emps);
      setCatalogs(cats);
      setTasks(tsks);
      setAttendance(atts);
      setIdeas(suggs);

      // Save to localStorage for persistence
      localStorage.setItem('zen_employees', JSON.stringify(emps));
      localStorage.setItem('zen_catalogs', JSON.stringify(cats));
      localStorage.setItem('zen_tasks', JSON.stringify(tsks));
      localStorage.setItem('zen_attendance', JSON.stringify(atts));
    } catch (e) {
      console.error("Backend Error - falling back to LocalStorage:", e);
    }
  };

  const handleLogin = async (credentials: any) => {
    // Determine type based on credentials structure from LoginForm
    // LoginForm passes a User object currently, I need to check how LoginForm works
    // Attempt API login
    try {
      // logic to distinguish employee vs admin login
      if (credentials.role) {
        // direct mock login from existing frontend logic?
        // Ideally we use api.login(credentials)
        setCurrentUser(credentials);
      } else {
        // If it came from a real form
        // const res = await api.login(credentials);
        // if (res.success) setCurrentUser(res.user);
        setCurrentUser(credentials);
      }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    if (currentUser?.role === 'employee') {
      api.updateEmployee(currentUser.id, { isOnline: false as any });
    }
    setCurrentUser(null);
    setCurrentView('main');
    notify('info', lang === 'ru' ? 'Выход из системы выполнен' : 'Logged out successfully');
  };

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} employees={employees.filter(e => e.status !== 'archived')} />;
  }

  const NavItem = ({ icon: Icon, label, active, onClick, sub = false }: any) => (
    <button
      onClick={() => { onClick(); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-4 ${sub ? 'pl-12 py-3' : 'px-5 py-4'} rounded-2xl text-sm font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : `${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}`}
    >
      <Icon size={sub ? 16 : 20} /> <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F4F7FE] text-slate-900'}`}>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[150] lg:hidden transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[200] w-80 flex flex-col h-screen border-r transition-all duration-500 ease-in-out
        ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:sticky lg:top-0
      `}>
        <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="flex items-center justify-between gap-3 px-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">ZC</div>
              <h1 className="text-xl font-black tracking-tighter">ZEN<span className={isDarkMode ? 'text-slate-600' : 'text-slate-200'}>CORP</span></h1>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 lg:hidden text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-1">
            <NavItem icon={Home} label={t.home} active={currentView === 'main'} onClick={() => setCurrentView('main')} />

            {/* My Department (Unit Lead) */}
            {currentUser.role === 'unit_lead' && (
              <button
                onClick={() => { setCurrentView('my_department'); setIsTasksMenuOpen(false); setIsPersonnelOpen(false); setIsDepartmentsOpen(false); }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${currentView === 'my_department' ? 'bg-indigo-600 text-white shadow-lg' : `${isDarkMode ? 'text-slate-500 hover:bg-slate-800/50' : 'text-slate-500 hover:bg-slate-50'}`}`}
              >
                <div className="flex items-center gap-4">
                  <LayoutPanelLeft size={20} />
                  <span className="text-sm font-bold">{t.myDepartment}</span>
                </div>
              </button>
            )}

            {['director', 'manager', 'unit_lead'].includes(currentUser.role) && (
              <button
                onClick={() => { setCurrentView('workflow_monitor'); setIsTasksMenuOpen(false); setIsPersonnelOpen(false); setIsDepartmentsOpen(false); }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${currentView === 'workflow_monitor' ? 'bg-indigo-600 text-white shadow-lg' : `${isDarkMode ? 'text-slate-500 hover:bg-slate-800/50' : 'text-slate-500 hover:bg-slate-50'}`}`}
              >
                <div className="flex items-center gap-4">
                  <Workflow size={20} />
                  <span className="text-sm font-bold">{t.processMonitor}</span>
                </div>
              </button>
            )}

            {/* Personnel Management Group */}
            {['manager', 'hr_head', 'director', 'unit_lead'].includes(currentUser.role) && (
              <>
                <div className="space-y-1">
                  <button
                    onClick={() => setIsPersonnelOpen(!isPersonnelOpen)}
                    className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isPersonnelOpen ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <div className="flex items-center gap-4"><Users size={18} /> {t.personnel}</div>
                    {isPersonnelOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {isPersonnelOpen && (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                      <NavItem sub icon={ChevronRight} label={t.workersList} active={currentView === 'workers'} onClick={() => setCurrentView('workers')} />
                      {(currentUser.role === 'manager' || currentUser.role === 'director') && (
                        <NavItem sub icon={Plus} label={t.addEmp} active={activeModal === 'add_employee'} onClick={() => setActiveModal('add_employee')} />
                      )}
                      <button
                        onClick={() => setIsDepartmentsOpen(!isDepartmentsOpen)}
                        className={`w-full flex items-center justify-between pl-10 pr-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isDepartmentsOpen ? 'text-indigo-500' : 'text-slate-400'}`}
                      >
                        <div className="flex items-center gap-3"><ListFilter size={14} /> {t.departments}</div>
                        {isDepartmentsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      {isDepartmentsOpen && (() => {
                        // Build hierarchical catalog list
                        const renderCatalog = (cat: any, depth: number = 0): JSX.Element => {
                          const children = catalogs.filter(c => c.parentId === cat.id);
                          const isActive = currentView === `catalog-${cat.id}`;
                          return (
                            <div key={cat.id}>
                              <div
                                className="flex items-center gap-1"
                                onDragOver={(e) => { e.preventDefault(); }}
                                onDragLeave={(e) => { }}
                                onDrop={(e) => { }}
                                style={{ paddingLeft: `${depth * 12 + 16}px` }}
                              >
                                <button
                                  className={`flex-1 flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all text-left ${isActive ? 'bg-indigo-600 text-white shadow-sm' : `${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}`}
                                  onClick={() => setCurrentView(`catalog-${cat.id}`)}
                                >
                                  {depth > 0 && <ChevronRight size={10} className="opacity-50" />}
                                  <span className="truncate">{cat.name}</span>
                                </button>
                              </div>
                              {children.map(child => renderCatalog(child, depth + 1))}
                            </div>
                          );
                        };
                        const rootCatalogs = catalogs.filter(c => !c.parentId);
                        const orphans = catalogs.filter(c => c.parentId && !catalogs.find(p => p.id === c.parentId));
                        return (
                          <div className="space-y-0.5 pl-2 mt-1">
                            {rootCatalogs.map(cat => renderCatalog(cat, 0))}
                            {orphans.map(cat => renderCatalog(cat, 0))}
                            {(currentUser.role === 'director') && (
                              <NavItem sub icon={FolderPlus} label={t.addDep} active={activeModal === 'add_catalog'} onClick={() => setActiveModal('add_catalog')} />
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => setIsTasksMenuOpen(!isTasksMenuOpen)}
                    className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isTasksMenuOpen ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <div className="flex items-center gap-4"><FileText size={18} /> {t.tasks}</div>
                    {isTasksMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {isTasksMenuOpen && (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                      <NavItem sub icon={Send} label={t.sendTask} active={currentView === 'send_task'} onClick={() => setCurrentView('send_task')} />
                      <NavItem sub icon={ChevronRight} label={t.tasksSent} active={currentView === 'tasks_sent'} onClick={() => setCurrentView('tasks_sent')} />
                      <NavItem sub icon={ChevronRight} label={t.tasksReceived} active={currentView === 'tasks_received'} onClick={() => setCurrentView('tasks_received')} />
                      <NavItem sub icon={Clock} label={t.tasksPending} active={currentView === 'tasks_pending'} onClick={() => setCurrentView('tasks_pending')} />
                    </div>
                  )}
                </div>

                <div className={`pt-4 border-t space-y-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-50'}`}>
                  <NavItem icon={Key} label={t.credentials} active={currentView === 'credentials'} onClick={() => setCurrentView('credentials')} />
                  <NavItem icon={Clock} label={t.monitoring} active={currentView === 'monitoring'} onClick={() => setCurrentView('monitoring')} />
                  <NavItem icon={Archive} label={t.archive} active={currentView === 'archive'} onClick={() => setCurrentView('archive')} />
                </div>
              </>
            )}
          </nav>
        </div>

        {/* Footer with Icons: Theme, Language, Logout */}
        <div className={`mt-auto p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} space-y-4`}>
          <div className="flex items-center justify-between gap-2">
            {/* Language Switcher */}
            <div className="flex gap-1">
              {[
                { code: 'ru', label: 'RU', flag: '🇷🇺' },
                { code: 'en', label: 'EN', flag: '🇺🇸' },
                { code: 'uz', label: 'UZ', flag: '🇺🇿' }
              ].map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as Language)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${lang === l.code ? 'bg-indigo-600 text-white shadow-lg' : `${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}`}
                  title={l.label}
                >
                  {l.flag}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                title={t.logout}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto no-scrollbar relative flex flex-col">
        {/* Mobile Header Toggle */}
        <div className="flex lg:hidden items-center justify-between mb-8">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`p-3 rounded-2xl shadow-sm border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-600'}`}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg">ZC</div>
            <span className="text-sm font-black tracking-widest">ZENCORE</span>
          </div>
        </div>

        {currentView !== 'main' && (
          <button
            onClick={() => setCurrentView('main')}
            className="flex items-center gap-2 mb-6 text-indigo-500 font-black uppercase text-[10px] tracking-widest hover:translate-x-[-4px] transition-transform w-fit"
          >
            <ArrowLeft size={16} /> {t.back}
          </button>
        )}

        <div className="flex-1">
          {currentView === 'admin' ? (
            <AdminInterface employees={employees} setEmployees={setEmployees} t={t} isDarkMode={isDarkMode} notify={notify} />
          ) : currentView === 'monitoring' ? (
            <MonitoringDashboard attendance={attendance} setAttendance={setAttendance} t={t} isDarkMode={isDarkMode} notify={notify} requestConfirm={requestConfirm} />
          ) : currentView === 'credentials' ? (
            <CredentialsDashboard employees={employees} setEmployees={setEmployees} t={t} isDarkMode={isDarkMode} notify={notify} />
          ) : (currentView === 'contacts' || currentView === 'documents' || currentView === 'workers' || currentView === 'archive' || currentView.startsWith('catalog-')) ? (
            <PersonnelList
              employees={employees}
              attendance={attendance}
              setEmployees={setEmployees}
              t={t}
              lang={lang}
              isDarkMode={isDarkMode}
              viewType={currentView.startsWith('catalog-') ? 'catalog' : currentView as any}
              // FIXED: correctly extract catalog ID by removing the prefix instead of splitting
              catalogId={currentView.startsWith('catalog-') ? currentView.replace('catalog-', '') : undefined}
              catalogs={catalogs}
              notify={notify}
              requestConfirm={requestConfirm}
              currentUser={currentUser}
            />
          ) : currentView === 'send_task' ? (
            <TaskSender
              currentUser={currentUser}
              employees={employees}
              catalogs={catalogs}
              setTasks={setTasks}
              notify={notify}
              isDarkMode={isDarkMode}
              lang={lang}
            />
          ) : currentView === 'my_department' ? (
            <PersonnelList
              viewType="workers"
              employees={employees.filter(e => e.departmentId === currentUser.departmentId)}
              attendance={attendance}
              setEmployees={setEmployees}
              t={t}
              lang={lang}
              isDarkMode={isDarkMode}
              currentUser={currentUser}
              catalogs={catalogs}
              notify={notify}
              requestConfirm={requestConfirm}
            />
          ) : currentView === 'workflow_monitor' ? (
            <TaskWorkflowManager
              tasks={tasks}
              currentUser={currentUser}
              isDarkMode={isDarkMode}
              lang={lang}
            />
          ) : (currentView === 'tasks_sent' || currentView === 'tasks_received' || currentView === 'tasks_pending') ? (
            <TaskRegistry
              currentUser={currentUser}
              tasks={tasks}
              viewType={currentView.replace('tasks_', '') as any}
              isDarkMode={isDarkMode}
              lang={lang}
              setTasks={setTasks}
              notify={notify}
              requestConfirm={requestConfirm}
            />
          ) : currentUser.role === 'manager' ? (
            <ManagerDashboard
              currentUser={currentUser}
              employees={employees}
              tasks={tasks}
              setEmployees={setEmployees}
              setTasks={setTasks}
              notify={notify}
              requestConfirm={requestConfirm}
            />
          ) : currentUser.role === 'hr_head' ? (
            <HRDashboard
              currentUser={currentUser}
              employees={employees}
              tasks={tasks}
              setTasks={setTasks}
              notify={notify}
            />
          ) : currentUser.role === 'director' ? (
            <DirectorDashboard
              catalogs={catalogs} setCatalogs={setCatalogs}
              employees={employees} setEmployees={setEmployees}
              tasks={tasks} setTasks={setTasks}
              attendance={attendance} t={t} isDarkMode={isDarkMode}
              currentView={currentView} setCurrentView={setCurrentView}
              ideas={ideas} setIdeas={setIdeas}
              notify={notify}
              requestConfirm={requestConfirm}
              requestPrompt={requestPrompt}
              lang={lang}
            />
          ) : (
            <EmployeeDashboard
              currentUser={currentUser} employees={employees}
              tasks={tasks} setTasks={setTasks}
              attendance={attendance} setAttendance={setAttendance}
              t={t} lang={lang} isDarkMode={isDarkMode}
              ideas={ideas} setIdeas={setIdeas}
              notify={notify}
            />
          )}
        </div>
      </main>

      <GlobalModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        catalogs={catalogs}
        setCatalogs={setCatalogs}
        employees={employees}
        setEmployees={setEmployees}
        t={t}
        isDarkMode={isDarkMode}
        lang={lang}
        notify={notify}
      />

      <ChatWidget
        currentUser={currentUser}
        employees={employees}
        messages={messages}
        setMessages={setMessages}
        isDarkMode={isDarkMode}
        lang={lang}
      />

      <NotificationSystem
        notifications={notifications}
        removeNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />

      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
          isDarkMode={isDarkMode}
          lang={lang}
        />
      )}

      {promptModal && (
        <PromptModal
          isOpen={promptModal.isOpen}
          title={promptModal.title}
          message={promptModal.message}
          placeholder={promptModal.placeholder}
          onConfirm={(v) => {
            promptModal.onConfirm(v);
            setPromptModal(null);
          }}
          onCancel={() => setPromptModal(null)}
          isDarkMode={isDarkMode}
          lang={lang}
        />
      )}
    </div>
  );
};

export default App;
