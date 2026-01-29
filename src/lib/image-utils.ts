/**
 * Compress and resize an image file for upload
 * @param file - The image file to compress
 * @param maxSize - Maximum width/height in pixels (default: 400)
 * @returns Promise<Blob> - The compressed image as a JPEG blob
 */
export async function compressImage(file: File, maxSize = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate scale to fit within maxSize while preserving aspect ratio
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        
        // Draw the image onto the canvas
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to JPEG blob with 85% quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (error) {
        reject(error);
      } finally {
        // Clean up the object URL
        URL.revokeObjectURL(img.src);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate an image file before upload
 * @param file - The file to validate
 * @returns { valid: boolean, error?: string }
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a JPG, PNG, or WebP image' };
  }
  
  if (file.size > maxFileSize) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }
  
  return { valid: true };
}
