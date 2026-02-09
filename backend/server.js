const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // For base64 images

// --- MyID Proxy Endpoint ---
app.post('/api/myid-proxy', (req, res) => {
    const { pinfl } = req.body;

    if (!pinfl || pinfl.length !== 14 || !/^\d+$/.test(pinfl)) {
        return res.status(400).json({ error: 'ПИНФЛ должен состоять из 14 цифр' });
    }

    // TODO: Интегрировать реальный API MyID с Access Token, чтобы я мог вставить туда боевые ключи позже.

    // Demo Mode: Randomized Mock data
    const firstNames = ['Алишер', 'Жамшид', 'Тимур', 'Сардор', 'Бахтиёр', 'Зарина', 'Нигора', 'Мафтуна', 'Шахноза', 'Дильноза'];
    const lastNames = ['Файзуллаев', 'Ахмедов', 'Усманов', 'Каримов', 'Ибрагимов', 'Рахимов', 'Саидов', 'Туляганов', 'Махмудов', 'Курбанов'];
    const middleNames = ['Каримович', 'Ахмедович', 'Бахтиярович', 'Тимурович', 'Нуруллаевич', 'Каримовна', 'Ахмедовна', 'Бахтияровна', 'Тимуровна', 'Нуруллаевна'];
    const addresses = [
        'г. Ташкент, Яккасарайский район, ул. Бабура, 15',
        'г. Ташкент, Мирзо-Улугбекский район, ул. Мустакиллик, 42',
        'г. Самарканд, ул. Дагбитская, 10',
        'г. Бухара, ул. Бахоуддина Накшбанда, 25',
        'г. Ташкент, Чиланзарский район, кв-л 2, д. 18'
    ];

    // Seed randomness with PINFL to get consistent but diverse data per user
    const seed = parseInt(pinfl.slice(-3));
    const isFemale = (seed % 2 === 0);

    // Pick name from appropriate half of the array (0-4 male, 5-9 female)
    const nameIdx = (seed % 5) + (isFemale ? 5 : 0);

    const mockData = {
        firstName: firstNames[nameIdx],
        lastName: lastNames[nameIdx],
        middleName: middleNames[nameIdx],
        passportSerial: 'AD' + (1000000 + (seed * 1234 % 8999999)),
        passportPIN: pinfl,
        residence: addresses[seed % addresses.length],
        birthPlace: (seed % 2 === 0 ? 'Ташкент' : 'Самарканд'),
        // Visible placeholder photo based on gender
        photoUrl: `https://avataaars.io/?avatarStyle=Circle&topType=${isFemale ? 'LongHairStraight' : 'ShortHairShortFlat'}&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light`,
        phoneNumber: '+99890' + (1000000 + (seed * 5678 % 8999999))
    };

    // Return the response after a short delay to simulate network latency
    setTimeout(() => {
        res.json(mockData);
    }, 1200);
});

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

app.delete('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM employees WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
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
            resultAttachment: r.result_attachment ? JSON.parse(r.result_attachment) : undefined,
            subTasks: r.sub_tasks ? JSON.parse(r.sub_tasks) : [],
            isChainTask: !!r.is_chain_task,
            chainStep: r.chain_step,
            nextChainTaskId: r.next_chain_task_id,
            parentTaskId: r.parent_task_id
        })));
    });
});

app.post('/api/tasks', (req, res) => {
    const t = req.body;
    const sql = `INSERT INTO tasks (
        id, title, description, from_id, from_name, to_id, status, created_at, 
        attachment, sub_tasks, parent_task_id, is_chain_task, chain_step, next_chain_task_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        t.id, t.title, t.description, t.fromId, t.fromName, t.toId, t.status, t.createdAt,
        t.attachment ? JSON.stringify(t.attachment) : null,
        t.subTasks ? JSON.stringify(t.subTasks) : null,
        t.parentTaskId || null,
        t.isChainTask ? 1 : 0,
        t.chainStep || 0,
        t.nextChainTaskId || null
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: t.id });
    });
});

app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const fieldMapping = {
        status: 'status',
        resultAttachment: 'result_attachment',
        subTasks: 'sub_tasks',
        updatedAt: 'updated_at'
    };

    const sets = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
        if (fieldMapping[key]) {
            sets.push(`${fieldMapping[key]} = ?`);
            params.push(key === 'subTasks' || key === 'resultAttachment' ? JSON.stringify(value) : value);
        }
    }

    if (sets.length === 0) return res.json({ success: true });

    params.push(id);
    const sql = `UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`;

    db.run(sql, params, async function (err) {
        if (err) return res.status(500).json({ error: err.message });

        // Logic for progression in task chain
        if (updates.status === 'completed') {
            db.get(`SELECT next_chain_task_id FROM tasks WHERE id = ?`, [id], (err, row) => {
                if (row && row.next_chain_task_id) {
                    // Start next task in chain
                    db.run(`UPDATE tasks SET status = 'pending' WHERE id = ?`, [row.next_chain_task_id]);
                }
            });
        }

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
