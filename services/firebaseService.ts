
import { User } from '../types';

const CLOUD_STORAGE_KEY = 'forms_pro_cloud_sync_v1';

/**
 * Safely saves a user profile. In a real environment, this would use Firebase.
 * Here, we use an isolated localStorage key to simulate a "cloud" backend.
 */
export const saveUserToCloud = async (user: User): Promise<void> => {
  try {
    const cloudData = await getAllUsersFromCloud();
    const existingIndex = cloudData.findIndex(u => u.email === user.email);
    
    if (existingIndex > -1) {
      cloudData[existingIndex] = user;
    } else {
      cloudData.push(user);
    }
    
    localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(cloudData));
  } catch (e) {
    console.warn("Cloud save simulation failed, using local fallback", e);
  }
};

/**
 * Retrieves all users from the simulated cloud storage.
 */
export const getAllUsersFromCloud = async (): Promise<User[]> => {
  try {
    const saved = localStorage.getItem(CLOUD_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Retrieves a specific user by email from the simulated cloud storage.
 */
export const getUserFromCloud = async (email: string): Promise<User | null> => {
  const users = await getAllUsersFromCloud();
  return users.find(u => u.email === email) || null;
};
