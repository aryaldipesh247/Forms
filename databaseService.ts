
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import { db } from "./firebase";
import { User, Form, FormResponse } from '../types';

const STORAGE_KEY = 'forms_pro_cloud_sync_v1';

/**
 * Utility to remove undefined properties from objects recursively.
 * Firebase Realtime Database throws errors if any property in the object tree is 'undefined'.
 */
const sanitizeForFirebase = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj));
};

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
  } catch (e) { }
};

export const saveUser = async (user: User) => {
  try {
    const userRef = db.ref(`users/${user.id}`);
    const { forms, ...profile } = user;
    // Sanitize to remove any undefined fields (like optional phone)
    await userRef.set(sanitizeForFirebase(profile));
  } catch (err: any) { }
};

export const saveResponse = async (formId: string, response: FormResponse) => {
  try {
    const respRef = db.ref(`responses/${formId}/${response.id}`);
    await respRef.set(sanitizeForFirebase(response));
    await db.ref(`forms/${formId}/lastActivity`).set(new Date().toISOString());
    return true;
  } catch (e) {
    console.error("Firebase Response Save Failed:", e);
    return false;
  }
};

export const clearFormResponses = async (formId: string) => {
  try {
    await db.ref(`responses/${formId}`).remove();
    return true;
  } catch (e) {
    console.error("Firebase Response Clear Failed:", e);
    return false;
  }
};

export const getFormById = async (formId: string): Promise<Form | null> => {
  try {
    const formRef = db.ref(`forms/${formId}`);
    const snapshot = await formRef.once('value');
    
    if (snapshot.exists()) {
      const f = snapshot.val();
      const respSnapshot = await db.ref(`responses/${f.id}`).once('value');
      const responses = respSnapshot.exists() ? Object.values(respSnapshot.val()) : [];
      
      const rawQuestions = f.questions || [];
      const cleanedQuestions = Array.isArray(rawQuestions) ? rawQuestions : Object.values(rawQuestions);
      const rawDescriptions = f.descriptions || [];
      const cleanedDescriptions = Array.isArray(rawDescriptions) ? rawDescriptions : Object.values(rawDescriptions);

      return {
        ...f,
        isPublished: f.published ?? f.isPublished ?? false,
        responses: responses as FormResponse[],
        questions: cleanedQuestions.map((q: any) => ({
          ...q,
          options: q.options ? (Array.isArray(q.options) ? q.options : Object.values(q.options)) : []
        })),
        descriptions: cleanedDescriptions
      } as Form;
    }
  } catch (e) {
    console.error("GetFormById failed:", e);
  }
  return null;
};

export const deleteFormPermanently = async (formId: string) => {
  try {
    await db.ref(`forms/${formId}`).remove();
    await db.ref(`responses/${formId}`).remove();
    return true;
  } catch (e) {
    console.error("Permanent delete failed:", e);
    return false;
  }
};

export const deleteUserCompletely = async (userId: string, forms: Form[]) => {
  try {
    await db.ref(`users/${userId}`).remove();
    if (forms && forms.length > 0) {
      await Promise.all(forms.map(f => db.ref(`forms/${f.id}`).remove()));
      await Promise.all(forms.map(f => db.ref(`responses/${f.id}`).remove()));
    }
    const local = getLocalData();
    const filtered = local.filter(u => u.id !== userId);
    setLocalData(filtered);
  } catch (err) { }
};

export const saveForm = async (uid: string, form: Form) => {
  try {
    const formRef = db.ref(`forms/${form.id}`);
    // Exclude 'responses' to prevent bloating the form node, 
    // but include 'archivedResponseSets' so metadata about deleted responses persists.
    const { responses, ...formWithoutResponses } = form;
    
    const dbForm = sanitizeForFirebase({
      ...formWithoutResponses,
      ownerUid: uid,
      published: !!form.isPublished,
      lastActivity: new Date().toISOString()
    });
    
    await formRef.set(dbForm);
  } catch (err: any) {
    console.error("Firebase Form Save Failed:", err);
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
          const respSnapshot = await db.ref(`responses/${f.id}`).once('value');
          if (respSnapshot.exists()) {
            responses = Object.values(respSnapshot.val());
          }
        } catch (respErr) { }
        
        const qList = f.questions ? (Array.isArray(f.questions) ? f.questions : Object.values(f.questions)) : [];
        const dList = f.descriptions ? (Array.isArray(f.descriptions) ? f.descriptions : Object.values(f.descriptions)) : [];
        const aList = f.archivedResponseSets ? (Array.isArray(f.archivedResponseSets) ? f.archivedResponseSets : Object.values(f.archivedResponseSets)) : [];

        return {
          ...f,
          questions: qList.map((q: any) => ({ 
            ...q, 
            options: q.options ? (Array.isArray(q.options) ? q.options : Object.values(q.options)) : [] 
          })),
          descriptions: dList,
          archivedResponseSets: aList,
          isPublished: f.published ?? f.isPublished ?? false,
          responses: responses || []
        } as Form;
      }));
    }
  } catch (err) { }
  return [];
};

export const loadDatabase = async (): Promise<User[]> => {
  const localData = getLocalData();
  try {
    const snapshot = await db.ref('users').once('value');
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const usersArray = Object.values(usersData) as any[];
      const cloudData = await Promise.all(usersArray.map(async (u) => {
        const forms = await getUserForms(u.id);
        return { ...u, forms: forms || [] } as User;
      }));
      if (cloudData.length > 0) {
        setLocalData(cloudData);
        return cloudData;
      }
    }
  } catch (err: any) { }
  return localData;
};

export const saveDatabase = async (users: User[]): Promise<void> => {
  setLocalData(users);
  try {
    await Promise.all(users.map(async (user) => {
      await saveUser(user);
      if (user.forms) {
        await Promise.all(user.forms.map(form => saveForm(user.id, form)));
      }
    }));
  } catch (err) { }
};
