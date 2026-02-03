
import { User, Employee, Catalog, Task, AttendanceRecord, Message, Suggestion } from './types';

const API_URL = 'http://localhost:3000/api';

const headers = {
    'Content-Type': 'application/json'
};

export const api = {
    // Auth
    login: async (credentials: any) => {
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
        const res = await fetch(`${API_URL}/employees`);
        return res.json();
    },

    addEmployee: async (emp: Employee) => {
        const res = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers,
            body: JSON.stringify(emp)
        });
        return res.json();
    },

    updateEmployee: async (id: string, updates: Partial<Employee>) => {
        const res = await fetch(`${API_URL}/employees/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
        });
        return res.json();
    },

    // Catalogs
    getCatalogs: async () => {
        const res = await fetch(`${API_URL}/catalogs`);
        return res.json();
    },

    addCatalog: async (cat: Catalog) => {
        const res = await fetch(`${API_URL}/catalogs`, {
            method: 'POST',
            headers,
            body: JSON.stringify(cat)
        });
        return res.json();
    },

    // Tasks
    getTasks: async () => {
        const res = await fetch(`${API_URL}/tasks`);
        return res.json();
    },

    addTask: async (task: Task) => {
        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify(task)
        });
        return res.json();
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
        const res = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
        });
        return res.json();
    },

    // Attendance
    getAttendance: async () => {
        const res = await fetch(`${API_URL}/attendance`);
        return res.json();
    },

    recordAttendance: async (record: AttendanceRecord) => {
        const res = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers,
            body: JSON.stringify(record)
        });
        return res.json();
    },

    finishWork: async (employeeId: string, date: string, clockOut: number) => {
        const res = await fetch(`${API_URL}/attendance/finish`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ employeeId, date, clockOut })
        });
        return res.json();
    },

    deleteAttendance: async (id: string) => {
        const res = await fetch(`${API_URL}/attendance/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    // Messages
    getMessages: async (userId: string) => {
        const res = await fetch(`${API_URL}/messages?userId=${userId}`);
        return res.json();
    },

    sendMessage: async (msg: Message) => {
        const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify(msg)
        });
        return res.json();
    },

    markMessagesRead: async (userId: string, contactId: string) => {
        const res = await fetch(`${API_URL}/messages/read`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ userId, contactId })
        });
        return res.json();
    },

    // Suggestions
    getSuggestions: async () => {
        const res = await fetch(`${API_URL}/suggestions`);
        return res.json();
    },

    addSuggestion: async (suggestion: Suggestion) => {
        const res = await fetch(`${API_URL}/suggestions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(suggestion)
        });
        return res.json();
    },

    deleteSuggestion: async (id: string) => {
        const res = await fetch(`${API_URL}/suggestions/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    replySuggestion: async (id: string, text: string, fromId: string) => {
        const res = await fetch(`${API_URL}/suggestions/${id}/reply`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ text, fromId })
        });
        return res.json();
    },

    // Stats
    getActivityStats: async () => {
        const res = await fetch(`${API_URL}/stats/activity`);
        return res.json();
    }
};
