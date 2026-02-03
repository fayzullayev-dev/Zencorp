
import React from 'react';
import { Department, User } from './types';

export const DEPARTMENTS: Department[] = [
  { id: 'dep-hr', name: 'Human Resources' },
  { id: 'dep-it', name: 'IT Support' },
  { id: 'dep-mkt', name: 'Marketing' },
  { id: 'dep-sales', name: 'Sales' },
];

export const MOCK_MANAGER: User = {
  id: 'u-1',
  username: 'admin',
  role: 'manager',
  fullName: 'John Manager',
  email: 'manager@zencorp.com'
};

export const MOCK_HR_HEAD: User = {
  id: 'u-hr-1',
  username: 'hr_boss',
  role: 'hr_head',
  fullName: 'Sarah HR Head',
  email: 'sarah@zencorp.com'
};
