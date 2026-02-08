
import { User } from '../types';
import { syncDatabaseToCloudinary, fetchDatabaseFromCloud } from './cloudinaryService';

const LOCAL_STORAGE_KEY = 'forms_pro_db_local';

/**
 * Saves database to local cache AND Cloudinary global store.
 */
export const saveDatabase = async (users: User[]): Promise<void> => {
  // Always save locally first for offline safety
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));

  try {
    await syncDatabaseToCloudinary(users);
    console.log('Multi-device Cloud Sync Successful');
  } catch (error) {
    console.warn('Cloud Sync Failed. Data is saved locally but not available on other devices.', error);
  }
};

/**
 * Loads database by prioritizing the global cloud store.
 */
export const loadDatabase = async (): Promise<User[]> => {
  // 1. Try to get the latest from the Cloud (Multi-device truth)
  const cloudUsers = await fetchDatabaseFromCloud();
  if (cloudUsers && Array.isArray(cloudUsers)) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudUsers));
    return cloudUsers;
  }

  // 2. Fallback to Local Storage if offline or first time
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  return localData ? JSON.parse(localData) : [];
};
