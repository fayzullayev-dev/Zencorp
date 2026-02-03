const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');
const fs = require('fs');
const path = require('path');

const app = express();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // For base64 images


// --- USERS & AUTH ---

app.post('/api/auth/login', (req, res) => {
    const { username, password, type, photo } = req.body; // type: 'password' | 'face_id'

    // if (type === 'face_id') { ... logic to compare photo ... }
    // For now, mock face id success if photo is provided
    if (type === 'face_id') {
        // In a real app, use a face recognition library.
        // Here we just find user by username or if it's an employee find by face match mock
        // Let's assume username is sent or we matches any employee
        // For simplified logic:
        if (photo) {
            // Return a mock success
            return res.json({ success: true, user: { id: 'emp-1', role: 'employee', fullName: 'Employee User' } });
        }
    }

    // Standard login
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ success: true, user: row });
    });
});

app.post('/api/auth/employee-login', (req, res) => {
    // Login via PIN/Login from checks
    const { login, password } = req.body;
    db.get(`SELECT * FROM employees WHERE system_login = ? AND system_password = ?`, [login, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid' });

        // Set online status
        db.run(`UPDATE employees SET is_online = 1 WHERE id = ?`, [row.id]);

        const user = { id: row.id, role: 'employee', fullName: `${row.last_name} ${row.first_name}`, email: '' };
        res.json({ success: true, user });
    });
});

app.post('/api/auth/verify-face', (req, res) => {
    const { employeeId, image } = req.body;

    // Check if employee has a photo registered
    db.get(`SELECT photo_url FROM employees WHERE id = ?`, [employeeId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Employee not found' });

        // "Compare" logic
        if (!row.photo_url || row.photo_url.length < 50) {
            // length check is basic validation that it's a real base64 or url
            return res.json({ success: false, message: "No reference photo found in system." });
        }

        // Simulate processing time
        setTimeout(() => {
            // In a real system: verify(image, row.photo_url)
            // Here: Assume success if reference photo exists
            res.json({ success: true, matchScore: 0.98 });
        }, 1500);
    });
});

// --- EMPLOYEES ---

app.get('/api/employees', (req, res) => {
    db.all(`SELECT * FROM employees`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Parse JSON fields
        const employees = rows.map(r => ({
            ...r,
            workingDays: JSON.parse(r.working_days || '[]'),
            firstName: r.first_name,
            lastName: r.last_name,
            // map underscores to camelCase
            catalogId: r.catalog_id,
            photoUrl: r.photo_url,
            passportPIN: r.passport_pin,
            systemLogin: r.system_login,
            systemPassword: r.system_password
        }));
        res.json(employees);
    });
});

app.post('/api/employees', (req, res) => {
    const emp = req.body;
    const sql = `INSERT INTO employees (
    id, first_name, last_name, middle_name, position, catalog_id, phone_number,
    residence, passport_serial, passport_pin, status, photo_url, qr_code, qr_data_url,
    working_hours, working_days, system_login, system_password
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        emp.id, emp.firstName, emp.lastName, emp.middleName, emp.position, emp.catalogId, emp.phoneNumber,
        emp.residence, emp.passportSerial, emp.passportPIN, emp.status || 'active', emp.photoUrl,
        emp.qrCode, emp.qrDataUrl, emp.workingHours, JSON.stringify(emp.workingDays),
        emp.systemLogin, emp.systemPassword
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: emp.id });
    });
});

app.put('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
        return res.json({ success: true, message: "No fields to update" });
    }

    // Map frontend camelCase to backend snake_case
    const fieldMapping = {
        firstName: 'first_name',
        lastName: 'last_name',
        middleName: 'middle_name',
        position: 'position',
        catalogId: 'catalog_id',
        phoneNumber: 'phone_number',
        residence: 'residence',
        passportSerial: 'passport_serial',
        passportPIN: 'passport_pin',
        status: 'status',
        photoUrl: 'photo_url',
        qrCode: 'qr_code',
        qrDataUrl: 'qr_data_url',
        workingHours: 'working_hours',
        workingDays: 'working_days',
        systemLogin: 'system_login',
        systemPassword: 'system_password',
        reportsToId: 'reports_to_id',
        isOnline: 'is_online'
    };

    const sets = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMapping[key] || key;
        sets.push(`${dbField} = ?`);
        params.push(key === 'workingDays' ? JSON.stringify(value) : value);
    }

    params.push(id);
    const sql = `UPDATE employees SET ${sets.join(', ')} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
            console.error("Update Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, changes: this.changes });
    });
});

// --- CATALOGS ---
app.get('/api/catalogs', (req, res) => {
    db.all(`SELECT * FROM catalogs`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, positions: JSON.parse(r.positions || '[]') })));
    });
});

app.post('/api/catalogs', (req, res) => {
    const { id, name, positions } = req.body;
    db.run(`INSERT INTO catalogs (id, name, positions) VALUES (?, ?, ?)`, [id, name, JSON.stringify(positions)], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- TASKS ---
app.get('/api/tasks', (req, res) => {
    db.all(`SELECT * FROM tasks`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({
            ...r,
            attachment: r.attachment ? JSON.parse(r.attachment) : undefined,
            resultAttachment: r.result_attachment ? JSON.parse(r.result_attachment) : undefined
        })));
    });
});

app.post('/api/tasks', (req, res) => {
    const t = req.body;
    const sql = `INSERT INTO tasks (id, title, description, from_id, from_name, to_id, status, created_at, attachment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [t.id, t.title, t.description, t.fromId, t.fromName, t.toId, t.status, t.createdAt, t.attachment ? JSON.stringify(t.attachment) : null], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { status, resultAttachment } = req.body;
    let sql = `UPDATE tasks SET status = ?`;
    let params = [status];

    if (resultAttachment) {
        sql += `, result_attachment = ?`;
        params.push(JSON.stringify(resultAttachment));
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- STATS / CHART ---
app.get('/api/stats/activity', (req, res) => {
    // Get completed tasks for last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    db.all(`SELECT created_at FROM tasks WHERE status = 'completed' AND created_at >= ?`, [sevenDaysAgo], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Aggregation logic can be done in SQL but here in JS for simplicity with timestamps
        res.json(rows.map(r => r.created_at));
    });
});

// --- SUGGESTIONS ---
app.get('/api/suggestions', (req, res) => {
    db.all(`SELECT * FROM suggestions`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, authorName: r.author_name, authorId: r.author_id })));
    });
});

app.post('/api/suggestions', (req, res) => {
    const { id, authorId, authorName, text, date } = req.body;
    db.run(`INSERT INTO suggestions (id, author_id, author_name, text, date) VALUES (?, ?, ?, ?, ?)`,
        [id, authorId, authorName, text, date], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.delete('/api/suggestions/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM suggestions WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/suggestions/:id/reply', (req, res) => {
    // Mock reply functionality - maybe create a message
    const { id } = req.params;
    const { text, fromId } = req.body;
    // Find suggestion author
    db.get(`SELECT author_id FROM suggestions WHERE id = ?`, [id], (err, row) => {
        if (row) {
            const msgId = `msg-${Date.now()}`;
            db.run(`INSERT INTO messages (id, from_id, to_id, text, timestamp) VALUES (?, ?, ?, ?, ?)`,
                [msgId, fromId, row.author_id, `RE: Suggestion - ${text}`, Date.now()]);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Suggestion not found" });
        }
    });
});

// --- MESSAGES ---
app.get('/api/messages', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.json([]);
    db.all(`SELECT * FROM messages WHERE from_id = ? OR to_id = ? ORDER BY timestamp ASC`, [userId, userId], (err, rows) => {
        if (err) return res.json([]);
        res.json(rows.map(r => ({
            ...r,
            fromId: r.from_id,
            toId: r.to_id
        })));
    });
});

app.post('/api/messages', (req, res) => {
    const { id, fromId, toId, text, timestamp } = req.body;
    db.run(`INSERT INTO messages (id, from_id, to_id, text, timestamp) VALUES (?, ?, ?, ?, ?)`,
        [id, fromId, toId, text, timestamp], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.put('/api/messages/read', (req, res) => {
    const { userId, contactId } = req.body;
    db.run(`UPDATE messages SET read = 1 WHERE to_id = ? AND from_id = ?`, [userId, contactId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- ATTENDANCE ---
app.get('/api/attendance', (req, res) => {
    db.all(`SELECT * FROM attendance`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({
            ...r,
            employeeId: r.employee_id,
            employeeName: r.employee_name,
            clockIn: r.clock_in,
            clockOut: r.clock_out,
            isLate: !!r.is_late
        })));
    });
});

app.post('/api/attendance', (req, res) => {
    const { id, employeeId, employeeName, position, date, clockIn, method, isLate } = req.body;
    db.run(`INSERT INTO attendance (id, employee_id, employee_name, position, date, clock_in, method, is_late) VALUES (?,?,?,?,?,?,?,?)`,
        [id, employeeId, employeeName, position, date, clockIn, method, isLate ? 1 : 0], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.put('/api/attendance/finish', (req, res) => {
    const { employeeId, date, clockOut } = req.body;
    db.run(`UPDATE attendance SET clock_out = ? WHERE employee_id = ? AND date = ?`, [clockOut, employeeId, date], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/attendance/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM attendance WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
