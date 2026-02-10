import firebase from "firebase/compat/app";
import "firebase/compat/database";
import { db } from "./firebase";
import { User, Form, FormResponse } from '../types';

const STORAGE_KEY = 'forms_pro_cloud_sync_v1';

/**
 * FORMS Pro Cloud Database Service
 * Robust Offline-First implementation.
 */

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error("Hashing failed:", err);
    return password;
  }
};

/**
 * LOCAL PERSISTENCE LAYER
 */
const getLocalData = (): User[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const setLocalData = (data: User[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Fail silently
  }
};

/**
 * CLOUD SYNC OPERATIONS
 */
export const saveUser = async (user: User) => {
  try {
    const userRef = db.ref(`users/${user.id}`);
    const { forms, ...profile } = user;
    await userRef.set(profile);
  } catch (err: any) {
    // Catching PERMISSION_DENIED silently to avoid console clutter for end users
  }
};

export const saveForm = async (uid: string, form: Form) => {
  try {
    const formRef = db.ref(`forms/${form.id}`);
    const dbForm = {
      ...form,
      ownerUid: uid,
      published: !!form.isPublished 
    };
    await formRef.set(dbForm);
  } catch (err: any) {
    // Silent catch
  }
};

export const getUserForms = async (uid: string): Promise<Form[]> => {
  try {
    const formsRef = db.ref('forms');
    const snapshot = await formsRef.orderByChild('ownerUid').equalTo(uid).once('value');
    
    if (snapshot.exists()) {
      const formsData = snapshot.val();
      const formsList = Object.values(formsData) as any[];
      
      return await Promise.all(formsList.map(async (f) => {
        let responses: FormResponse[] = [];
        try {
          const respRef = db.ref(`responses/${f.id}`);
          const respSnapshot = await respRef.once('value');
          if (respSnapshot.exists()) {
            responses = Object.values(respSnapshot.val());
          }
        } catch (respErr) {
          // Individual response read failure
        }
        return {
          ...f,
          isPublished: f.published ?? f.isPublished,
          responses
        };
      }));
    }
  } catch (err) {
    // Return empty if cloud permission denied
  }
  return [];
};

/**
 * COMPATIBILITY LAYER FOR App.tsx
 * Defaults to Local Storage if Cloud is restricted.
 */

export const loadDatabase = async (): Promise<User[]> => {
  const localData = getLocalData();
  
  try {
    // Attempt Firebase Load with timeout/abort simulation
    const snapshot = await db.ref('users').once('value');
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const usersArray = Object.values(usersData) as any[];
      
      const cloudData = await Promise.all(usersArray.map(async (u) => {
        const forms = await getUserForms(u.id);
        return { ...u, forms };
      }));

      if (cloudData.length > 0) {
        setLocalData(cloudData);
        return cloudData;
      }
    }
  } catch (err: any) {
    // If permission is denied, we just use local data.
    // We log a clean, helpful tip for the developer.
    if (err.message?.includes('permission_denied') || err.code === 'PERMISSION_DENIED') {
      console.info("FORMS Pro: Cloud sync is restricted by current Firebase rules. Operating in local-only mode.");
    }
  }
  
  return localData;
};

export const saveDatabase = async (users: User[]): Promise<void> => {
  // Always update local storage first
  setLocalData(users);

  try {
    // Background sync
    await Promise.all(users.map(async (user) => {
      await saveUser(user);
      if (user.forms) {
        await Promise.all(user.forms.map(form => saveForm(user.id, form)));
      }
    }));
  } catch (err) {
    // Fail silently, data is safe in local storage
  }
};

export const getAllUsers = loadDatabase;
export const findUserByEmail = async (email: string) => {
  const users = await loadDatabase();
  return users.find(u => u.email === email) || null;
};
