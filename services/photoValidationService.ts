import * as ImagePicker from 'expo-image-picker';
import photoHuntService from './photoHuntService';
import { PhotoSubmissionResponse } from '~/types/api';

export interface PhotoValidationResult {
  isValid: boolean;
  similarityScore: number;
  confidenceScore: number;
  notes: string;
  aiResponse: string;
}

export interface CameraOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

class PhotoValidationService {
  // Request camera permissions
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  // Request media library permissions
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  // Take photo with camera
  async takePhoto(options: CameraOptions = {}): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  // Pick photo from library
  async pickPhotoFromLibrary(options: CameraOptions = {}): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new Error('Media library permission denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error picking photo:', error);
      throw error;
    }
  }

  // Upload image and submit for validation
  async submitPhotoForValidation(
    photohuntId: string,
    imageUri: string
  ): Promise<PhotoValidationResult> {
    try {
      // First upload the image to get a URL
      const imageUrl = await photoHuntService.uploadImage(imageUri);

      // Then submit for validation
      const response: PhotoSubmissionResponse = await photoHuntService.submitPhoto(
        photohuntId,
        imageUrl
      );

      return {
        isValid: response.validation.is_valid,
        similarityScore: response.validation.similarity_score,
        confidenceScore: response.validation.confidence_score,
        notes: response.validation.notes,
        aiResponse: response.validation.ai_response,
      };
    } catch (error: any) {
      console.error('Error submitting photo for validation:', error);
      throw new Error(error.message || 'Failed to submit photo for validation');
    }
  }

  // Complete photo validation flow
  async validatePhoto(
    photohuntId: string,
    source: 'camera' | 'library' = 'camera',
    options: CameraOptions = {}
  ): Promise<PhotoValidationResult> {
    try {
      let imageUri: string | null = null;

      // Get photo from camera or library
      if (source === 'camera') {
        imageUri = await this.takePhoto(options);
      } else {
        imageUri = await this.pickPhotoFromLibrary(options);
      }

      if (!imageUri) {
        throw new Error('No photo selected');
      }

      // Submit for validation
      return await this.submitPhotoForValidation(photohuntId, imageUri);
    } catch (error: any) {
      console.error('Error in photo validation flow:', error);
      throw error;
    }
  }

  // Get validation history for a PhotoHunt
  async getValidationHistory(photohuntId: string): Promise<PhotoSubmissionResponse[]> {
    try {
      const completions = await photoHuntService.getUserCompletions();
      return completions
        .filter((completion) => completion.photohunt === photohuntId)
        .map((completion) => ({
          completion,
          validation: {
            similarity_score: completion.validation_score || 0,
            confidence_score: 0, // This would need to be fetched from validation details
            is_valid: completion.is_valid,
            notes: completion.validation_notes,
            prompt: '',
            ai_response: '',
          },
        }));
    } catch (error: any) {
      console.error('Error fetching validation history:', error);
      throw new Error(error.message || 'Failed to fetch validation history');
    }
  }

  // Format validation result for display
  formatValidationResult(result: PhotoValidationResult): {
    status: 'success' | 'warning' | 'error';
    message: string;
    details: string;
  } {
    if (result.isValid) {
      return {
        status: 'success',
        message: 'Photo validated successfully!',
        details: `Similarity: ${Math.round(result.similarityScore * 100)}% | Confidence: ${Math.round(result.confidenceScore * 100)}%`,
      };
    } else if (result.similarityScore > 0.5) {
      return {
        status: 'warning',
        message: 'Photo partially matches',
        details: `Similarity: ${Math.round(result.similarityScore * 100)}% | ${result.notes}`,
      };
    } else {
      return {
        status: 'error',
        message: 'Photo does not match',
        details: result.notes || 'Please try taking a photo that better matches the reference.',
      };
    }
  }
}

export default new PhotoValidationService();
