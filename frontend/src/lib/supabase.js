import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const SUPABASE_DOCTOR_IMAGES_BUCKET =
  import.meta.env.VITE_SUPABASE_DOCTOR_IMAGES_BUCKET?.trim() || 'doctor-images';

let supabaseClient = null;

const assertSupabaseConfig = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local.',
    );
  }
};

const getSupabaseClient = () => {
  assertSupabaseConfig();
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
};

const getFileExtension = (file) => {
  const fileName = file?.name || '';
  const parts = fileName.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }
  return 'jpg';
};

// Function to upload image to Supabase
export const uploadDoctorImage = async (file) => {
  try {
    const supabase = getSupabaseClient();

    if (!file) {
      throw new Error('No file selected');
    }

    // Generate unique filename: doctor-image-[timestamp]-[random]
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = getFileExtension(file);
    const fileName = `doctor-image-${timestamp}-${random}.${extension}`;

    // Upload to Supabase storage in 'doctor-images' bucket
    const { error } = await supabase.storage
      .from(SUPABASE_DOCTOR_IMAGES_BUCKET)
      .upload(fileName, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from(SUPABASE_DOCTOR_IMAGES_BUCKET)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Image upload error:', err);
    throw err;
  }
};

// Function to delete image from Supabase
export const deleteDoctorImage = async (imageUrl) => {
  try {
    const supabase = getSupabaseClient();

    if (!imageUrl) return;

    // Extract filename from URL
    const fileName = imageUrl.split('/').pop();

    const { error } = await supabase.storage
      .from(SUPABASE_DOCTOR_IMAGES_BUCKET)
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
    }
  } catch (err) {
    console.error('Image deletion error:', err);
  }
};
