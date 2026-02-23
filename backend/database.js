const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'zencorp.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.serialize(() => {
  // Users (Auth)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    full_name TEXT,
    employee_id TEXT,
    department_id TEXT
  )`);

  // Add department_id to users if not exists
  db.run(`ALTER TABLE users ADD COLUMN department_id TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      // Ignore if column already exists
    }
  });

  // Catalogs (Departments)
  db.run(`CREATE TABLE IF NOT EXISTS catalogs (
    id TEXT PRIMARY KEY,
    name TEXT,
    positions TEXT -- JSON array of strings
  )`);

  // Employees
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    middle_name TEXT,
    position TEXT,
    catalog_id TEXT,
    phone_number TEXT,
    residence TEXT,
    passport_serial TEXT,
    passport_pin TEXT,
    status TEXT DEFAULT 'active', -- active, archived, inactive
    photo_url TEXT,
    qr_code TEXT,
    qr_data_url TEXT,
    working_hours TEXT,
    working_days TEXT, -- JSON array
    system_login TEXT,
    system_password TEXT,
    reports_to_id TEXT,
    is_online INTEGER DEFAULT 0, -- boolean 0/1
    FOREIGN KEY(catalog_id) REFERENCES catalogs(id)
  )`);

  // Tasks
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    from_id TEXT,
    from_name TEXT,
    to_id TEXT,
    status TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    attachment TEXT, -- JSON {name, type, data...} or URL
    result_attachment TEXT, -- JSON
    assigned_worker_id TEXT,
    sub_tasks TEXT, -- JSON array of SubTask
    parent_task_id TEXT,
    is_chain_task INTEGER DEFAULT 0,
    chain_step INTEGER DEFAULT 0,
    next_chain_task_id TEXT,
    FOREIGN KEY(to_id) REFERENCES employees(id)
  )`);

  // Update tasks table with new columns if they don't exist
  ['sub_tasks', 'parent_task_id', 'is_chain_task', 'chain_step', 'next_chain_task_id',
    'to_name', 'from_manager_id', 'assigned_worker_id', 'hr_reviewer_id'].forEach(col => {
      const type = col.includes('is_') || col.includes('_step') ? 'INTEGER DEFAULT 0' : 'TEXT';
      db.run(`ALTER TABLE tasks ADD COLUMN ${col} ${type}`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          // Ignore duplicate column errors
        }
      });
    });

  // Add parent_id to catalogs if not exists (for sub-departments)
  db.run(`ALTER TABLE catalogs ADD COLUMN parent_id TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      // Ignore
    }
  });

  // Attendance
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    employee_name TEXT,
    position TEXT,
    date TEXT,
    clock_in INTEGER,
    clock_out INTEGER,
    method TEXT,
    is_late INTEGER,
    FOREIGN KEY(employee_id) REFERENCES employees(id)
  )`);

  // Messages (Chat)
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    from_id TEXT,
    to_id TEXT,
    text TEXT,
    timestamp INTEGER,
    read INTEGER DEFAULT 0
  )`);

  // Suggestions
  db.run(`CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    author_id TEXT,
    author_name TEXT,
    text TEXT,
    date INTEGER
  )`);
});

module.exports = db;
