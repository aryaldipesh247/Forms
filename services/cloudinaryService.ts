
/**
 * Cloudinary Service for Forms PRO
 * Upgraded for centralized multi-device persistence.
 */

const CLOUD_NAME = 'dzf6p3gmk';
const API_KEY = '887598222425235';
const API_SECRET = 'DdduNlwD4r0hgt3f_drmX9pXui0';
const UPLOAD_PRESET = 'ml_default'; 
const DB_PUBLIC_ID = 'forms_pro_data_global_v3'; // Unique identifier for global sync

async function generateSignature(params: Record<string, string>, secret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&') + secret;

  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const uploadToCloudinary = async (
  file: File | Blob | string, 
  resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto',
  customPublicId?: string
): Promise<string> => {
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  
  const paramsToSign: Record<string, string> = {
    timestamp: timestamp,
    upload_preset: UPLOAD_PRESET,
  };
  
  if (customPublicId) {
    paramsToSign['public_id'] = customPublicId;
    paramsToSign['invalidate'] = 'true';
  }

  const signature = await generateSignature(paramsToSign, API_SECRET);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  
  if (customPublicId) {
    formData.append('public_id', customPublicId);
    formData.append('invalidate', 'true');
  }

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Upload failed.');
    return data.secure_url;
  } catch (error) {
    console.error(`Cloudinary Error [${resourceType}]:`, error);
    throw error;
  }
};

export const uploadImageToCloudinary = (file: File | string) => uploadToCloudinary(file, 'image');

export const syncDatabaseToCloudinary = async (users: any): Promise<string> => {
  const dbContent = {
    version: '1.3',
    updatedAt: new Date().toISOString(),
    users: users
  };
  const jsonBlob = new Blob([JSON.stringify(dbContent)], { type: 'application/json' });
  return uploadToCloudinary(jsonBlob, 'raw', DB_PUBLIC_ID);
};

export const fetchDatabaseFromCloud = async (): Promise<any | null> => {
  try {
    // FIXED: Use query parameter for cache busting instead of an invalid version number in the path
    // Cloudinary raw files are served from /raw/upload/{public_id}
    const url = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${DB_PUBLIC_ID}?t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Cloud database not found or inaccessible (Status: ${response.status})`);
      return null;
    }
    const data = await response.json();
    return data.users || null;
  } catch (e) {
    console.warn("Cloud fetch failed due to network or parsing error:", e);
    return null;
  }
};
