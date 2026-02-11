
/**
 * Cloudinary Service for Forms PRO
 * Switched to Unsigned Uploads to prevent exposing API_SECRET.
 */

const CLOUD_NAME = 'dzf6p3gmk';
const UPLOAD_PRESET = 'ml_default'; // Ensure this preset is set to 'Unsigned' in Cloudinary Settings

export const uploadToCloudinary = async (
  file: File | Blob | string, 
  resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

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

// Global DB sync via Cloudinary is now fallback; Firebase is primary.
export const syncDatabaseToCloudinary = async (users: any): Promise<string> => {
  const dbContent = { version: '1.4', updatedAt: new Date().toISOString(), users };
  const jsonBlob = new Blob([JSON.stringify(dbContent)], { type: 'application/json' });
  return uploadToCloudinary(jsonBlob, 'raw');
};