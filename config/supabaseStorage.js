const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://pbnbbtxugtoedovgvqst.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase Storage initialized');
} else {
  console.warn('⚠️ Supabase key not found - Storage will not work');
}

/**
 * Upload image to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL of uploaded image
 */
async function uploadImage(fileBuffer, fileName, contentType) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const bucketName = 'carbon-cases-images';
  
  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType,
      upsert: false
    });

  if (error) {
    console.error('❌ Supabase upload error:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  console.log('✅ Image uploaded to Supabase:', publicUrl);
  return publicUrl;
}

/**
 * Delete image from Supabase Storage
 * @param {string} imageUrl - Full URL of the image
 * @returns {Promise<void>}
 */
async function deleteImage(imageUrl) {
  if (!supabase || !imageUrl) return;

  try {
    // Extract file name from URL
    const fileName = imageUrl.split('/').pop();
    const bucketName = 'carbon-cases-images';

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      console.error('❌ Error deleting image:', error);
    } else {
      console.log('✅ Image deleted from Supabase:', fileName);
    }
  } catch (error) {
    console.error('❌ Error in deleteImage:', error);
  }
}

module.exports = {
  supabase,
  uploadImage,
  deleteImage
};
