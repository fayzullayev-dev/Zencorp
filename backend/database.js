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
    employee_id TEXT
  )`);

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
    FOREIGN KEY(to_id) REFERENCES employees(id)
  )`);

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
