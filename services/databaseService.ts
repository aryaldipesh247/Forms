import { User } from '../types';
import { syncDatabaseToCloudinary } from './cloudinaryService';

const LOCAL_STORAGE_KEY = 'forms_pro_db_local';
const REMOTE_URL_KEY = 'forms_pro_db_remote_url';

/**
 * Saves the entire users array to LocalStorage and attempts to sync to Cloudinary.
 */
export const saveDatabase = async (users: User[]): Promise<void> => {
  // 1. Always update local storage first for instant reliability
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));

  try {
    // 2. Attempt Cloudinary Sync
    const remoteUrl = await syncDatabaseToCloudinary(users);
    localStorage.setItem(REMOTE_URL_KEY, remoteUrl);
    console.log('Database Cloud Sync Active:', remoteUrl);
  } catch (error: any) {
    // Log the error but don't stop the app. The user might need to fix their Cloudinary settings.
    console.warn('Cloudinary Sync Failed:', error.message);
    
    // Check if it's the specific whitelisting error to alert the developer
    if (error.message.includes('whitelisted')) {
      console.error('DEVELOPER ACTION REQUIRED: Your Cloudinary "ml_default" preset must be set to "Unsigned" in the dashboard.');
    }
  }
};

/**
 * Loads the database from LocalStorage or the Cloudinary URL.
 */
export const loadDatabase = async (): Promise<User[]> => {
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  const remoteUrl = localStorage.getItem(REMOTE_URL_KEY);

  let users: User[] = localData ? JSON.parse(localData) : [];

  if (remoteUrl) {
    try {
      const response = await fetch(remoteUrl);
      if (response.ok) {
        const cloudPackage = await response.json();
        // Handle wrapped data format from syncDatabaseToCloudinary
        const cloudData = cloudPackage.users || cloudPackage;
        
        if (Array.isArray(cloudData)) {
          // In a multi-device scenario, we'd compare timestamps. 
          // For this demo, we treat Cloudinary as the "Cloud Truth".
          users = cloudData;
        }
      }
    } catch (error) {
      console.warn('Remote database unreachable, sticking with local data.');
    }
  }

  return users;
};
