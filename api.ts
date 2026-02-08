
import { User, Employee, Catalog, Task, AttendanceRecord, Message, Suggestion } from './types';

const isDemo = typeof window !== 'undefined' && (window.location.hostname === 'fayzullayev-dev.github.io' || !window.location.hostname.includes('localhost'));
const API_URL = '/api-v1';
const headers = { 'Content-Type': 'application/json' };

const getStore = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setStore = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const api = {
    // Auth
    login: async (credentials: any) => {
        if (isDemo) {
            return { success: true, user: { id: 'admin-1', role: 'director', fullName: 'Demo Admin' } };
        }
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers,
            body: JSON.stringify(credentials)
        });
        return res.json();
    },

    employeeLogin: async (credentials: any) => {
        const res = await fetch(`${API_URL}/auth/employee-login`, {
            method: 'POST',
            headers,
            body: JSON.stringify(credentials)
        });
        return res.json();
    },

    verifyFace: async (employeeId: string, image: string) => {
        const res = await fetch(`${API_URL}/auth/verify-face`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ employeeId, image })
        });
        return res.json();
    },

    // Employees
    getEmployees: async () => {
        if (isDemo) return getStore('employees');
        const res = await fetch(`${API_URL}/employees`);
        return res.json();
    },

    addEmployee: async (emp: Employee) => {
        if (isDemo) {
            const emps = getStore('employees');
            emps.push(emp);
            setStore('employees', emps);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers,
            body: JSON.stringify(emp)
        });
        return res.json();
    },

    updateEmployee: async (id: string, updates: Partial<Employee>) => {
        if (isDemo) {
            const emps = getStore('employees');
            const idx = emps.findIndex((e: any) => e.id === id);
            if (idx !== -1) emps[idx] = { ...emps[idx], ...updates };
            setStore('employees', emps);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/employees/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
        });
        return res.json();
    },

    // Catalogs
    getCatalogs: async () => {
        if (isDemo) return getStore('catalogs');
        const res = await fetch(`${API_URL}/catalogs`);
        return res.json();
    },

    addCatalog: async (cat: Catalog) => {
        if (isDemo) {
            const cats = getStore('catalogs');
            cats.push(cat);
            setStore('catalogs', cats);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/catalogs`, {
            method: 'POST',
            headers,
            body: JSON.stringify(cat)
        });
        return res.json();
    },

    // Tasks
    getTasks: async () => {
        if (isDemo) return getStore('tasks');
        const res = await fetch(`${API_URL}/tasks`);
        return res.json();
    },

    addTask: async (task: Task) => {
        if (isDemo) {
            const tasks = getStore('tasks');
            tasks.push(task);
            setStore('tasks', tasks);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify(task)
        });
        return res.json();
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
        if (isDemo) {
            const tasks = getStore('tasks');
            const idx = tasks.findIndex((t: any) => t.id === id);
            if (idx !== -1) tasks[idx] = { ...tasks[idx], ...updates };
            setStore('tasks', tasks);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
        });
        return res.json();
    },

    // Attendance
    getAttendance: async () => {
        if (isDemo) return getStore('attendance');
        const res = await fetch(`${API_URL}/attendance`);
        return res.json();
    },

    recordAttendance: async (record: AttendanceRecord) => {
        if (isDemo) {
            const att = getStore('attendance');
            att.push(record);
            setStore('attendance', att);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers,
            body: JSON.stringify(record)
        });
        return res.json();
    },

    finishWork: async (employeeId: string, date: string, clockOut: number) => {
        if (isDemo) {
            const att = getStore('attendance');
            const idx = att.findIndex((a: any) => a.employeeId === employeeId && a.date === date);
            if (idx !== -1) att[idx].clockOut = clockOut;
            setStore('attendance', att);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/attendance/finish`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ employeeId, date, clockOut })
        });
        return res.json();
    },

    deleteAttendance: async (id: string) => {
        if (isDemo) {
            let att = getStore('attendance');
            att = att.filter((a: any) => a.id !== id);
            setStore('attendance', att);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/attendance/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    // Messages
    getMessages: async (userId: string) => {
        if (isDemo) return getStore('messages').filter((m: any) => m.senderId === userId || m.receiverId === userId);
        const res = await fetch(`${API_URL}/messages?userId=${userId}`);
        return res.json();
    },

    sendMessage: async (msg: Message) => {
        if (isDemo) {
            const msgs = getStore('messages');
            msgs.push(msg);
            setStore('messages', msgs);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify(msg)
        });
        return res.json();
    },

    markMessagesRead: async (userId: string, contactId: string) => {
        if (isDemo) {
            const msgs = getStore('messages');
            msgs.forEach((m: any) => { if (m.senderId === contactId && m.receiverId === userId) m.isRead = true; });
            setStore('messages', msgs);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/messages/read`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ userId, contactId })
        });
        return res.json();
    },

    // Suggestions
    getSuggestions: async () => {
        if (isDemo) return getStore('suggestions');
        const res = await fetch(`${API_URL}/suggestions`);
        return res.json();
    },

    addSuggestion: async (suggestion: Suggestion) => {
        if (isDemo) {
            const sug = getStore('suggestions');
            sug.push(suggestion);
            setStore('suggestions', sug);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/suggestions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(suggestion)
        });
        return res.json();
    },

    deleteSuggestion: async (id: string) => {
        if (isDemo) {
            let sug = getStore('suggestions');
            sug = sug.filter((s: any) => s.id !== id);
            setStore('suggestions', sug);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/suggestions/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    replySuggestion: async (id: string, text: string, fromId: string) => {
        if (isDemo) {
            const sug = getStore('suggestions');
            const idx = sug.findIndex((s: any) => s.id === id);
            if (idx !== -1) {
                if (!sug[idx].replies) sug[idx].replies = [];
                sug[idx].replies.push({ text, fromId, date: new Date().toISOString() });
            }
            setStore('suggestions', sug);
            return { success: true };
        }
        const res = await fetch(`${API_URL}/suggestions/${id}/reply`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ text, fromId })
        });
        return res.json();
    },

    // Stats
    getActivityStats: async () => {
        if (isDemo) {
            const att = getStore('attendance');
            const emps = getStore('employees');
            return {
                totalEmployees: emps.length,
                presentToday: att.filter((a: any) => a.date === new Date().toISOString().split('T')[0]).length,
                pendingTasks: getStore('tasks').filter((t: any) => t.status !== 'completed').length
            };
        }
        const res = await fetch(`${API_URL}/stats/activity`);
        return res.json();
    }
};
