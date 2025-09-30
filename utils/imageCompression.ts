import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  size: number; // in bytes
}

export interface CompressionOptions {
  maxSizeKB?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Compress an image to be under the specified size limit while maintaining aspect ratio
 */
export async function compressImage(
  imageUri: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxSizeKB = 500, quality = 0.8, maxWidth = 1920, maxHeight = 1920 } = options;

  const maxSizeBytes = maxSizeKB * 1024;
  let currentQuality = quality;
  let currentWidth = maxWidth;
  let currentHeight = maxHeight;

  // First, get the original image dimensions
  const originalImage = await ImageManipulator.manipulateAsync(imageUri, [], {
    format: ImageManipulator.SaveFormat.JPEG,
  });

  // Calculate the aspect ratio
  const aspectRatio = originalImage.width / originalImage.height;

  // Determine the target dimensions while maintaining aspect ratio
  if (aspectRatio > 1) {
    // Landscape
    currentHeight = Math.min(maxHeight, Math.round(maxWidth / aspectRatio));
  } else {
    // Portrait or square
    currentWidth = Math.min(maxWidth, Math.round(maxHeight * aspectRatio));
  }

  // Start with the calculated dimensions and high quality
  let result = await ImageManipulator.manipulateAsync(
    imageUri,
    [
      {
        resize: {
          width: currentWidth,
          height: currentHeight,
        },
      },
    ],
    {
      format: ImageManipulator.SaveFormat.JPEG,
      compress: currentQuality,
    }
  );

  // Check file size and reduce quality if needed
  let attempts = 0;
  const maxAttempts = 10;

  while (result.size > maxSizeBytes && attempts < maxAttempts) {
    attempts++;

    // Reduce quality by 0.1 each time
    currentQuality = Math.max(0.1, currentQuality - 0.1);

    // If quality is very low, also reduce dimensions
    if (currentQuality <= 0.3) {
      currentWidth = Math.round(currentWidth * 0.8);
      currentHeight = Math.round(currentHeight * 0.8);
    }

    result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: currentWidth,
            height: currentHeight,
          },
        },
      ],
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: currentQuality,
      }
    );
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    size: result.size || 0,
  };
}

/**
 * Compress an image for avatar use (1:1 aspect ratio)
 */
export async function compressAvatarImage(
  imageUri: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxSizeKB = 500, quality = 0.8, maxWidth = 512, maxHeight = 512 } = options;

  const maxSizeBytes = maxSizeKB * 1024;
  let currentQuality = quality;
  let currentSize = Math.min(maxWidth, maxHeight);

  // Start with square dimensions and high quality
  let result = await ImageManipulator.manipulateAsync(
    imageUri,
    [
      {
        resize: {
          width: currentSize,
          height: currentSize,
        },
      },
    ],
    {
      format: ImageManipulator.SaveFormat.JPEG,
      compress: currentQuality,
    }
  );

  // Check file size and reduce quality/size if needed
  let attempts = 0;
  const maxAttempts = 10;

  while (result.size > maxSizeBytes && attempts < maxAttempts) {
    attempts++;

    // Reduce quality by 0.1 each time
    currentQuality = Math.max(0.1, currentQuality - 0.1);

    // If quality is very low, also reduce dimensions
    if (currentQuality <= 0.3) {
      currentSize = Math.round(currentSize * 0.8);
    }

    result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: currentSize,
            height: currentSize,
          },
        },
      ],
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: currentQuality,
      }
    );
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    size: result.size || 0,
  };
}

/**
 * Compress an image for photo hunt reference images (preserve aspect ratio)
 */
export async function compressPhotoHuntImage(
  imageUri: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  return compressImage(imageUri, {
    maxSizeKB: 500,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
    ...options,
  });
}

/**
 * Compress an image for photo submission (preserve aspect ratio)
 */
export async function compressPhotoSubmissionImage(
  imageUri: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  return compressImage(imageUri, {
    maxSizeKB: 500,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
    ...options,
  });
}

/**
 * Get file size in KB from a file URI
 */
export async function getFileSizeKB(fileUri: string): Promise<number> {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    return Math.round(blob.size / 1024);
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
}
