/**
 * Cloudinary Service for Forms PRO
 * Upgraded to SIGNED UPLOADS to resolve "whitelisted preset" errors.
 */

const CLOUD_NAME = 'dzf6p3gmk';
const API_KEY = '887598222425235';
const API_SECRET = 'DdduNlwD4r0hgt3f_drmX9pXui0';
const UPLOAD_PRESET = 'ml_default'; 

/**
 * Generates a SHA-1 signature for Cloudinary Signed Uploads.
 * Required when the upload preset is not explicitly set to "Unsigned".
 */
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

/**
 * Robust Signed Upload function.
 */
export const uploadToCloudinary = async (
  file: File | Blob | string, 
  resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'
): Promise<string> => {
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  
  // Parameters that must be signed
  const paramsToSign = {
    timestamp: timestamp,
    upload_preset: UPLOAD_PRESET,
  };

  const signature = await generateSignature(paramsToSign, API_SECRET);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cloudinary Signed Upload Error:', data);
      throw new Error(data.error?.message || 'Cloudinary upload failed.');
    }

    return data.secure_url;
  } catch (error) {
    console.error(`Cloudinary Error [${resourceType}]:`, error);
    throw error;
  }
};

/**
 * Specifically for images (user photos, form logos, backgrounds).
 */
export const uploadImageToCloudinary = (file: File | string) => uploadToCloudinary(file, 'image');

/**
 * Syncs the entire application state (JSON) to Cloudinary.
 */
export const syncDatabaseToCloudinary = async (data: any): Promise<string> => {
  const dbContent = {
    version: '1.1',
    app: 'Forms PRO',
    updatedAt: new Date().toISOString(),
    users: data
  };
  
  const jsonString = JSON.stringify(dbContent);
  const jsonBlob = new Blob([jsonString], { type: 'application/json' });
  
  // RAW is used for non-media files like JSON
  return uploadToCloudinary(jsonBlob, 'raw');
};
