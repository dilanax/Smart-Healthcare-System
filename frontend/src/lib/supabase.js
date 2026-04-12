import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings
const SUPABASE_URL = 'https://YOUR_PROJECT_URL.supabase.co';  // CHANGE THIS
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';  // CHANGE THIS

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to upload image to Supabase
export const uploadDoctorImage = async (file) => {
  try {
    if (!file) {
      throw new Error('No file selected');
    }

    // Generate unique filename: doctor-image-[timestamp]-[random]
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `doctor-image-${timestamp}-${random}.jpg`;

    // Upload to Supabase storage in 'doctor-images' bucket
    const { data, error } = await supabase.storage
      .from('doctor-images')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from('doctor-images')
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
    if (!imageUrl) return;

    // Extract filename from URL
    const fileName = imageUrl.split('/').pop();

    const { error } = await supabase.storage
      .from('doctor-images')
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
    }
  } catch (err) {
    console.error('Image deletion error:', err);
  }
};
