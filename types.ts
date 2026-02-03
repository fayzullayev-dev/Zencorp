
export type UserRole = 'manager' | 'employee' | 'hr_head' | 'director';
export type Language = 'en' | 'ru' | 'uz';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  email: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Catalog {
  id: string;
  name: string;
  positions: string[];
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  date: string;
  clockIn: number;
  clockOut?: number;
  method: 'standard' | 'face_id' | 'qr_code' | 'manual';
  isLate?: boolean;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: number;
  read?: boolean;
}

export interface Suggestion {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  date: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string;
  position: string;
  photoUrl: string;
  catalogId: string;
  phoneNumber: string;
  residence: string;
  passportSerial: string;
  passportPIN: string;
  status: 'active' | 'archived' | 'inactive';
  workingHours: string;
  workingDays: string[];
  systemLogin?: string;
  systemPassword?: string;
  isOnline?: boolean;
  qrCode?: string;
  qrDataUrl?: string;
  completedTasksHistory?: { date: string; count: number }[];
  reportsToId?: string;
  departmentId?: string;
}

export type TaskStatus = 'pending' | 'read' | 'in_progress' | 'in_review' | 'completed' | 'overdue' | 'pending_hr' | 'review_by_hr' | 'assigned_to_worker';

export interface Task {
  id: string;
  title: string;
  description: string;
  fromId: string;
  fromName: string;
  toId: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt?: number;
  attachment?: FileAttachment;
  resultAttachment?: FileAttachment;
  fromManagerId?: string;
  assignedWorkerId?: string;
  hrReviewerId?: string;
}
