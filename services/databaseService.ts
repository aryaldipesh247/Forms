
import { User } from '../types';
import { syncDatabaseToCloudinary, fetchDatabaseFromCloud } from './cloudinaryService';

const LOCAL_STORAGE_KEY = 'forms_pro_db_local';

/**
 * Saves database to local cache AND Cloudinary global store.
 * This acts as the 'Backend' for multi-device persistence.
 */
export const saveDatabase = async (users: User[]): Promise<void> => {
  // Always save locally first for immediate UI responsiveness
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));

  try {
    // Sync to Cloudinary (Global Truth)
    await syncDatabaseToCloudinary(users);
    console.log('✅ Multi-device Cloud Sync Successful');
  } catch (error) {
    console.warn('❌ Cloud Sync Failed. Data is local-only.', error);
  }
};

/**
 * Loads database by prioritizing the global cloud store.
 */
export const loadDatabase = async (): Promise<User[]> => {
  try {
    // 1. Fetch the latest Global Registry from Cloudinary
    const cloudUsers = await fetchDatabaseFromCloud();
    if (cloudUsers && Array.isArray(cloudUsers)) {
      // Update local cache with cloud truth
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudUsers));
      return cloudUsers;
    }
  } catch (e) {
    console.warn("Cloud fetch failed, falling back to local storage.", e);
  }

  // 2. Fallback to Local Storage (Offline or First Load)
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  return localData ? JSON.parse(localData) : [];
};
