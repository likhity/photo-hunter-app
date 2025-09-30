import apiClient from './apiClient';

import { API_CONFIG } from '~/config/api';
import {
  PhotoHunt,
  PhotoHuntCreateRequest,
  PhotoHuntListParams,
  PhotoHuntCompletion,
  PhotoSubmissionRequest,
  PhotoSubmissionResponse,
  NearbyPhotoHuntsRequest,
} from '~/types/api';
import { compressPhotoSubmissionImage } from '~/utils/imageCompression';

export interface CreatePhotoHuntData {
  name: string;
  description: string;
  lat: number;
  long: number;
  referenceImage?:
    | string
    | {
        uri: string;
        type: string;
        name: string;
      };
  difficulty?: number; // Float from 0-5
  hint?: string; // Optional hint text
  orientation?: 'portrait' | 'landscape';
}

class PhotoHuntService {
  // Get all PhotoHunts with optional filtering
  async getAllPhotoHunts(params?: PhotoHuntListParams): Promise<PhotoHunt[]> {
    try {
      const response = await apiClient.get<{ results: PhotoHunt[] }>(
        API_CONFIG.ENDPOINTS.PHOTOHUNTS.LIST,
        params
      );
      return response?.data?.results || [];
    } catch (error: any) {
      console.error('Error fetching PhotoHunts:', error);
      throw new Error(error.message || 'Failed to fetch PhotoHunts');
    }
  }

  // Get PhotoHunt by ID
  async getPhotoHuntById(id: string): Promise<PhotoHunt> {
    try {
      const response = await apiClient.get<PhotoHunt>(API_CONFIG.ENDPOINTS.PHOTOHUNTS.DETAIL(id));
      if (response.data) {
        return response.data;
      }
      throw new Error('PhotoHunt not found');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch PhotoHunt');
    }
  }

  // Get user-generated PhotoHunts
  async getUserGeneratedPhotoHunts(): Promise<PhotoHunt[]> {
    return this.getAllPhotoHunts({ user_generated: true });
  }

  // Get PhotoHunts created by current user
  async getUserPhotoHunts(): Promise<PhotoHunt[]> {
    try {
      const response = await apiClient.get<{ results: PhotoHunt[] }>(
        API_CONFIG.ENDPOINTS.PHOTOHUNTS.MY
      );
      return response.data?.results || [];
    } catch (error: any) {
      console.error('Error fetching user PhotoHunts:', error);
      throw new Error(error.message || 'Failed to fetch user PhotoHunts');
    }
  }

  // Create new PhotoHunt
  async createPhotoHunt(data: CreatePhotoHuntData): Promise<PhotoHunt> {
    try {
      // Check if referenceImage is a file object (for multipart upload) or string (for URL)
      const isFileObject =
        data.referenceImage &&
        typeof data.referenceImage === 'object' &&
        'uri' in data.referenceImage;

      if (isFileObject) {
        // Use multipart form data for file upload
        const file = data.referenceImage as { uri: string; type: string; name: string };

        console.log('Creating PhotoHunt with file upload:', {
          name: data.name,
          description: data.description,
          lat: data.lat,
          long: data.long,
          file: {
            uri: file.uri,
            type: file.type,
            name: file.name,
          },
          endpoint: API_CONFIG.ENDPOINTS.PHOTOHUNTS.CREATE,
        });

        const response = await apiClient.uploadFile<PhotoHunt>(
          API_CONFIG.ENDPOINTS.PHOTOHUNTS.CREATE,
          file,
          {
            name: data.name,
            description: data.description,
            lat: data.lat,
            long: data.long,
            difficulty: data.difficulty,
            hint: data.hint,
            orientation: data.orientation,
          }
        );

        if (response.data) {
          return response.data;
        }
        throw new Error('Failed to create PhotoHunt');
      } else {
        // Use JSON for URL-based reference image
        const requestData: PhotoHuntCreateRequest = {
          name: data.name,
          description: data.description,
          latitude: data.lat,
          longitude: data.long,
          reference_image: data.referenceImage as string,
          difficulty: data.difficulty,
          hint: data.hint,
          orientation: data.orientation,
        };

        // Log the request data being sent
        console.log('Creating PhotoHunt with data:', {
          name: requestData.name,
          description: requestData.description,
          latitude: requestData.latitude,
          longitude: requestData.longitude,
          reference_image: requestData.reference_image ? 'Present' : 'Not provided',
          endpoint: API_CONFIG.ENDPOINTS.PHOTOHUNTS.CREATE,
        });

        // Pretty print the full request data
        console.log('Pretty printed request data:', JSON.stringify(requestData, null, 2));

        const response = await apiClient.post<PhotoHunt>(
          API_CONFIG.ENDPOINTS.PHOTOHUNTS.CREATE,
          requestData
        );
        if (response.data) {
          return response.data;
        }
        throw new Error('Failed to create PhotoHunt');
      }
    } catch (error: any) {
      // Enhanced error logging for photo hunt creation
      console.error('PhotoHunt creation failed:', {
        error: error.message,
        status: error.status,
        details: error.details,
        requestData: {
          name: data.name,
          description: data.description,
          lat: data.lat,
          long: data.long,
          referenceImage: data.referenceImage ? 'Present' : 'Not provided',
        },
      });

      // Pretty print the error details and request data
      console.error('Pretty printed error details:', JSON.stringify(error.details, null, 2));
      console.error(
        'Pretty printed request data:',
        JSON.stringify(
          {
            name: data.name,
            description: data.description,
            lat: data.lat,
            long: data.long,
            referenceImage: data.referenceImage,
          },
          null,
          2
        )
      );
      throw new Error(error.message || 'Failed to create PhotoHunt');
    }
  }

  // Update PhotoHunt (text fields only)
  async updatePhotoHunt(id: string, data: Partial<CreatePhotoHuntData>): Promise<PhotoHunt> {
    try {
      const requestData: Partial<PhotoHuntCreateRequest> = {};

      if (data.name) requestData.name = data.name;
      if (data.description) requestData.description = data.description;
      if (data.lat !== undefined) requestData.latitude = data.lat;
      if (data.long !== undefined) requestData.longitude = data.long;
      if (data.referenceImage !== undefined)
        requestData.reference_image = data.referenceImage as string;
      if (data.difficulty !== undefined) requestData.difficulty = data.difficulty;
      if (data.hint !== undefined) requestData.hint = data.hint;

      const response = await apiClient.patch<PhotoHunt>(
        API_CONFIG.ENDPOINTS.PHOTOHUNTS.UPDATE(id),
        requestData
      );
      if (response.data) {
        return response.data;
      }
      throw new Error('Failed to update PhotoHunt');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update PhotoHunt');
    }
  }

  // Update PhotoHunt with image replacement
  async updatePhotoHuntWithImage(
    id: string,
    data: Partial<CreatePhotoHuntData>
  ): Promise<PhotoHunt> {
    try {
      // Check if referenceImage is a file object (for multipart upload) or string (for URL)
      const isFileObject =
        data.referenceImage &&
        typeof data.referenceImage === 'object' &&
        'uri' in data.referenceImage;

      if (isFileObject) {
        // Use multipart form data for file upload
        const file = data.referenceImage as { uri: string; type: string; name: string };

        const response = await apiClient.uploadFile<PhotoHunt>(
          API_CONFIG.ENDPOINTS.PHOTOHUNTS.UPDATE(id),
          file,
          {
            name: data.name,
            description: data.description,
            lat: data.lat,
            long: data.long,
            difficulty: data.difficulty,
            hint: data.hint,
          },
          'reference_image_file',
          'PATCH'
        );

        if (response.data) {
          return response.data;
        }
        throw new Error('Failed to update PhotoHunt with image');
      } else {
        // Use regular update if no image file
        return this.updatePhotoHunt(id, data);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update PhotoHunt');
    }
  }

  // Delete PhotoHunt
  async deletePhotoHunt(id: string): Promise<boolean> {
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.PHOTOHUNTS.DELETE(id));
      return true;
    } catch (error: any) {
      console.error('Error deleting PhotoHunt:', error);
      throw new Error(error.message || 'Failed to delete PhotoHunt');
    }
  }

  // Get nearby PhotoHunts
  async getNearbyPhotoHunts(lat: number, lng: number, radius?: number): Promise<PhotoHunt[]> {
    try {
      const params: NearbyPhotoHuntsRequest = { lat, lng };
      if (radius) params.radius = radius;

      const response = await apiClient.get<{ results: PhotoHunt[] }>(
        API_CONFIG.ENDPOINTS.PHOTOHUNTS.NEARBY,
        params
      );
      return response.data?.results || [];
    } catch (error: any) {
      console.error('Error fetching nearby PhotoHunts:', error);
      throw new Error(error.message || 'Failed to fetch nearby PhotoHunts');
    }
  }

  // Submit photo for validation using multipart form data
  async submitPhoto(photohuntId: string, imageUri: string): Promise<PhotoSubmissionResponse> {
    try {
      // Compress the image for photo submission (preserve aspect ratio, under 500KB)
      const compressedImage = await compressPhotoSubmissionImage(imageUri, {
        maxSizeKB: 500,
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      });

      console.log(`Photo submission compressed: ${Math.round(compressedImage.size / 1024)}KB`);

      const photoFile = {
        uri: compressedImage.uri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      };

      const response = await apiClient.uploadFile<PhotoSubmissionResponse>(
        API_CONFIG.ENDPOINTS.PHOTOS.SUBMIT,
        photoFile,
        {
          photohunt_id: photohuntId,
        },
        'photo' // Use 'photo' as the field name for the backend
      );

      if (response.data) {
        return response.data;
      }
      throw new Error('Failed to submit photo');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit photo');
    }
  }

  // Get user's PhotoHunt completions
  async getUserCompletions(): Promise<PhotoHuntCompletion[]> {
    try {
      const response = await apiClient.get<{ results: PhotoHuntCompletion[] }>(
        API_CONFIG.ENDPOINTS.COMPLETIONS.LIST
      );
      return response.data?.results || [];
    } catch (error: any) {
      console.error('Error fetching completions:', error);
      throw new Error(error.message || 'Failed to fetch completions');
    }
  }

  // Upload image to S3 (if you have an upload endpoint)
  async uploadImage(imageUri: string, type: string = 'image/jpeg'): Promise<string> {
    try {
      // Compress the image before upload (preserve aspect ratio, under 500KB)
      const compressedImage = await compressPhotoSubmissionImage(imageUri, {
        maxSizeKB: 500,
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      });

      console.log(`Image upload compressed: ${Math.round(compressedImage.size / 1024)}KB`);

      const response = await apiClient.uploadFile<{ url: string }>('/upload/', {
        uri: compressedImage.uri,
        type,
        name: `photo_${Date.now()}.jpg`,
      });

      if (response.data?.url) {
        return response.data.url;
      }
      throw new Error('Failed to upload image');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload image');
    }
  }
}

export default new PhotoHuntService();
