export interface ResizedImage {
  resizedFile: File;
  previewUrl: string;
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_SIZE = 120;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and WEBP images are allowed' };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Image size must be less than 5MB' };
  }

  return { valid: true };
};

export const resizeImageTo120x120 = async (file: File): Promise<ResizedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        const targetSize = PRODUCT_IMAGE_SIZE;
        canvas.width = targetSize;
        canvas.height = targetSize;

        const aspectRatio = img.width / img.height;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        if (aspectRatio > 1) {
          sourceWidth = img.height;
          sourceX = (img.width - img.height) / 2;
        } else if (aspectRatio < 1) {
          sourceHeight = img.width;
          sourceY = (img.height - img.width) / 2;
        }

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetSize,
          targetSize
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create resized image blob'));
              return;
            }

            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);

            resolve({
              resizedFile,
              previewUrl,
            });
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

export const cleanupImagePreviews = (previews: string[]) => {
  previews.forEach((preview) => {
    if (preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
  });
};
