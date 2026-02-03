
import React, { useState, useEffect } from 'react';
import { User, Employee, Task, Catalog, AttendanceRecord, Language, Message, Suggestion } from './types';
import { api } from './api';
import LoginForm from './components/LoginForm';
import DirectorDashboard from './components/DirectorDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminInterface from './components/AdminInterface';
import MonitoringDashboard from './components/MonitoringDashboard';
import CredentialsDashboard from './components/CredentialsDashboard';
import PersonnelList from './components/PersonnelList';
import ChatWidget from './components/ChatWidget';
import GlobalModals from './components/GlobalModals';
import {
  Home, UserPlus, FolderPlus, Users, ShieldCheck, Key,
  Clock, LogOut, Sun, Moon, Send, Inbox, ChevronDown, ChevronRight,
  Contact, FileText, ListFilter, ArrowLeft, Archive
} from 'lucide-react';

const translations = {
  en: {
    search: "Search...", home: "Dashboard", addEmp: "Add Employee", addCat: "Add Catalog",
    personnel: "Personnel", contacts: "Contacts", documents: "Documents", workersList: "Workers List",
    hierarchy: "Administration", credentials: "Credentials", monitoring: "Monitoring",
    logout: "Logout", themeDark: "Dark Mode", themeLight: "Light Mode", sendTask: "Send Directive",
    receivedTasks: "Completed Reports", welcome: "Welcome back", stats: "Statistics",
    catalogs: "Catalogs", back: "Back to Home", archive: "Archive"
  },
  ru: {
    search: "Поиск...", home: "Главная", addEmp: "Добавить работника", addCat: "Создать каталог",
    personnel: "Персонал", contacts: "Контакты", documents: "Документы", workersList: "Список рабочих",
    hierarchy: "Администрирование", credentials: "Логины/Пароли", monitoring: "Мониторинг",
    logout: "Выйти", themeDark: "Темный режим", themeLight: "Светлый режим", sendTask: "Отправить задачу",
    receivedTasks: "Завершенные отчеты", welcome: "С возвращением", stats: "Статистика",
    catalogs: "Каталоги", back: "На главную", archive: "Архив"
  },
  uz: {
    search: "Qidiruv...", home: "Asosiy oyna", addEmp: "Xodim qo'shish", addCat: "Katalog yaratish",
    personnel: "Xodimlar", contacts: "Kontaktlar", documents: "Hujjatlar", workersList: "Ishchilar ro'yxati",
    hierarchy: "Ma'muriyat", credentials: "Kirish ma'lumotlari", monitoring: "Monitoring",
    logout: "Chiqish", themeDark: "Tungi rejim", themeLight: "Kunduzgi rejim", sendTask: "Vazifa yuborish",
    receivedTasks: "Bajarilgan hisobotlar", welcome: "Xush kelibsiz", stats: "Statistika",
    catalogs: "Kataloglar", back: "Asosiyga", archive: "Arxiv"
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
  const [isCatalogsOpen, setIsCatalogsOpen] = useState(false);

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
  };

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} employees={employees.filter(e => e.status !== 'archived')} />;
  }

  const NavItem = ({ icon: Icon, label, active, onClick, sub = false }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 ${sub ? 'pl-12 py-3' : 'px-5 py-4'} rounded-2xl text-sm font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : `${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}`}
    >
      <Icon size={sub ? 16 : 20} /> <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F4F7FE] text-slate-900'}`}>
      <aside className={`w-80 flex flex-col h-screen sticky top-0 z-[100] border-r transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">ZC</div>
            <h1 className="text-xl font-black italic tracking-tighter">ZEN<span className={isDarkMode ? 'text-slate-600' : 'text-slate-200'}>CORP</span></h1>
          </div>

          <nav className="space-y-1">
            <NavItem icon={Home} label={t.home} active={currentView === 'main'} onClick={() => setCurrentView('main')} />

            {currentUser.role === 'director' && (
              <>
                <NavItem icon={UserPlus} label={t.addEmp} onClick={() => setActiveModal('add_employee')} />
                <NavItem icon={FolderPlus} label={t.addCat} onClick={() => setActiveModal('add_catalog')} />
                <NavItem icon={Send} label={t.sendTask} active={currentView === 'send_task'} onClick={() => setCurrentView('send_task')} />
                <NavItem icon={Inbox} label={t.receivedTasks} active={currentView === 'inbox'} onClick={() => setCurrentView('inbox')} />

                <div className="space-y-1">
                  <button
                    onClick={() => setIsPersonnelOpen(!isPersonnelOpen)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4"><Users size={20} /> {t.personnel}</div>
                    {isPersonnelOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {isPersonnelOpen && (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                      <NavItem sub icon={ListFilter} label={t.workersList} active={currentView === 'workers'} onClick={() => setCurrentView('workers')} />
                      <NavItem sub icon={Contact} label={t.contacts} active={currentView === 'contacts'} onClick={() => setCurrentView('contacts')} />
                      <NavItem sub icon={FileText} label={t.documents} active={currentView === 'documents'} onClick={() => setCurrentView('documents')} />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => setIsCatalogsOpen(!isCatalogsOpen)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4"><ListFilter size={20} /> {t.catalogs}</div>
                    {isCatalogsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {isCatalogsOpen && (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                      {catalogs.map(cat => (
                        <NavItem
                          key={cat.id} sub icon={ChevronRight} label={cat.name}
                          active={currentView === `catalog-${cat.id}`}
                          onClick={() => setCurrentView(`catalog-${cat.id}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className={`pt-4 border-t space-y-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-50'}`}>
                  <NavItem icon={ShieldCheck} label={t.hierarchy} active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />
                  <NavItem icon={Key} label={t.credentials} active={currentView === 'credentials'} onClick={() => setCurrentView('credentials')} />
                  <NavItem icon={Clock} label={t.monitoring} active={currentView === 'monitoring'} onClick={() => setCurrentView('monitoring')} />
                  <NavItem icon={Archive} label={t.archive} active={currentView === 'archive'} onClick={() => setCurrentView('archive')} />
                </div>
              </>
            )}
          </nav>
        </div>

        <div className={`p-8 border-t space-y-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-50'}`}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-500'}`}
          >
            <div className="flex items-center gap-4">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              {isDarkMode ? t.themeLight : t.themeDark}
            </div>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={20} /> {t.logout}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto no-scrollbar relative flex flex-col">
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
            <AdminInterface employees={employees} setEmployees={setEmployees} t={t} isDarkMode={isDarkMode} />
          ) : currentView === 'monitoring' ? (
            <MonitoringDashboard attendance={attendance} setAttendance={setAttendance} t={t} isDarkMode={isDarkMode} />
          ) : currentView === 'credentials' ? (
            <CredentialsDashboard employees={employees} setEmployees={setEmployees} t={t} isDarkMode={isDarkMode} />
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
            />
          ) : currentUser.role === 'director' ? (
            <DirectorDashboard
              catalogs={catalogs} setCatalogs={setCatalogs}
              employees={employees} setEmployees={setEmployees}
              tasks={tasks} setTasks={setTasks}
              attendance={attendance} t={t} isDarkMode={isDarkMode}
              currentView={currentView} setCurrentView={setCurrentView}
              ideas={ideas} setIdeas={setIdeas}
            />
          ) : (
            <EmployeeDashboard
              currentUser={currentUser} employees={employees}
              tasks={tasks} setTasks={setTasks}
              attendance={attendance} setAttendance={setAttendance}
              t={t} lang={lang} isDarkMode={isDarkMode}
              ideas={ideas} setIdeas={setIdeas}
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
      />

      <ChatWidget
        currentUser={currentUser}
        employees={employees}
        messages={messages}
        setMessages={setMessages}
        isDarkMode={isDarkMode}
        lang={lang}
      />
    </div>
  );
};

export default App;
