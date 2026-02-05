
import { User } from '../types';

const STORAGE_KEY = 'forms_pro_storage_v1';

export const saveUser = async (user: User): Promise<void> => {
  try {
    const allUsers = await getAllUsers();
    const existingIndex = allUsers.findIndex(u => u.email === user.email);
    
    if (existingIndex > -1) {
      allUsers[existingIndex] = user;
    } else {
      allUsers.push(user);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
  } catch (e) {
    console.error("Storage save failed", e);
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Storage read failed", e);
    return [];
  }
};

export const getUser = async (email: string): Promise<User | null> => {
  const users = await getAllUsers();
  return users.find(u => u.email === email) || null;
};